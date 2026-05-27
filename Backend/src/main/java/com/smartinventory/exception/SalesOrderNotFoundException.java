package com.smartinventory.exception;

import java.util.UUID;

public class SalesOrderNotFoundException extends RuntimeException {

    public SalesOrderNotFoundException(UUID id) {
        super("Sales order not found: " + id);
    }
}
