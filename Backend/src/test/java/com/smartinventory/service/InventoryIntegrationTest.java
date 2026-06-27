package com.smartinventory.service;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.smartinventory.dto.InventoryDTO;
import com.smartinventory.dto.InventoryTransferRequest;
import com.smartinventory.entity.Category;
import com.smartinventory.entity.Inventory;
import com.smartinventory.entity.InventoryId;
import com.smartinventory.entity.InventoryTransaction;
import com.smartinventory.entity.InventoryTransactionType;
import com.smartinventory.entity.Product;
import com.smartinventory.entity.Warehouse;
import com.smartinventory.exception.InsufficientStockException;
import com.smartinventory.repository.CategoryRepository;
import com.smartinventory.repository.CustomerRepository;
import com.smartinventory.repository.InventoryRepository;
import com.smartinventory.repository.InventoryTransactionRepository;
import com.smartinventory.repository.ProductRepository;
import com.smartinventory.repository.PurchaseOrderItemRepository;
import com.smartinventory.repository.PurchaseOrderRepository;
import com.smartinventory.repository.SalesOrderItemRepository;
import com.smartinventory.repository.SalesOrderRepository;
import com.smartinventory.repository.SupplierRepository;
import com.smartinventory.repository.WarehouseRepository;

@SpringBootTest
class InventoryIntegrationTest {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private InventoryTransactionRepository inventoryTransactionRepository;

    @Autowired
    private SalesOrderItemRepository salesOrderItemRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PurchaseOrderItemRepository purchaseOrderItemRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private Clock clock;

    @BeforeEach
    void cleanDatabase() {
        salesOrderItemRepository.deleteAll();
        salesOrderRepository.deleteAll();
        customerRepository.deleteAll();
        purchaseOrderItemRepository.deleteAll();
        purchaseOrderRepository.deleteAll();
        supplierRepository.deleteAll();
        inventoryTransactionRepository.deleteAll();
        inventoryRepository.deleteAll();
        warehouseRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    void successfulTransferCreatesLedgerAndUpdatesStock() {
        Product product = createProduct();
        Warehouse source = createWarehouse("WH-A", "Chicago");
        Warehouse destination = createWarehouse("WH-B", "Dallas");
        createInventory(product, source, 50, 5);

        InventoryTransferRequest request = new InventoryTransferRequest(
                product.getId(),
                source.getId(),
                destination.getId(),
                10,
                "PO-100",
                "TRANSFER",
                "Rebalance"
        );

        List<InventoryDTO> result = inventoryService.transferStock(request);
        assertThat(result).hasSize(2);

        Inventory updatedSource = inventoryRepository.findByProductIdAndWarehouseId(product.getId(), source.getId()).orElseThrow();
        Inventory updatedDestination = inventoryRepository.findByProductIdAndWarehouseId(product.getId(), destination.getId()).orElseThrow();

        assertThat(updatedSource.getQuantityOnHand()).isEqualTo(40);
        assertThat(updatedDestination.getQuantityOnHand()).isEqualTo(10);

        List<InventoryTransaction> transactions = inventoryTransactionRepository.findAll();
        assertThat(transactions).hasSize(2);
        assertThat(transactions).anyMatch(tx -> tx.getTransactionType() == InventoryTransactionType.TRANSFER_OUT);
        assertThat(transactions).anyMatch(tx -> tx.getTransactionType() == InventoryTransactionType.TRANSFER_IN);
    }

    @Test
    void insufficientStockThrowsException() {
        Product product = createProduct();
        Warehouse source = createWarehouse("WH-C", "Miami");
        Warehouse destination = createWarehouse("WH-D", "Seattle");
        createInventory(product, source, 5, 4);

        InventoryTransferRequest request = new InventoryTransferRequest(
                product.getId(),
                source.getId(),
                destination.getId(),
                2,
                null,
                null,
                null
        );

        assertThatThrownBy(() -> inventoryService.transferStock(request))
                .isInstanceOf(InsufficientStockException.class);
    }

    @Test
    void concurrentStockUpdatesComplete() throws ExecutionException, InterruptedException {
        Product product = createProduct();
        Warehouse warehouse = createWarehouse("WH-E", "Denver");
        Inventory inventory = createInventory(product, warehouse, 100, 0);

        TransactionTemplate template = new TransactionTemplate(transactionManager);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        ExecutorService executor = Executors.newFixedThreadPool(2);
        Future<Exception> first = executor.submit(() -> runConcurrentUpdate(template, inventory.getId(), ready, start));
        Future<Exception> second = executor.submit(() -> runConcurrentUpdate(template, inventory.getId(), ready, start));

        ready.await();
        start.countDown();

        Exception firstResult = first.get();
        Exception secondResult = second.get();
        executor.shutdown();

        assertThat(firstResult).isNull();
        assertThat(secondResult).isNull();
    }

    @Test
    void lowStockRetrievalFindsExpectedInventory() {
        Product product = createProduct();
        Warehouse warehouse = createWarehouse("WH-F", "Boston");
        createInventory(product, warehouse, 5, 0);

        Page<InventoryDTO> page = inventoryService.getLowStockProducts(null, PageRequest.of(0, 10));

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getProduct().getId()).isEqualTo(product.getId());
    }

    private Exception runConcurrentUpdate(TransactionTemplate template, InventoryId inventoryId,
                                          CountDownLatch ready, CountDownLatch start) {
        try {
            return template.execute(status -> {
                Inventory loaded = inventoryRepository.findById(inventoryId).orElseThrow();
                ready.countDown();
                try {
                    start.await();
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                }
                loaded.setQuantityOnHand(loaded.getQuantityOnHand() - 10);
                inventoryRepository.saveAndFlush(loaded);
                return null;
            });
        } catch (Exception ex) {
            return ex;
        }
    }

    private Product createProduct() {
        Category category = new Category();
        category.setName("Default");
        category.setDescription("Default category");
        category.setCreatedAt(nowUtc());
        category.setUpdatedAt(nowUtc());
        Category savedCategory = categoryRepository.save(category);

        Product product = new Product();
        product.setSku("SKU-" + UUID.randomUUID());
        product.setName("Sample Product");
        product.setDescription("Sample");
        product.setCategory(savedCategory);
        product.setUnitCost(new BigDecimal("1.00"));
        product.setSellingPrice(new BigDecimal("2.00"));
        product.setUnitOfMeasure("EA");
        product.setReorderPoint(10);
        product.setMaxStockLevel(200);
        product.setBarcode("BC-" + UUID.randomUUID());
        product.setImageUrl(null);
        product.setActive(true);
        product.setCreatedAt(nowUtc());
        product.setUpdatedAt(nowUtc());
        return productRepository.save(product);
    }

    private Warehouse createWarehouse(String code, String city) {
        Warehouse warehouse = new Warehouse();
        warehouse.setName("Warehouse " + code);
        warehouse.setCode(code);
        warehouse.setCity(city);
        warehouse.setState("State");
        warehouse.setCapacity(1000);
        warehouse.setActive(true);
        warehouse.setCreatedAt(nowUtc());
        warehouse.setUpdatedAt(nowUtc());
        return warehouseRepository.save(warehouse);
    }

    private Inventory createInventory(Product product, Warehouse warehouse, int quantityOnHand, int reservedQuantity) {
        Inventory inventory = new Inventory();
        inventory.setId(new InventoryId(product.getId(), warehouse.getId()));
        inventory.setProduct(product);
        inventory.setWarehouse(warehouse);
        inventory.setQuantityOnHand(quantityOnHand);
        inventory.setReservedQuantity(reservedQuantity);
        inventory.setLastUpdatedAt(nowUtc());
        return inventoryRepository.save(inventory);
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }
}
