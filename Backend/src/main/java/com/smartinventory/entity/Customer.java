package com.smartinventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
        name = "customers",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_customers_code", columnNames = "customer_code"),
                @UniqueConstraint(name = "uq_customers_email", columnNames = "email")
        },
        indexes = {
                @Index(name = "idx_customers_active", columnList = "is_active"),
                @Index(name = "idx_customers_city", columnList = "city"),
                @Index(name = "idx_customers_state", columnList = "state"),
                @Index(name = "idx_customers_country", columnList = "country")
        }
)
public class Customer {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "customer_code", nullable = false, length = 64)
    private String customerCode;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(length = 255)
    private String email;

    @Column(length = 50)
    private String phone;

    @Column(length = 255)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    private String country;

    @Column(name = "loyalty_points", nullable = false)
    private int loyaltyPoints;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
