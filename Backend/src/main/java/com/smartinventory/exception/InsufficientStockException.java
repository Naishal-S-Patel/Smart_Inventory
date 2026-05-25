package com.smartinventory.exception;

import java.util.UUID;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(UUID productId, UUID warehouseId, int requested, int available) {
        super("Insufficient stock for product " + productId + " in warehouse " + warehouseId
                + ". Requested=" + requested + ", available=" + available);
    }
}
