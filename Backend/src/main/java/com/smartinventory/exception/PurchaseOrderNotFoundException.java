package com.smartinventory.exception;

import java.util.UUID;

public class PurchaseOrderNotFoundException extends RuntimeException {

    public PurchaseOrderNotFoundException(UUID id) {
        super("Purchase order not found: " + id);
    }

    public PurchaseOrderNotFoundException(String orderNumber) {
        super("Purchase order not found: " + orderNumber);
    }
}
