package com.smartinventory.exception;

public class DuplicateBarcodeException extends RuntimeException {

    public DuplicateBarcodeException(String barcode) {
        super("Barcode already exists: " + barcode);
    }
}
