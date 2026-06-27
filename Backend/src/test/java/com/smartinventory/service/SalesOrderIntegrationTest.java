package com.smartinventory.service;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.smartinventory.dto.CreateSalesOrderRequest;
import com.smartinventory.dto.SalesOrderDTO;
import com.smartinventory.dto.SalesOrderItemCreateRequest;
import com.smartinventory.entity.Category;
import com.smartinventory.entity.Customer;
import com.smartinventory.entity.Inventory;
import com.smartinventory.entity.InventoryId;
import com.smartinventory.entity.InventoryTransaction;
import com.smartinventory.entity.InventoryTransactionType;
import com.smartinventory.entity.PaymentMethod;
import com.smartinventory.entity.Product;
import com.smartinventory.entity.SalesOrderStatus;
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
class SalesOrderIntegrationTest {

    @Autowired
    private SalesOrderService salesOrderService;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private SalesOrderItemRepository salesOrderItemRepository;

    @Autowired
    private CustomerRepository customerRepository;

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
    private PurchaseOrderItemRepository purchaseOrderItemRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private SupplierRepository supplierRepository;

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
    void createSalesOrderPersistsTotals() {
        Customer customer = createCustomer();
        Warehouse warehouse = createWarehouse("WH-SO-1", "Atlanta");
        Product product = createProduct();

        CreateSalesOrderRequest request = new CreateSalesOrderRequest(
                customer.getId(),
                warehouse.getId(),
                PaymentMethod.CARD,
                "Priority sale",
                List.of(new SalesOrderItemCreateRequest(product.getId(), 5, new BigDecimal("3.00")))
        );

        SalesOrderDTO created = salesOrderService.createOrder(request);

        assertThat(created.getOrderNumber()).startsWith("SO-");
        assertThat(created.getStatus()).isEqualTo(SalesOrderStatus.PENDING);
        assertThat(created.getTotalAmount()).isEqualByComparingTo(new BigDecimal("15.00"));
        assertThat(created.getItems()).hasSize(1);
    }

    @Test
    void confirmSalesOrderReducesInventoryAndCreatesLedger() {
        Customer customer = createCustomer();
        Warehouse warehouse = createWarehouse("WH-SO-2", "Dallas");
        Product product = createProduct();
        createInventory(product, warehouse, 20, 0);

        CreateSalesOrderRequest request = new CreateSalesOrderRequest(
                customer.getId(),
                warehouse.getId(),
                PaymentMethod.CASH,
                "Cash order",
                List.of(new SalesOrderItemCreateRequest(product.getId(), 5, new BigDecimal("2.50")))
        );

        SalesOrderDTO created = salesOrderService.createOrder(request);
        SalesOrderDTO confirmed = salesOrderService.confirmOrder(created.getId());

        Inventory updated = inventoryRepository.findByProductIdAndWarehouseId(product.getId(), warehouse.getId()).orElseThrow();
        assertThat(updated.getQuantityOnHand()).isEqualTo(15);
        assertThat(confirmed.getStatus()).isEqualTo(SalesOrderStatus.CONFIRMED);

        List<InventoryTransaction> transactions = inventoryTransactionRepository.findAll();
        assertThat(transactions).isNotEmpty();
        assertThat(transactions).anyMatch(tx -> tx.getTransactionType() == InventoryTransactionType.SALE);
    }

    @Test
    void insufficientStockThrowsException() {
        Customer customer = createCustomer();
        Warehouse warehouse = createWarehouse("WH-SO-3", "Miami");
        Product product = createProduct();
        createInventory(product, warehouse, 3, 0);

        CreateSalesOrderRequest request = new CreateSalesOrderRequest(
                customer.getId(),
                warehouse.getId(),
                PaymentMethod.UPI,
                "Insufficient stock",
                List.of(new SalesOrderItemCreateRequest(product.getId(), 5, new BigDecimal("4.00")))
        );

        SalesOrderDTO created = salesOrderService.createOrder(request);

        assertThatThrownBy(() -> salesOrderService.confirmOrder(created.getId()))
                .isInstanceOf(InsufficientStockException.class);
    }

    private Customer createCustomer() {
        Customer customer = new Customer();
        customer.setCustomerCode("CUST-" + UUID.randomUUID());
        customer.setFullName("Test Customer");
        customer.setEmail("customer" + UUID.randomUUID() + "@example.com");
        customer.setPhone("555-0100");
        customer.setAddress("1 Market St");
        customer.setCity("San Jose");
        customer.setState("CA");
        customer.setCountry("USA");
        customer.setLoyaltyPoints(0);
        customer.setActive(true);
        customer.setCreatedAt(nowUtc());
        customer.setUpdatedAt(nowUtc());
        return customerRepository.save(customer);
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
        product.setUnitCost(new BigDecimal("1.25"));
        product.setSellingPrice(new BigDecimal("2.25"));
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
