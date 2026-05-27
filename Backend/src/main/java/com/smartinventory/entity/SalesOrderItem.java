package com.smartinventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
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
        name = "sales_order_items",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_sales_order_items_order_product", columnNames = {"sales_order_id", "product_id"})
        },
        indexes = {
                @Index(name = "idx_sales_order_items_order", columnList = "sales_order_id"),
                @Index(name = "idx_sales_order_items_product", columnList = "product_id")
        }
)
public class SalesOrderItem {

    @Id
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sales_order_id", nullable = false)
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalPrice;
}
