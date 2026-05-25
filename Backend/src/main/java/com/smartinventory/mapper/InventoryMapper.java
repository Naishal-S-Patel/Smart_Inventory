package com.smartinventory.mapper;

import com.smartinventory.dto.InventoryDTO;
import com.smartinventory.dto.InventoryTransactionDTO;
import com.smartinventory.dto.ProductDTO;
import com.smartinventory.dto.WarehouseDTO;
import com.smartinventory.entity.Inventory;
import com.smartinventory.entity.InventoryTransaction;
import com.smartinventory.entity.Product;
import com.smartinventory.entity.Warehouse;
import org.springframework.stereotype.Component;

@Component
public class InventoryMapper {

    private final ProductMapper productMapper;

    public InventoryMapper(ProductMapper productMapper) {
        this.productMapper = productMapper;
    }

    public WarehouseDTO toWarehouseDto(Warehouse warehouse) {
        if (warehouse == null) {
            return null;
        }
        return WarehouseDTO.builder()
                .id(warehouse.getId())
                .name(warehouse.getName())
                .code(warehouse.getCode())
                .city(warehouse.getCity())
                .state(warehouse.getState())
                .capacity(warehouse.getCapacity())
                .isActive(warehouse.isActive())
                .build();
    }

    public InventoryDTO toInventoryDto(Inventory inventory) {
        if (inventory == null) {
            return null;
        }
        Product product = inventory.getProduct();
        ProductDTO productDto = productMapper.toProductDto(product);

        return InventoryDTO.builder()
                .productId(inventory.getProduct().getId())
                .warehouseId(inventory.getWarehouse().getId())
                .product(productDto)
                .warehouse(toWarehouseDto(inventory.getWarehouse()))
                .quantityOnHand(inventory.getQuantityOnHand())
                .reservedQuantity(inventory.getReservedQuantity())
                .availableQuantity(inventory.getAvailableQuantity())
                .lastUpdatedAt(inventory.getLastUpdatedAt())
                .build();
    }

    public InventoryTransactionDTO toTransactionDto(InventoryTransaction transaction) {
        if (transaction == null) {
            return null;
        }
        return InventoryTransactionDTO.builder()
                .id(transaction.getId())
                .productId(transaction.getProduct().getId())
                .warehouseId(transaction.getWarehouse().getId())
                .transactionType(transaction.getTransactionType())
                .quantity(transaction.getQuantity())
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}
