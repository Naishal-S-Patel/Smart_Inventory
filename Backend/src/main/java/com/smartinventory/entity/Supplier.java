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
        name = "suppliers",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_suppliers_code", columnNames = "supplier_code")
        },
        indexes = {
                @Index(name = "idx_suppliers_active", columnList = "is_active"),
                @Index(name = "idx_suppliers_code", columnList = "supplier_code"),
                @Index(name = "idx_suppliers_company", columnList = "company_name")
        }
)
public class Supplier {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "supplier_code", nullable = false, length = 64)
    private String supplierCode;

    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @Column(name = "contact_person", length = 150)
    private String contactPerson;

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

    @Column(name = "avg_lead_days")
    private Integer avgLeadDays;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
