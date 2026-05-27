package com.smartinventory.repository;

import com.smartinventory.entity.Customer;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    Optional<Customer> findByIdAndIsActiveTrue(UUID id);

    boolean existsByCustomerCodeIgnoreCase(String customerCode);

    boolean existsByEmailIgnoreCase(String email);

    @Query(
            """
            SELECT c
            FROM Customer c
            WHERE (:isActive IS NULL OR c.isActive = :isActive)
                    AND (:city IS NULL OR LOWER(c.city) = LOWER(CAST(:city AS string)))
                    AND (:state IS NULL OR LOWER(c.state) = LOWER(CAST(:state AS string)))
                    AND (:country IS NULL OR LOWER(c.country) = LOWER(CAST(:country AS string)))
              AND (
                   :query IS NULL
                            OR LOWER(c.customerCode) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%'))
                            OR LOWER(c.fullName) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%'))
                            OR LOWER(c.email) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%'))
              )
            """
    )
    Page<Customer> searchCustomers(
            @Param("isActive") Boolean isActive,
            @Param("city") String city,
            @Param("state") String state,
            @Param("country") String country,
            @Param("query") String query,
            Pageable pageable
    );
}
