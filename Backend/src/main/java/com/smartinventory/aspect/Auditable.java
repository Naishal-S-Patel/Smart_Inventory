package com.smartinventory.aspect;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a controller method for automatic audit logging.
 * The AuditLogAspect will intercept methods annotated with this
 * annotation and persist an AuditLog record after successful return.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {
    /** Logical entity name (e.g. "Product", "PurchaseOrder"). */
    String entity();

    /** Action label (e.g. "CREATE", "UPDATE", "DELETE", "APPROVE", "RECEIVE"). */
    String action();
}
