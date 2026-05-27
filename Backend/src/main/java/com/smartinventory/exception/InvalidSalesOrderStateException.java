package com.smartinventory.exception;

import com.smartinventory.entity.SalesOrderStatus;
import java.util.UUID;

public class InvalidSalesOrderStateException extends RuntimeException {

    public InvalidSalesOrderStateException(UUID id, SalesOrderStatus status, String action) {
        super("Sales order " + id + " has invalid state " + status + " for action " + action);
    }
}
