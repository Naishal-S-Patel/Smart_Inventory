package com.smartinventory.repository;

import com.smartinventory.entity.Product;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    Optional<Product> findByIdAndIsActiveTrue(UUID id);

    boolean existsBySkuIgnoreCase(String sku);

    boolean existsByBarcode(String barcode);

    @Query(
            value = """
                    SELECT *
                    FROM products
                    WHERE is_active = true
                      AND (:categoryId IS NULL OR category_id = :categoryId)
                      AND (
                          :query IS NULL OR
                          to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(barcode, ''))
                          @@ websearch_to_tsquery('simple', :query)
                      )
                    """,
            countQuery = """
                    SELECT count(*)
                    FROM products
                    WHERE is_active = true
                      AND (:categoryId IS NULL OR category_id = :categoryId)
                      AND (
                          :query IS NULL OR
                          to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(barcode, ''))
                          @@ websearch_to_tsquery('simple', :query)
                      )
                    """,
            nativeQuery = true
    )
    Page<Product> searchActiveProducts(
            @Param("query") String query,
            @Param("categoryId") UUID categoryId,
            Pageable pageable
    );
}
