package com.smartinventory.service;

import com.smartinventory.dto.PurchaseOrderApproveRequest;
import com.smartinventory.dto.PurchaseOrderCreateRequest;
import com.smartinventory.dto.PurchaseOrderDTO;
import com.smartinventory.dto.PurchaseOrderItemCreateRequest;
import com.smartinventory.dto.PurchaseOrderItemReceiveRequest;
import com.smartinventory.dto.PurchaseOrderReceiveRequest;
import com.smartinventory.entity.Category;
import com.smartinventory.entity.Inventory;
import com.smartinventory.entity.InventoryTransaction;
import com.smartinventory.entity.InventoryTransactionType;
import com.smartinventory.entity.Product;
import com.smartinventory.entity.PurchaseOrderStatus;
import com.smartinventory.entity.Supplier;
import com.smartinventory.entity.Warehouse;
import com.smartinventory.exception.InvalidPurchaseOrderStateException;
import com.smartinventory.repository.CategoryRepository;
import com.smartinventory.repository.InventoryRepository;
import com.smartinventory.repository.InventoryTransactionRepository;
import com.smartinventory.repository.ProductRepository;
import com.smartinventory.repository.PurchaseOrderItemRepository;
import com.smartinventory.repository.PurchaseOrderRepository;
import com.smartinventory.repository.SupplierRepository;
import com.smartinventory.repository.WarehouseRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class PurchaseOrderIntegrationTest {

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @Autowired
    private PurchaseOrderItemRepository purchaseOrderItemRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private InventoryTransactionRepository inventoryTransactionRepository;

    @Autowired
    private Clock clock;

    @BeforeEach
    void cleanDatabase() {
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
    void createPurchaseOrderPersistsTotals() {
        Supplier supplier = createSupplier();
        Warehouse warehouse = createWarehouse("WH-PO", "Austin");
        Product product = createProduct();

        PurchaseOrderCreateRequest request = new PurchaseOrderCreateRequest(
                supplier.getId(),
                warehouse.getId(),
                LocalDate.now(clock).plusDays(5),
                "Initial order",
                List.of(new PurchaseOrderItemCreateRequest(product.getId(), 10, new BigDecimal("2.50")))
        );

        PurchaseOrderDTO created = purchaseOrderService.createPurchaseOrder(request);

        assertThat(created.getOrderNumber()).startsWith("PO-");
        assertThat(created.getStatus()).isEqualTo(PurchaseOrderStatus.DRAFT);
        assertThat(created.getTotalAmount()).isEqualByComparingTo(new BigDecimal("25.00"));
        assertThat(created.getItems()).hasSize(1);
    }

    @Test
    void approvePurchaseOrderMovesToApproved() {
        PurchaseOrderDTO created = createSamplePurchaseOrder();

        PurchaseOrderDTO approved = purchaseOrderService.approvePurchaseOrder(
                created.getId(),
                new PurchaseOrderApproveRequest("Approved")
        );

        assertThat(approved.getStatus()).isEqualTo(PurchaseOrderStatus.APPROVED);
    }

    @Test
    void receivePurchaseOrderUpdatesStatus() {
        PurchaseOrderDTO created = createSamplePurchaseOrder();
        purchaseOrderService.approvePurchaseOrder(created.getId(), new PurchaseOrderApproveRequest("Approved"));
        purchaseOrderService.markAsSent(created.getId());

        PurchaseOrderReceiveRequest receiveRequest = new PurchaseOrderReceiveRequest(
                LocalDate.now(clock),
                "Delivered",
                List.of(new PurchaseOrderItemReceiveRequest(created.getItems().get(0).getProductId(), 10))
        );

        PurchaseOrderDTO received = purchaseOrderService.receivePurchaseOrder(created.getId(), receiveRequest);

        assertThat(received.getStatus()).isEqualTo(PurchaseOrderStatus.RECEIVED);
        assertThat(received.getActualDeliveryDate()).isNotNull();
    }

    @Test
    void invalidStateTransitionThrows() {
        PurchaseOrderDTO created = createSamplePurchaseOrder();

        PurchaseOrderReceiveRequest receiveRequest = new PurchaseOrderReceiveRequest(
                LocalDate.now(clock),
                "Delivered",
                List.of(new PurchaseOrderItemReceiveRequest(created.getItems().get(0).getProductId(), 1))
        );

        assertThatThrownBy(() -> purchaseOrderService.receivePurchaseOrder(created.getId(), receiveRequest))
                .isInstanceOf(InvalidPurchaseOrderStateException.class);
    }

    @Test
    void receivingPurchaseOrderCreatesInventoryLedgerEntries() {
        PurchaseOrderDTO created = createSamplePurchaseOrder();
        purchaseOrderService.approvePurchaseOrder(created.getId(), new PurchaseOrderApproveRequest("Approved"));
        purchaseOrderService.markAsSent(created.getId());

        UUID productId = created.getItems().get(0).getProductId();
        UUID warehouseId = created.getWarehouseId();

        PurchaseOrderReceiveRequest receiveRequest = new PurchaseOrderReceiveRequest(
                nowUtc(),
                "Delivered",
                List.of(new PurchaseOrderItemReceiveRequest(productId, 10))
        );

        purchaseOrderService.receivePurchaseOrder(created.getId(), receiveRequest);

        Inventory inventory = inventoryRepository.findByProductIdAndWarehouseId(productId, warehouseId).orElseThrow();
        assertThat(inventory.getQuantityOnHand()).isEqualTo(10);

        List<InventoryTransaction> transactions = inventoryTransactionRepository.findAll();
        assertThat(transactions).isNotEmpty();
        assertThat(transactions).anyMatch(tx -> tx.getTransactionType() == InventoryTransactionType.RECEIVE);
    }

    private PurchaseOrderDTO createSamplePurchaseOrder() {
        Supplier supplier = createSupplier();
        Warehouse warehouse = createWarehouse("WH-PO-1", "Austin");
        Product product = createProduct();

        PurchaseOrderCreateRequest request = new PurchaseOrderCreateRequest(
                supplier.getId(),
                warehouse.getId(),
                LocalDate.now(clock).plusDays(5),
                "Initial order",
                List.of(new PurchaseOrderItemCreateRequest(product.getId(), 10, new BigDecimal("2.50")))
        );

        return purchaseOrderService.createPurchaseOrder(request);
    }

    private Supplier createSupplier() {
        Supplier supplier = new Supplier();
        supplier.setSupplierCode("SUP-" + UUID.randomUUID());
        supplier.setCompanyName("Acme Supplies");
        supplier.setContactPerson("Jordan Lee");
        supplier.setEmail("supplier@example.com");
        supplier.setPhone("555-0110");
        supplier.setAddress("123 Supply St");
        supplier.setCity("Austin");
        supplier.setState("TX");
        supplier.setCountry("USA");
        supplier.setAvgLeadDays(3);
        supplier.setActive(true);
        supplier.setCreatedAt(nowUtc());
        supplier.setUpdatedAt(nowUtc());
        return supplierRepository.save(supplier);
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
        product.setUnitCost(new BigDecimal("1.50"));
        product.setSellingPrice(new BigDecimal("2.50"));
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
        return warehouseRepository.save(warehouse);
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }
}
