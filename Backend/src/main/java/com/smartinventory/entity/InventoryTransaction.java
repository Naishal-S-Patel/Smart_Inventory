package com.smartinventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "inventory_transactions",
        indexes = {
                @Index(name = "idx_inventory_transactions_created_at", columnList = "created_at"),
                @Index(name = "idx_inventory_transactions_product", columnList = "product_id"),
                @Index(name = "idx_inventory_transactions_warehouse", columnList = "warehouse_id")
        }
)
public class InventoryTransaction {

    @Id
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 32)
    private InventoryTransactionType transactionType;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "reference_id", length = 128)
    private String referenceId;

    @Column(name = "reference_type", length = 64)
    private String referenceType;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_by", length = 255)
    private String createdBy;
}
