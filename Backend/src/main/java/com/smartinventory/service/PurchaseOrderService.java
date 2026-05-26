package com.smartinventory.service;

import com.smartinventory.dto.InventoryAdjustmentRequest;
import com.smartinventory.dto.PurchaseOrderApproveRequest;
import com.smartinventory.dto.PurchaseOrderCreateRequest;
import com.smartinventory.dto.PurchaseOrderDTO;
import com.smartinventory.dto.PurchaseOrderItemCreateRequest;
import com.smartinventory.dto.PurchaseOrderItemReceiveRequest;
import com.smartinventory.dto.PurchaseOrderReceiveRequest;
import com.smartinventory.entity.InventoryTransactionType;
import com.smartinventory.entity.Product;
import com.smartinventory.entity.PurchaseOrder;
import com.smartinventory.entity.PurchaseOrderItem;
import com.smartinventory.entity.PurchaseOrderStatus;
import com.smartinventory.entity.Supplier;
import com.smartinventory.entity.User;
import com.smartinventory.entity.Warehouse;
import com.smartinventory.exception.InvalidPurchaseOrderStateException;
import com.smartinventory.exception.ProductNotFoundException;
import com.smartinventory.exception.PurchaseOrderNotFoundException;
import com.smartinventory.exception.SupplierNotFoundException;
import com.smartinventory.exception.WarehouseNotFoundException;
import com.smartinventory.mapper.PurchaseOrderMapper;
import com.smartinventory.repository.ProductRepository;
import com.smartinventory.repository.PurchaseOrderRepository;
import com.smartinventory.repository.SupplierRepository;
import com.smartinventory.repository.UserRepository;
import com.smartinventory.repository.WarehouseRepository;
import com.smartinventory.security.UserPrincipal;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
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
public class PurchaseOrderService {

    private static final String ORDER_NUMBER_PREFIX = "PO";

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;
    private final PurchaseOrderMapper purchaseOrderMapper;
    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;

    public PurchaseOrderService(
            PurchaseOrderRepository purchaseOrderRepository,
            SupplierRepository supplierRepository,
            WarehouseRepository warehouseRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            InventoryService inventoryService,
            PurchaseOrderMapper purchaseOrderMapper,
            JdbcTemplate jdbcTemplate,
            Clock clock
    ) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.supplierRepository = supplierRepository;
        this.warehouseRepository = warehouseRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.inventoryService = inventoryService;
        this.purchaseOrderMapper = purchaseOrderMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    @Transactional
    public PurchaseOrderDTO createPurchaseOrder(PurchaseOrderCreateRequest request) {
        Supplier supplier = supplierRepository.findByIdAndIsActiveTrue(request.getSupplierId())
                .orElseThrow(() -> new SupplierNotFoundException(request.getSupplierId()));
        Warehouse warehouse = warehouseRepository.findByIdAndIsActiveTrue(request.getWarehouseId())
                .orElseThrow(() -> new WarehouseNotFoundException(request.getWarehouseId()));

        OffsetDateTime now = nowUtc();
        PurchaseOrder purchaseOrder = new PurchaseOrder();
        purchaseOrder.setOrderNumber(generateOrderNumber(now));
        purchaseOrder.setSupplier(supplier);
        purchaseOrder.setWarehouse(warehouse);
        purchaseOrder.setStatus(PurchaseOrderStatus.DRAFT);
        purchaseOrder.setExpectedDeliveryDate(toOffsetDateTime(request.getExpectedDeliveryDate()));
        purchaseOrder.setNotes(trimOrNull(request.getNotes()));
        purchaseOrder.setCreatedBy(resolveCurrentUser());
        purchaseOrder.setCreatedAt(now);
        purchaseOrder.setUpdatedAt(now);

        Map<UUID, PurchaseOrderItemCreateRequest> uniqueItems = uniqueItems(request.getItems());
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (PurchaseOrderItemCreateRequest itemRequest : uniqueItems.values()) {
            Product product = productRepository.findByIdAndIsActiveTrue(itemRequest.getProductId())
                    .orElseThrow(() -> new ProductNotFoundException(itemRequest.getProductId()));

            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setPurchaseOrder(purchaseOrder);
            item.setProduct(product);
            item.setQuantity(itemRequest.getQuantity());
            item.setUnitCost(itemRequest.getUnitCost());
            item.setTotalCost(itemRequest.getUnitCost().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
            item.setReceivedQuantity(0);
            purchaseOrder.getItems().add(item);
            totalAmount = totalAmount.add(item.getTotalCost());
        }

        purchaseOrder.setTotalAmount(totalAmount);

        PurchaseOrder saved = purchaseOrderRepository.save(purchaseOrder);
        log.info("Purchase order created: {}", saved.getOrderNumber());
        return purchaseOrderMapper.toPurchaseOrderDto(saved);
    }

    @Transactional
    public PurchaseOrderDTO approvePurchaseOrder(String idOrOrderNumber, PurchaseOrderApproveRequest request) {
        PurchaseOrder purchaseOrder = getPurchaseOrderEntity(idOrOrderNumber);
        transitionStatus(purchaseOrder, PurchaseOrderStatus.APPROVED);

        purchaseOrder.setApprovedBy(resolveCurrentUser());
        if (request.getNotes() != null) {
            purchaseOrder.setNotes(trimOrNull(request.getNotes()));
        }
        purchaseOrder.setUpdatedAt(nowUtc());

        PurchaseOrder saved = purchaseOrderRepository.save(purchaseOrder);
        log.info("Purchase order approved: {}", saved.getOrderNumber());
        return purchaseOrderMapper.toPurchaseOrderDto(saved);
    }

    @Transactional
    public PurchaseOrderDTO markAsSent(String idOrOrderNumber) {
        PurchaseOrder purchaseOrder = getPurchaseOrderEntity(idOrOrderNumber);
        transitionStatus(purchaseOrder, PurchaseOrderStatus.SENT);
        purchaseOrder.setUpdatedAt(nowUtc());

        PurchaseOrder saved = purchaseOrderRepository.save(purchaseOrder);
        log.info("Purchase order sent: {}", saved.getOrderNumber());
        return purchaseOrderMapper.toPurchaseOrderDto(saved);
    }

    @Transactional
    public PurchaseOrderDTO receivePurchaseOrder(String idOrOrderNumber, PurchaseOrderReceiveRequest request) {
        PurchaseOrder purchaseOrder = getPurchaseOrderEntity(idOrOrderNumber);
        if (purchaseOrder.getStatus() != PurchaseOrderStatus.SENT
                && purchaseOrder.getStatus() != PurchaseOrderStatus.PARTIAL) {
            throw new InvalidPurchaseOrderStateException(purchaseOrder.getId(), purchaseOrder.getStatus(), "RECEIVE");
        }

        Map<UUID, PurchaseOrderItemReceiveRequest> receivedItems = uniqueReceivedItems(request.getItems());
        boolean anyReceived = false;

        for (PurchaseOrderItem item : purchaseOrder.getItems()) {
            PurchaseOrderItemReceiveRequest itemRequest = receivedItems.get(item.getProduct().getId());
            if (itemRequest == null) {
                throw new IllegalArgumentException("Missing received quantity for product: " + item.getProduct().getId());
            }

            int delta = itemRequest.getReceivedQuantity();
            if (delta < 0) {
                throw new IllegalArgumentException("Received quantity cannot be negative");
            }

            int newReceived = item.getReceivedQuantity() + delta;
            if (newReceived > item.getQuantity()) {
                throw new IllegalArgumentException("Received quantity exceeds ordered quantity for product: "
                        + item.getProduct().getId());
            }

            if (delta > 0) {
                anyReceived = true;
                InventoryAdjustmentRequest adjustment = new InventoryAdjustmentRequest(
                        item.getProduct().getId(),
                        purchaseOrder.getWarehouse().getId(),
                        delta,
                        InventoryTransactionType.RECEIVE,
                        purchaseOrder.getOrderNumber(),
                        "PURCHASE_ORDER",
                        trimOrNull(request.getNotes())
                );
                inventoryService.adjustStock(adjustment);
            }

            item.setReceivedQuantity(newReceived);
        }

        if (!anyReceived && purchaseOrder.getStatus() == PurchaseOrderStatus.SENT) {
            throw new IllegalArgumentException("Receive request must include at least one received quantity");
        }

        boolean allReceived = purchaseOrder.getItems().stream()
                .allMatch(item -> item.getReceivedQuantity() >= item.getQuantity());

        PurchaseOrderStatus targetStatus = purchaseOrder.getStatus();
        if (allReceived) {
            targetStatus = PurchaseOrderStatus.RECEIVED;
        } else if (anyReceived) {
            targetStatus = PurchaseOrderStatus.PARTIAL;
        }

        if (targetStatus != purchaseOrder.getStatus()) {
            transitionStatus(purchaseOrder, targetStatus);
        }

        if (request.getNotes() != null) {
            purchaseOrder.setNotes(trimOrNull(request.getNotes()));
        }

        if (request.getActualDeliveryDate() != null) {
            purchaseOrder.setActualDeliveryDate(toOffsetDateTime(request.getActualDeliveryDate()));
        } else if (targetStatus == PurchaseOrderStatus.RECEIVED) {
            purchaseOrder.setActualDeliveryDate(nowUtc());
        }

        purchaseOrder.setUpdatedAt(nowUtc());
        PurchaseOrder saved = purchaseOrderRepository.save(purchaseOrder);
        log.info("Purchase order received: {}", saved.getOrderNumber());
        return purchaseOrderMapper.toPurchaseOrderDto(saved);
    }

    @Transactional
    public void cancelPurchaseOrder(String idOrOrderNumber) {
        PurchaseOrder purchaseOrder = getPurchaseOrderEntity(idOrOrderNumber);
        transitionStatus(purchaseOrder, PurchaseOrderStatus.CANCELLED);
        purchaseOrder.setUpdatedAt(nowUtc());
        purchaseOrderRepository.save(purchaseOrder);
        log.info("Purchase order cancelled: {}", purchaseOrder.getOrderNumber());
    }

    @Transactional(readOnly = true)
    public Page<PurchaseOrderDTO> getPurchaseOrders(PurchaseOrderStatus status, UUID supplierId,
                                                    UUID warehouseId, Pageable pageable) {
        return purchaseOrderRepository.searchPurchaseOrders(status, supplierId, warehouseId, pageable)
                .map(purchaseOrderMapper::toPurchaseOrderDto);
    }

    @Transactional(readOnly = true)
    public PurchaseOrderDTO getPurchaseOrderById(String idOrOrderNumber) {
        return purchaseOrderMapper.toPurchaseOrderDto(getPurchaseOrderEntity(idOrOrderNumber));
    }

    @Transactional(readOnly = true)
    public PurchaseOrder getPurchaseOrderEntity(String idOrOrderNumber) {
        UUID parsedId = tryParseUuid(idOrOrderNumber);
        if (parsedId != null) {
            return purchaseOrderRepository.findById(parsedId)
                    .orElseThrow(() -> new PurchaseOrderNotFoundException(parsedId));
        }

        return purchaseOrderRepository.findByOrderNumberIgnoreCase(idOrOrderNumber)
                .orElseThrow(() -> new PurchaseOrderNotFoundException(idOrOrderNumber));
    }

    private UUID tryParseUuid(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String generateOrderNumber(OffsetDateTime now) {
        Long nextValue = jdbcTemplate.queryForObject("SELECT nextval('purchase_order_number_seq')", Long.class);
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

    private void transitionStatus(PurchaseOrder purchaseOrder, PurchaseOrderStatus targetStatus) {
        PurchaseOrderStatus current = purchaseOrder.getStatus();
        if (current == targetStatus) {
            return;
        }

        if (!isTransitionAllowed(current, targetStatus)) {
            throw new InvalidPurchaseOrderStateException(purchaseOrder.getId(), current, targetStatus.name());
        }

        purchaseOrder.setStatus(targetStatus);
    }

    private boolean isTransitionAllowed(PurchaseOrderStatus current, PurchaseOrderStatus target) {
        return switch (current) {
            case DRAFT -> target == PurchaseOrderStatus.APPROVED || target == PurchaseOrderStatus.CANCELLED;
            case APPROVED -> target == PurchaseOrderStatus.SENT || target == PurchaseOrderStatus.CANCELLED;
            case SENT -> target == PurchaseOrderStatus.PARTIAL
                    || target == PurchaseOrderStatus.RECEIVED
                    || target == PurchaseOrderStatus.CANCELLED;
            case PARTIAL -> target == PurchaseOrderStatus.RECEIVED
                    || target == PurchaseOrderStatus.CANCELLED;
            case RECEIVED, CANCELLED -> false;
        };
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }

    private OffsetDateTime toOffsetDateTime(LocalDate date) {
        if (date == null) {
            return null;
        }
        return date.atStartOfDay().atOffset(ZoneOffset.UTC);
    }

    private Map<UUID, PurchaseOrderItemCreateRequest> uniqueItems(List<PurchaseOrderItemCreateRequest> items) {
        Map<UUID, PurchaseOrderItemCreateRequest> unique = new HashMap<>();
        for (PurchaseOrderItemCreateRequest item : items) {
            if (unique.putIfAbsent(item.getProductId(), item) != null) {
                throw new IllegalArgumentException("Duplicate product in purchase order: " + item.getProductId());
            }
        }
        return unique;
    }

    private Map<UUID, PurchaseOrderItemReceiveRequest> uniqueReceivedItems(List<PurchaseOrderItemReceiveRequest> items) {
        Map<UUID, PurchaseOrderItemReceiveRequest> unique = new HashMap<>();
        for (PurchaseOrderItemReceiveRequest item : items) {
            if (unique.putIfAbsent(item.getProductId(), item) != null) {
                throw new IllegalArgumentException("Duplicate product in receive request: " + item.getProductId());
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
