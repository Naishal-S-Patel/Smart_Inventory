package com.smartinventory.service;

import com.smartinventory.dto.ProductCreateRequest;
import com.smartinventory.dto.ProductDTO;
import com.smartinventory.dto.ProductUpdateRequest;
import com.smartinventory.entity.Category;
import com.smartinventory.entity.Product;
import com.smartinventory.exception.DuplicateBarcodeException;
import com.smartinventory.exception.DuplicateSkuException;
import com.smartinventory.exception.ProductNotFoundException;
import com.smartinventory.mapper.ProductMapper;
import com.smartinventory.repository.CategoryRepository;
import com.smartinventory.repository.ProductRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductMapper productMapper;

    private ProductService productService;

    private final Clock clock = Clock.fixed(Instant.parse("2026-05-24T10:15:30Z"), ZoneOffset.UTC);

    @BeforeEach
    void setUp() {
        productService = new ProductService(productRepository, categoryRepository, productMapper, clock);
    }

    @Test
    void createProductPersistsAndReturnsDto() {
        UUID categoryId = UUID.randomUUID();
        Category category = new Category();
        category.setId(categoryId);

        ProductCreateRequest request = new ProductCreateRequest(
                "SKU-100",
                "Milk",
                "Fresh milk",
                categoryId,
                new BigDecimal("1.25"),
                new BigDecimal("2.50"),
                "LTR",
                5,
                100,
                "123456",
                "http://img.example/milk.png"
        );

        Product saved = new Product();
        saved.setId(UUID.randomUUID());
        saved.setSku("SKU-100");
        saved.setName("Milk");
        saved.setCategory(category);
        saved.setActive(true);

        ProductDTO dto = ProductDTO.builder().id(saved.getId()).sku(saved.getSku()).build();

        when(productRepository.existsBySkuIgnoreCase("SKU-100")).thenReturn(false);
        when(productRepository.existsByBarcode("123456")).thenReturn(false);
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenReturn(saved);
        when(productMapper.toProductDto(saved)).thenReturn(dto);

        ProductDTO result = productService.createProduct(request);

        assertThat(result.getId()).isEqualTo(saved.getId());
        assertThat(result.getSku()).isEqualTo("SKU-100");
    }

    @Test
    void createProductThrowsOnDuplicateSku() {
        ProductCreateRequest request = new ProductCreateRequest(
                "SKU-200",
                "Rice",
                null,
                UUID.randomUUID(),
                new BigDecimal("4.00"),
                new BigDecimal("5.00"),
                "KG",
                0,
                0,
                "",
                null
        );

        when(productRepository.existsBySkuIgnoreCase("SKU-200")).thenReturn(true);

        assertThatThrownBy(() -> productService.createProduct(request))
                .isInstanceOf(DuplicateSkuException.class);
    }

    @Test
    void updateProductThrowsOnDuplicateBarcode() {
        UUID productId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();

        Category category = new Category();
        category.setId(categoryId);

        Product product = new Product();
        product.setId(productId);
        product.setSku("SKU-300");
        product.setBarcode("111");
        product.setCategory(category);
        product.setActive(true);

        ProductUpdateRequest request = new ProductUpdateRequest();
        request.setBarcode("222");

        when(productRepository.findByIdAndIsActiveTrue(productId)).thenReturn(Optional.of(product));
        when(productRepository.existsByBarcode("222")).thenReturn(true);

        assertThatThrownBy(() -> productService.updateProduct(productId, request))
                .isInstanceOf(DuplicateBarcodeException.class);
    }

    @Test
    void softDeleteSetsInactive() {
        UUID productId = UUID.randomUUID();
        Product product = new Product();
        product.setId(productId);
        product.setSku("SKU-400");
        product.setActive(true);

        when(productRepository.findByIdAndIsActiveTrue(productId)).thenReturn(Optional.of(product));

        productService.softDeleteProduct(productId);

        ArgumentCaptor<Product> captor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(captor.capture());
        assertThat(captor.getValue().isActive()).isFalse();
    }

    @Test
    void getProductByIdThrowsWhenMissing() {
        UUID productId = UUID.randomUUID();
        when(productRepository.findByIdAndIsActiveTrue(productId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProductById(productId))
                .isInstanceOf(ProductNotFoundException.class);
    }

    @Test
    void getAllProductsUsesRepositorySearch() {
        PageRequest pageable = PageRequest.of(0, 10);
        Product product = new Product();
        product.setId(UUID.randomUUID());
        product.setSku("SKU-500");

        Page<Product> page = new PageImpl<>(java.util.List.of(product));
        when(productRepository.searchActiveProducts(eq("milk"), eq(null), eq(pageable))).thenReturn(page);
        when(productMapper.toProductDto(product)).thenReturn(ProductDTO.builder().id(product.getId()).sku("SKU-500").build());

        Page<ProductDTO> result = productService.getAllProducts("milk", null, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getSku()).isEqualTo("SKU-500");
    }
}
