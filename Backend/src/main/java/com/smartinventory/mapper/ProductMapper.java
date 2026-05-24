package com.smartinventory.mapper;

import com.smartinventory.dto.CategoryDTO;
import com.smartinventory.dto.ProductDTO;
import com.smartinventory.entity.Category;
import com.smartinventory.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public CategoryDTO toCategoryDto(Category category) {
        if (category == null) {
            return null;
        }
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    public ProductDTO toProductDto(Product product) {
        if (product == null) {
            return null;
        }
        return ProductDTO.builder()
                .id(product.getId())
                .sku(product.getSku())
                .name(product.getName())
                .description(product.getDescription())
                .category(toCategoryDto(product.getCategory()))
                .unitCost(product.getUnitCost())
                .sellingPrice(product.getSellingPrice())
                .unitOfMeasure(product.getUnitOfMeasure())
                .reorderPoint(product.getReorderPoint())
                .maxStockLevel(product.getMaxStockLevel())
                .barcode(product.getBarcode())
                .imageUrl(product.getImageUrl())
                .isActive(product.isActive())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
