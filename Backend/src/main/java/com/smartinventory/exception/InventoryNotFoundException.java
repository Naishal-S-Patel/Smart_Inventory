package com.smartinventory.exception;

import java.util.UUID;

public class InventoryNotFoundException extends RuntimeException {

    public InventoryNotFoundException(UUID productId, UUID warehouseId) {
        super("Inventory not found for product " + productId + " in warehouse " + warehouseId);
    }
}
