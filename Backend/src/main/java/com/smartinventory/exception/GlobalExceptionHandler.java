package com.smartinventory.exception;

import com.smartinventory.dto.ErrorResponse;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private final Clock clock;

    public GlobalExceptionHandler(Clock clock) {
        this.clock = clock;
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        log.warn("Resource not found: {}", ex.getMessage());
        ErrorResponse response = ErrorResponse.of("RESOURCE_NOT_FOUND", ex.getMessage(), now);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleProductNotFound(ProductNotFoundException ex) {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        log.warn("Product not found: {}", ex.getMessage());
        ErrorResponse response = ErrorResponse.of("PRODUCT_NOT_FOUND", ex.getMessage(), now);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(WarehouseNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleWarehouseNotFound(WarehouseNotFoundException ex) {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        log.warn("Warehouse not found: {}", ex.getMessage());
        ErrorResponse response = ErrorResponse.of("WAREHOUSE_NOT_FOUND", ex.getMessage(), now);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(SupplierNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleSupplierNotFound(SupplierNotFoundException ex) {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        log.warn("Supplier not found: {}", ex.getMessage());
        ErrorResponse response = ErrorResponse.of("SUPPLIER_NOT_FOUND", ex.getMessage(), now);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(PurchaseOrderNotFoundException.class)
    public ResponseEntity<ErrorResponse> handlePurchaseOrderNotFound(PurchaseOrderNotFoundException ex) {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        log.warn("Purchase order not found: {}", ex.getMessage());
        ErrorResponse response = ErrorResponse.of("PURCHASE_ORDER_NOT_FOUND", ex.getMessage(), now);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(InventoryNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleInventoryNotFound(InventoryNotFoundException ex) {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        log.warn("Inventory not found: {}", ex.getMessage());
        ErrorResponse response = ErrorResponse.of("INVENTORY_NOT_FOUND", ex.getMessage(), now);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientStock(InsufficientStockException ex) {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        log.warn("Insufficient stock: {}", ex.getMessage());
        ErrorResponse response = ErrorResponse.of("INSUFFICIENT_STOCK", ex.getMessage(), now);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(InvalidPurchaseOrderStateException.class)
    public ResponseEntity<ErrorResponse> handleInvalidPurchaseOrderState(InvalidPurchaseOrderStateException ex) {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        log.warn("Invalid purchase order state: {}", ex.getMessage());
        ErrorResponse response = ErrorResponse.of("INVALID_PURCHASE_ORDER_STATE", ex.getMessage(), now);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateEmail(DuplicateEmailException ex) {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        ErrorResponse response = ErrorResponse.of("DUPLICATE_EMAIL", ex.getMessage(), now);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(DuplicateSkuException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateSku(DuplicateSkuException ex) {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        ErrorResponse response = ErrorResponse.of("DUPLICATE_SKU", ex.getMessage(), now);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(DuplicateBarcodeException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateBarcode(DuplicateBarcodeException ex) {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        ErrorResponse response = ErrorResponse.of("DUPLICATE_BARCODE", ex.getMessage(), now);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(InvalidCredentialsException ex) {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        ErrorResponse response = ErrorResponse.of("INVALID_CREDENTIALS", ex.getMessage(), now);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ErrorResponse> handleAccountLocked(AccountLockedException ex) {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        ErrorResponse response = ErrorResponse.of("ACCOUNT_LOCKED", ex.getMessage(), now);
        return ResponseEntity.status(HttpStatus.LOCKED).body(response);
    }

    @ExceptionHandler(TokenExpiredException.class)
    public ResponseEntity<ErrorResponse> handleTokenExpired(TokenExpiredException ex) {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        ErrorResponse response = ErrorResponse.of("TOKEN_EXPIRED", ex.getMessage(), now);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException ex) {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        ErrorResponse response = ErrorResponse.of("INVALID_REQUEST", ex.getMessage(), now);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(OptimisticLockingFailureException ex) {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        ErrorResponse response = ErrorResponse.of("OPTIMISTIC_LOCK", "Concurrent update detected", now);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        log.error("Unhandled exception", ex);
        ErrorResponse response = ErrorResponse.of("INTERNAL_SERVER_ERROR", "An unexpected error occurred", now);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
