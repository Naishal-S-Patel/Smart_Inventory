package com.smartinventory.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProductDTO {

    private final UUID id;
    private final String sku;
    private final String name;
    private final String description;
    private final CategoryDTO category;
    private final BigDecimal unitCost;
    private final BigDecimal sellingPrice;
    private final String unitOfMeasure;
    private final int reorderPoint;
    private final int maxStockLevel;
    private final String barcode;
    private final String imageUrl;
    private final boolean isActive;
    private final OffsetDateTime createdAt;
    private final OffsetDateTime updatedAt;
}
