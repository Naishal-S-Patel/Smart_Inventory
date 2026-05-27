package com.smartinventory.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
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
        name = "sales_orders",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_sales_orders_number", columnNames = "order_number")
        },
        indexes = {
                @Index(name = "idx_sales_orders_status", columnList = "status"),
                @Index(name = "idx_sales_orders_customer", columnList = "customer_id"),
                @Index(name = "idx_sales_orders_warehouse", columnList = "warehouse_id"),
                @Index(name = "idx_sales_orders_payment_status", columnList = "payment_status"),
                @Index(name = "idx_sales_orders_created_at", columnList = "created_at")
        }
)
public class SalesOrder {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "order_number", nullable = false, length = 32)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private SalesOrderStatus status;

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 24)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 24)
    private PaymentStatus paymentStatus;

    @Column(columnDefinition = "text")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "salesOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SalesOrderItem> items = new ArrayList<>();
}
