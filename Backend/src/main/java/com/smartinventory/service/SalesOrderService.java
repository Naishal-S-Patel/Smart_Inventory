package com.smartinventory.service;

import com.smartinventory.dto.CreateSalesOrderRequest;
import com.smartinventory.dto.InventoryAdjustmentRequest;
import com.smartinventory.dto.SalesOrderDTO;
import com.smartinventory.dto.SalesOrderItemCreateRequest;
import com.smartinventory.entity.Customer;
import com.smartinventory.entity.InventoryTransactionType;
import com.smartinventory.entity.PaymentMethod;
import com.smartinventory.entity.PaymentStatus;
import com.smartinventory.entity.Product;
import com.smartinventory.entity.SalesOrder;
import com.smartinventory.entity.SalesOrderItem;
import com.smartinventory.entity.SalesOrderStatus;
import com.smartinventory.entity.User;
import com.smartinventory.entity.Warehouse;
import com.smartinventory.exception.CustomerNotFoundException;
import com.smartinventory.exception.InvalidSalesOrderStateException;
import com.smartinventory.exception.ProductNotFoundException;
import com.smartinventory.exception.SalesOrderNotFoundException;
import com.smartinventory.exception.WarehouseNotFoundException;
import com.smartinventory.mapper.SalesOrderMapper;
import com.smartinventory.repository.CustomerRepository;
import com.smartinventory.repository.ProductRepository;
import com.smartinventory.repository.SalesOrderRepository;
import com.smartinventory.repository.UserRepository;
import com.smartinventory.repository.WarehouseRepository;
import com.smartinventory.security.UserPrincipal;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class SalesOrderService {

    private static final String ORDER_NUMBER_PREFIX = "SO";
    private static final String REFERENCE_TYPE = "SALES_ORDER";

    private final SalesOrderRepository salesOrderRepository;
    private final CustomerRepository customerRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;
    private final SalesOrderMapper salesOrderMapper;
    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;

    public SalesOrderService(
            SalesOrderRepository salesOrderRepository,
            CustomerRepository customerRepository,
            WarehouseRepository warehouseRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            InventoryService inventoryService,
            SalesOrderMapper salesOrderMapper,
            JdbcTemplate jdbcTemplate,
            Clock clock
    ) {
        this.salesOrderRepository = salesOrderRepository;
        this.customerRepository = customerRepository;
        this.warehouseRepository = warehouseRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.inventoryService = inventoryService;
        this.salesOrderMapper = salesOrderMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    @Transactional
    public SalesOrderDTO createOrder(CreateSalesOrderRequest request) {
        Customer customer = customerRepository.findByIdAndIsActiveTrue(request.getCustomerId())
                .orElseThrow(() -> new CustomerNotFoundException(request.getCustomerId()));
        Warehouse warehouse = warehouseRepository.findByIdAndIsActiveTrue(request.getWarehouseId())
                .orElseThrow(() -> new WarehouseNotFoundException(request.getWarehouseId()));

        OffsetDateTime now = nowUtc();
        SalesOrder salesOrder = new SalesOrder();
        salesOrder.setOrderNumber(generateOrderNumber(now));
        salesOrder.setCustomer(customer);
        salesOrder.setWarehouse(warehouse);
        salesOrder.setStatus(SalesOrderStatus.PENDING);
        salesOrder.setPaymentMethod(request.getPaymentMethod());
        salesOrder.setPaymentStatus(PaymentStatus.PENDING);
        salesOrder.setNotes(trimOrNull(request.getNotes()));
        salesOrder.setCreatedBy(resolveCurrentUser());
        salesOrder.setCreatedAt(now);
        salesOrder.setUpdatedAt(now);

        Map<UUID, SalesOrderItemCreateRequest> uniqueItems = uniqueItems(request.getItems());
        for (SalesOrderItemCreateRequest itemRequest : uniqueItems.values()) {
            Product product = productRepository.findByIdAndIsActiveTrue(itemRequest.getProductId())
                    .orElseThrow(() -> new ProductNotFoundException(itemRequest.getProductId()));

            SalesOrderItem item = new SalesOrderItem();
            item.setSalesOrder(salesOrder);
            item.setProduct(product);
            item.setQuantity(itemRequest.getQuantity());
            item.setUnitPrice(itemRequest.getUnitPrice());
            item.setTotalPrice(itemRequest.getUnitPrice()
                    .multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
            salesOrder.getItems().add(item);
        }

        salesOrder.setTotalAmount(calculateTotals(salesOrder.getItems()));

        SalesOrder saved = salesOrderRepository.save(salesOrder);
        log.info("Sales order created: {}", saved.getOrderNumber());
        return salesOrderMapper.toSalesOrderDto(saved);
    }

    @Transactional
    public SalesOrderDTO confirmOrder(UUID id) {
        SalesOrder salesOrder = getSalesOrderEntity(id);
        boolean transitioned = transitionStatus(salesOrder, SalesOrderStatus.CONFIRMED);
        if (transitioned) {
            reduceInventoryForSale(salesOrder);
        }
        salesOrder.setUpdatedAt(nowUtc());
        SalesOrder saved = salesOrderRepository.save(salesOrder);
        log.info("Sales order confirmed: {}", saved.getOrderNumber());
        return salesOrderMapper.toSalesOrderDto(saved);
    }

    @Transactional
    public SalesOrderDTO completeOrder(UUID id) {
        SalesOrder salesOrder = getSalesOrderEntity(id);
        transitionStatus(salesOrder, SalesOrderStatus.COMPLETED);
        salesOrder.setUpdatedAt(nowUtc());
        SalesOrder saved = salesOrderRepository.save(salesOrder);
        log.info("Sales order completed: {}", saved.getOrderNumber());
        return salesOrderMapper.toSalesOrderDto(saved);
    }

    @Transactional
    public SalesOrderDTO cancelOrder(UUID id) {
        SalesOrder salesOrder = getSalesOrderEntity(id);
        SalesOrderStatus currentStatus = salesOrder.getStatus();
        transitionStatus(salesOrder, SalesOrderStatus.CANCELLED);
        if (currentStatus == SalesOrderStatus.CONFIRMED) {
            restoreInventoryForCancellation(salesOrder);
        }
        salesOrder.setUpdatedAt(nowUtc());
        SalesOrder saved = salesOrderRepository.save(salesOrder);
        log.info("Sales order cancelled: {}", saved.getOrderNumber());
        return salesOrderMapper.toSalesOrderDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<SalesOrderDTO> getSalesOrders(SalesOrderStatus status, UUID customerId, UUID warehouseId,
                              PaymentStatus paymentStatus,
                                              PaymentMethod paymentMethod,
                                              Pageable pageable) {
        return salesOrderRepository.searchSalesOrders(status, customerId, warehouseId, paymentStatus, paymentMethod, pageable)
                .map(salesOrderMapper::toSalesOrderDto);
    }

    @Transactional(readOnly = true)
    public SalesOrderDTO getSalesOrderById(UUID id) {
        return salesOrderMapper.toSalesOrderDto(getSalesOrderEntity(id));
    }

    public BigDecimal calculateTotals(List<SalesOrderItem> items) {
        return items.stream()
                .map(SalesOrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private SalesOrder getSalesOrderEntity(UUID id) {
        return salesOrderRepository.findById(id)
                .orElseThrow(() -> new SalesOrderNotFoundException(id));
    }

    private void reduceInventoryForSale(SalesOrder salesOrder) {
        for (SalesOrderItem item : salesOrder.getItems()) {
            InventoryAdjustmentRequest adjustment = new InventoryAdjustmentRequest(
                    item.getProduct().getId(),
                    salesOrder.getWarehouse().getId(),
                    -item.getQuantity(),
                    InventoryTransactionType.SALE,
                    salesOrder.getOrderNumber(),
                    REFERENCE_TYPE,
                    salesOrder.getNotes()
            );
            inventoryService.adjustStock(adjustment);
        }
    }

    private void restoreInventoryForCancellation(SalesOrder salesOrder) {
        for (SalesOrderItem item : salesOrder.getItems()) {
            InventoryAdjustmentRequest adjustment = new InventoryAdjustmentRequest(
                    item.getProduct().getId(),
                    salesOrder.getWarehouse().getId(),
                    item.getQuantity(),
                    InventoryTransactionType.RETURN,
                    salesOrder.getOrderNumber(),
                    REFERENCE_TYPE,
                    "Sales order cancelled"
            );
            inventoryService.adjustStock(adjustment);
        }
    }

    private boolean transitionStatus(SalesOrder salesOrder, SalesOrderStatus targetStatus) {
        SalesOrderStatus current = salesOrder.getStatus();
        if (current == targetStatus) {
            return false;
        }
        if (!isTransitionAllowed(current, targetStatus)) {
            throw new InvalidSalesOrderStateException(salesOrder.getId(), current, targetStatus.name());
        }
        salesOrder.setStatus(targetStatus);
        return true;
    }

    private boolean isTransitionAllowed(SalesOrderStatus current, SalesOrderStatus target) {
        return switch (current) {
            case PENDING -> target == SalesOrderStatus.CONFIRMED;
            case CONFIRMED -> target == SalesOrderStatus.COMPLETED || target == SalesOrderStatus.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
    }

    private String generateOrderNumber(OffsetDateTime now) {
        Long nextValue = jdbcTemplate.queryForObject("SELECT nextval('sales_order_number_seq')", Long.class);
        long sequence = nextValue == null ? 1L : nextValue;
        return String.format("%s-%d-%06d", ORDER_NUMBER_PREFIX, now.getYear(), sequence);
    }

    private User resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return null;
        }
        return userRepository.findById(principal.getId()).orElse(null);
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }

    private Map<UUID, SalesOrderItemCreateRequest> uniqueItems(List<SalesOrderItemCreateRequest> items) {
        Map<UUID, SalesOrderItemCreateRequest> unique = new HashMap<>();
        for (SalesOrderItemCreateRequest item : items) {
            if (unique.putIfAbsent(item.getProductId(), item) != null) {
                throw new IllegalArgumentException("Duplicate product in sales order: " + item.getProductId());
            }
        }
        return unique;
    }

    private String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
