package com.smartinventory.exception;

import com.smartinventory.entity.PurchaseOrderStatus;
import java.util.UUID;

public class InvalidPurchaseOrderStateException extends RuntimeException {

    public InvalidPurchaseOrderStateException(UUID id, PurchaseOrderStatus status, String action) {
        super("Purchase order " + id + " has invalid state " + status + " for action " + action);
    }
}
