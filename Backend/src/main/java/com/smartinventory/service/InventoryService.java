package com.smartinventory.service;

import com.smartinventory.dto.InventoryAdjustmentRequest;
import com.smartinventory.dto.InventoryDTO;
import com.smartinventory.dto.InventoryTransactionDTO;
import com.smartinventory.dto.InventoryTransferRequest;
import com.smartinventory.entity.Inventory;
import com.smartinventory.entity.InventoryTransaction;
import com.smartinventory.entity.InventoryTransactionType;
import com.smartinventory.entity.InventoryId;
import com.smartinventory.entity.Product;
import com.smartinventory.entity.Warehouse;
import com.smartinventory.exception.InsufficientStockException;
import com.smartinventory.exception.InventoryNotFoundException;
import com.smartinventory.exception.ProductNotFoundException;
import com.smartinventory.exception.WarehouseNotFoundException;
import com.smartinventory.mapper.InventoryMapper;
import com.smartinventory.repository.InventoryRepository;
import com.smartinventory.repository.InventoryTransactionRepository;
import com.smartinventory.repository.ProductRepository;
import com.smartinventory.repository.WarehouseRepository;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryMapper inventoryMapper;
    private final Clock clock;

    public InventoryService(
            InventoryRepository inventoryRepository,
            InventoryTransactionRepository inventoryTransactionRepository,
            ProductRepository productRepository,
            WarehouseRepository warehouseRepository,
            InventoryMapper inventoryMapper,
            Clock clock
    ) {
        this.inventoryRepository = inventoryRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
        this.inventoryMapper = inventoryMapper;
        this.clock = clock;
    }

    @Transactional
    public InventoryDTO adjustStock(InventoryAdjustmentRequest request) {
        validateAdjustmentRequest(request);
        InventoryTransactionType transactionType = request.getTransactionType();
        int delta = request.getQuantity();

        Product product = getActiveProduct(request.getProductId());
        Warehouse warehouse = getActiveWarehouse(request.getWarehouseId());
        OffsetDateTime now = nowUtc();

        Inventory inventory = inventoryRepository.findByProductIdAndWarehouseId(product.getId(), warehouse.getId())
                .orElse(null);

        if (inventory == null) {
            if (delta < 0) {
                throw new InventoryNotFoundException(product.getId(), warehouse.getId());
            }
            inventory = new Inventory();
            inventory.setProduct(product);
            inventory.setWarehouse(warehouse);
            inventory.setId(new InventoryId(product.getId(), warehouse.getId()));
            inventory.setQuantityOnHand(0);
            inventory.setReservedQuantity(0);
            inventory.setReorderPoint(product.getReorderPoint());
        }

        int newOnHand = inventory.getQuantityOnHand() + delta;
        if (newOnHand < 0 || newOnHand < inventory.getReservedQuantity()) {
            throw new InsufficientStockException(product.getId(), warehouse.getId(), Math.abs(delta),
                    Math.max(inventory.getAvailableQuantity(), 0));
        }

        inventory.setQuantityOnHand(newOnHand);
        inventory.setLastUpdatedAt(now);
        Inventory saved = inventoryRepository.save(inventory);

        createTransaction(saved, transactionType, delta, now);
        log.info("Inventory adjusted: product={}, warehouse={}, delta={}, type={}",
                product.getId(), warehouse.getId(), delta, transactionType);

        return inventoryMapper.toInventoryDto(saved);
    }

    @Transactional
    public List<InventoryDTO> transferStock(InventoryTransferRequest request) {
        validateTransferRequest(request);

        Product product = getActiveProduct(request.getProductId());
        Warehouse sourceWarehouse = getActiveWarehouse(request.getFromWarehouseId());
        Warehouse destinationWarehouse = getActiveWarehouse(request.getToWarehouseId());
        int quantity = request.getQuantity();
        OffsetDateTime now = nowUtc();

        Inventory sourceInventory = inventoryRepository.findByProductIdAndWarehouseId(product.getId(), sourceWarehouse.getId())
                .orElseThrow(() -> new InventoryNotFoundException(product.getId(), sourceWarehouse.getId()));

        int available = sourceInventory.getAvailableQuantity();
        if (available < quantity) {
            throw new InsufficientStockException(product.getId(), sourceWarehouse.getId(), quantity, available);
        }

        sourceInventory.setQuantityOnHand(sourceInventory.getQuantityOnHand() - quantity);
        sourceInventory.setLastUpdatedAt(now);

        Inventory destinationInventory = inventoryRepository
                .findByProductIdAndWarehouseId(product.getId(), destinationWarehouse.getId())
                .orElseGet(() -> {
                    Inventory created = new Inventory();
                    created.setProduct(product);
                    created.setWarehouse(destinationWarehouse);
                    created.setId(new InventoryId(product.getId(), destinationWarehouse.getId()));
                    created.setQuantityOnHand(0);
                    created.setReservedQuantity(0);
                    created.setReorderPoint(product.getReorderPoint());
                    return created;
                });
        destinationInventory.setQuantityOnHand(destinationInventory.getQuantityOnHand() + quantity);
        destinationInventory.setLastUpdatedAt(now);

        Inventory savedSource = inventoryRepository.save(sourceInventory);
        Inventory savedDestination = inventoryRepository.save(destinationInventory);

        createTransaction(savedSource, InventoryTransactionType.TRANSFER_OUT, -quantity, now);
        createTransaction(savedDestination, InventoryTransactionType.TRANSFER_IN, quantity, now);

        log.info("Inventory transferred: product={}, fromWarehouse={}, toWarehouse={}, qty={}",
                product.getId(), sourceWarehouse.getId(), destinationWarehouse.getId(), quantity);

        return List.of(
                inventoryMapper.toInventoryDto(savedSource),
                inventoryMapper.toInventoryDto(savedDestination)
        );
    }

    @Transactional
    public InventoryDTO reserveStock(UUID productId, UUID warehouseId, int quantity,
                                     String referenceId, String referenceType, String notes) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Reserve quantity must be positive");
        }

        Product product = getActiveProduct(productId);
        Warehouse warehouse = getActiveWarehouse(warehouseId);
        Inventory inventory = inventoryRepository.findByProductIdAndWarehouseId(product.getId(), warehouse.getId())
                .orElseThrow(() -> new InventoryNotFoundException(product.getId(), warehouse.getId()));

        int available = inventory.getAvailableQuantity();
        if (available < quantity) {
            throw new InsufficientStockException(product.getId(), warehouse.getId(), quantity, available);
        }

        OffsetDateTime now = nowUtc();
        inventory.setReservedQuantity(inventory.getReservedQuantity() + quantity);
        inventory.setLastUpdatedAt(now);
        Inventory saved = inventoryRepository.save(inventory);

        createTransaction(saved, InventoryTransactionType.SALE, -quantity, now);
        log.info("Inventory reserved: product={}, warehouse={}, qty={}", productId, warehouseId, quantity);

        return inventoryMapper.toInventoryDto(saved);
    }

    @Transactional
    public InventoryDTO releaseReservedStock(UUID productId, UUID warehouseId, int quantity,
                                             String referenceId, String referenceType, String notes) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Release quantity must be positive");
        }

        Product product = getActiveProduct(productId);
        Warehouse warehouse = getActiveWarehouse(warehouseId);
        Inventory inventory = inventoryRepository.findByProductIdAndWarehouseId(product.getId(), warehouse.getId())
                .orElseThrow(() -> new InventoryNotFoundException(product.getId(), warehouse.getId()));

        if (inventory.getReservedQuantity() < quantity) {
            throw new InsufficientStockException(product.getId(), warehouse.getId(), quantity, inventory.getReservedQuantity());
        }

        OffsetDateTime now = nowUtc();
        inventory.setReservedQuantity(inventory.getReservedQuantity() - quantity);
        inventory.setLastUpdatedAt(now);
        Inventory saved = inventoryRepository.save(inventory);

        createTransaction(saved, InventoryTransactionType.RETURN, quantity, now);
        log.info("Inventory reservation released: product={}, warehouse={}, qty={}", productId, warehouseId, quantity);

        return inventoryMapper.toInventoryDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<InventoryDTO> getInventory(UUID warehouseId, UUID productId, boolean lowStockOnly, Pageable pageable) {
        return inventoryRepository.searchInventory(warehouseId, productId, lowStockOnly, pageable)
                .map(inventoryMapper::toInventoryDto);
    }

    @Transactional(readOnly = true)
    public Page<InventoryDTO> getLowStockProducts(UUID warehouseId, Pageable pageable) {
        return inventoryRepository.searchInventory(warehouseId, null, true, pageable)
                .map(inventoryMapper::toInventoryDto);
    }

    @Transactional(readOnly = true)
    public Page<InventoryTransactionDTO> getTransactions(UUID warehouseId, UUID productId,
                                                         InventoryTransactionType transactionType,
                                                         OffsetDateTime fromDate, OffsetDateTime toDate,
                                                         Pageable pageable) {
        return inventoryTransactionRepository.searchTransactions(warehouseId, productId, transactionType, fromDate, toDate, pageable)
                .map(inventoryMapper::toTransactionDto);
    }

    private void validateAdjustmentRequest(InventoryAdjustmentRequest request) {
        if (request.getTransactionType() == null) {
            throw new IllegalArgumentException("Transaction type is required");
        }
        if (request.getQuantity() == null || request.getQuantity() == 0) {
            throw new IllegalArgumentException("Adjustment quantity must be non-zero");
        }
        if (request.getTransactionType() == InventoryTransactionType.TRANSFER_IN
                || request.getTransactionType() == InventoryTransactionType.TRANSFER_OUT) {
            throw new IllegalArgumentException("Transfer transaction types are not valid for adjustments");
        }

        int delta = request.getQuantity();
        if (request.getTransactionType() == InventoryTransactionType.SALE && delta > 0) {
            throw new IllegalArgumentException("Sale adjustments must be negative");
        }
        if ((request.getTransactionType() == InventoryTransactionType.RECEIVE
                || request.getTransactionType() == InventoryTransactionType.RETURN) && delta < 0) {
            throw new IllegalArgumentException("Receive/return adjustments must be positive");
        }
    }

    private void validateTransferRequest(InventoryTransferRequest request) {
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Transfer quantity must be positive");
        }
        if (request.getFromWarehouseId() == null || request.getToWarehouseId() == null) {
            throw new IllegalArgumentException("Transfer requires source and destination warehouses");
        }
        if (request.getFromWarehouseId().equals(request.getToWarehouseId())) {
            throw new IllegalArgumentException("Source and destination warehouses must be different");
        }
    }

    private Product getActiveProduct(UUID productId) {
        return productRepository.findByIdAndIsActiveTrue(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
    }

    private Warehouse getActiveWarehouse(UUID warehouseId) {
        return warehouseRepository.findByIdAndIsActiveTrue(warehouseId)
                .orElseThrow(() -> new WarehouseNotFoundException(warehouseId));
    }

    private void createTransaction(Inventory inventory, InventoryTransactionType type, int quantity, OffsetDateTime now) {
        InventoryTransaction transaction = new InventoryTransaction();
        transaction.setProduct(inventory.getProduct());
        transaction.setWarehouse(inventory.getWarehouse());
        transaction.setTransactionType(type);
        transaction.setQuantity(quantity);
        transaction.setCreatedAt(now);
        inventoryTransactionRepository.save(transaction);
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }
}
