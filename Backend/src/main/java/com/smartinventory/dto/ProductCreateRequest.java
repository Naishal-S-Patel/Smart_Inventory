package com.smartinventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductCreateRequest {

    @NotBlank
    @Size(max = 64)
    private String sku;

    @NotBlank
    @Size(max = 255)
    private String name;

    @Size(max = 2000)
    private String description;

    @NotNull
    private UUID categoryId;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal unitCost;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal sellingPrice;

    @NotBlank
    @Size(max = 32)
    private String unitOfMeasure;

    @Min(0)
    private int reorderPoint;

    @Min(0)
    private int maxStockLevel;

    @Size(max = 128)
    private String barcode;

    @Size(max = 512)
    private String imageUrl;
}
