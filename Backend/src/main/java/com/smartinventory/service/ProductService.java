package com.smartinventory.service;

import com.smartinventory.dto.ProductCreateRequest;
import com.smartinventory.dto.ProductDTO;
import com.smartinventory.dto.ProductUpdateRequest;
import com.smartinventory.entity.Category;
import com.smartinventory.entity.Product;
import com.smartinventory.exception.DuplicateBarcodeException;
import com.smartinventory.exception.DuplicateSkuException;
import com.smartinventory.exception.ProductNotFoundException;
import com.smartinventory.exception.ResourceNotFoundException;
import com.smartinventory.mapper.ProductMapper;
import com.smartinventory.repository.CategoryRepository;
import com.smartinventory.repository.ProductRepository;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;
    private final Clock clock;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            ProductMapper productMapper,
            Clock clock
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.productMapper = productMapper;
        this.clock = clock;
    }

    @Transactional
    public ProductDTO createProduct(ProductCreateRequest request) {
        if (productRepository.existsBySkuIgnoreCase(request.getSku())) {
            throw new DuplicateSkuException(request.getSku());
        }
        if (hasBarcode(request.getBarcode()) && productRepository.existsByBarcode(request.getBarcode())) {
            throw new DuplicateBarcodeException(request.getBarcode());
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + request.getCategoryId()));

        OffsetDateTime now = nowUtc();
        Product product = new Product();
        product.setSku(request.getSku().trim());
        product.setName(request.getName().trim());
        product.setDescription(request.getDescription());
        product.setCategory(category);
        product.setUnitCost(request.getUnitCost());
        product.setSellingPrice(request.getSellingPrice());
        product.setUnitOfMeasure(request.getUnitOfMeasure().trim());
        product.setReorderPoint(request.getReorderPoint());
        product.setMaxStockLevel(request.getMaxStockLevel());
        product.setBarcode(normalizeBarcode(request.getBarcode()));
        product.setImageUrl(request.getImageUrl());
        product.setActive(true);
        product.setCreatedAt(now);
        product.setUpdatedAt(now);

        Product saved = productRepository.save(product);
        log.info("Product created: {}", saved.getSku());
        return productMapper.toProductDto(saved);
    }

    @Transactional
    public ProductDTO updateProduct(UUID id, ProductUpdateRequest request) {
        Product product = productRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new ProductNotFoundException(id));

        if (request.getSku() != null && !request.getSku().equalsIgnoreCase(product.getSku())) {
            if (productRepository.existsBySkuIgnoreCase(request.getSku())) {
                throw new DuplicateSkuException(request.getSku());
            }
            product.setSku(request.getSku().trim());
        }

        if (request.getName() != null) {
            product.setName(request.getName().trim());
        }

        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }

        if (request.getCategoryId() != null && !request.getCategoryId().equals(product.getCategory().getId())) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + request.getCategoryId()));
            product.setCategory(category);
        }

        if (request.getUnitCost() != null) {
            product.setUnitCost(request.getUnitCost());
        }

        if (request.getSellingPrice() != null) {
            product.setSellingPrice(request.getSellingPrice());
        }

        if (request.getUnitOfMeasure() != null) {
            product.setUnitOfMeasure(request.getUnitOfMeasure().trim());
        }

        if (request.getReorderPoint() != null) {
            product.setReorderPoint(request.getReorderPoint());
        }

        if (request.getMaxStockLevel() != null) {
            product.setMaxStockLevel(request.getMaxStockLevel());
        }

        if (request.getBarcode() != null && !equalsIgnoreCase(request.getBarcode(), product.getBarcode())) {
            if (hasBarcode(request.getBarcode()) && productRepository.existsByBarcode(request.getBarcode())) {
                throw new DuplicateBarcodeException(request.getBarcode());
            }
            product.setBarcode(normalizeBarcode(request.getBarcode()));
        }

        if (request.getImageUrl() != null) {
            product.setImageUrl(request.getImageUrl());
        }

        product.setUpdatedAt(nowUtc());
        Product saved = productRepository.save(product);
        log.info("Product updated: {}", saved.getSku());
        return productMapper.toProductDto(saved);
    }

    @Transactional
    public void softDeleteProduct(UUID id) {
        Product product = productRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new ProductNotFoundException(id));

        product.setActive(false);
        product.setUpdatedAt(nowUtc());
        productRepository.save(product);
        log.info("Product soft deleted: {}", product.getSku());
    }

    @Transactional(readOnly = true)
    public ProductDTO getProductById(UUID id) {
        Product product = productRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        return productMapper.toProductDto(product);
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO> getAllProducts(String query, UUID categoryId, Pageable pageable) {
        String normalizedQuery = normalizeQuery(query);
        return productRepository.searchActiveProducts(normalizedQuery, categoryId, pageable)
                .map(productMapper::toProductDto);
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }

    private String normalizeQuery(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }
        return query.trim();
    }

    private boolean hasBarcode(String barcode) {
        return barcode != null && !barcode.isBlank();
    }

    private String normalizeBarcode(String barcode) {
        if (barcode == null) {
            return null;
        }
        String trimmed = barcode.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean equalsIgnoreCase(String first, String second) {
        if (first == null && second == null) {
            return true;
        }
        if (first == null || second == null) {
            return false;
        }
        return first.equalsIgnoreCase(second);
    }
}
