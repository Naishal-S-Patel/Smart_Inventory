package com.smartinventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
        name = "warehouses",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_warehouses_code", columnNames = "code")
        },
        indexes = {
                @Index(name = "idx_warehouses_active", columnList = "is_active"),
                @Index(name = "idx_warehouses_city", columnList = "city"),
                @Index(name = "idx_warehouses_state", columnList = "state")
        }
)
public class Warehouse {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 100)
    private String state;

    @Column(nullable = false)
    private int capacity;

        @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}
