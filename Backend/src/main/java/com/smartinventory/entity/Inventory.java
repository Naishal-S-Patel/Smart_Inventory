package com.smartinventory.entity;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "inventory",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_inventory_product_warehouse",
                        columnNames = {"product_id", "warehouse_id"}
                )
        },
        indexes = {
                @Index(name = "idx_inventory_product_warehouse", columnList = "product_id, warehouse_id"),
                @Index(name = "idx_inventory_warehouse", columnList = "warehouse_id"),
                @Index(name = "idx_inventory_low_stock", columnList = "warehouse_id, quantity_on_hand, reserved_quantity")
        }
)
public class Inventory {

    @EmbeddedId
    private InventoryId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    @MapsId("productId")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    @MapsId("warehouseId")
    private Warehouse warehouse;

    @Column(name = "quantity_on_hand", nullable = false)
    private int quantityOnHand;

    @Column(name = "reserved_quantity", nullable = false)
    private int reservedQuantity;

    @Column(name = "reorder_point", nullable = false)
    private int reorderPoint;

    @Column(name = "last_updated_at", nullable = false)
    private OffsetDateTime lastUpdatedAt;

    @Transient
    public int getAvailableQuantity() {
        return Math.max(0, quantityOnHand - reservedQuantity);
    }

    /** Convenience for repos that look up by product + warehouse */
    public UUID getProductId() {
        return product != null ? product.getId() : null;
    }

    public UUID getWarehouseId() {
        return warehouse != null ? warehouse.getId() : null;
    }
}
