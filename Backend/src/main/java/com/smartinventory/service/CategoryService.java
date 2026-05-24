package com.smartinventory.service;

import com.smartinventory.dto.CategoryCreateRequest;
import com.smartinventory.dto.CategoryDTO;
import com.smartinventory.dto.CategoryUpdateRequest;
import com.smartinventory.entity.Category;
import com.smartinventory.exception.ResourceNotFoundException;
import com.smartinventory.mapper.ProductMapper;
import com.smartinventory.repository.CategoryRepository;
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
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;
    private final Clock clock;

    public CategoryService(CategoryRepository categoryRepository, ProductMapper productMapper, Clock clock) {
        this.categoryRepository = categoryRepository;
        this.productMapper = productMapper;
        this.clock = clock;
    }

    @Transactional
    public CategoryDTO createCategory(CategoryCreateRequest request) {
        OffsetDateTime now = nowUtc();
        Category category = new Category();
        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        category.setCreatedAt(now);
        category.setUpdatedAt(now);

        Category saved = categoryRepository.save(category);
        log.info("Category created: {}", saved.getName());
        return productMapper.toCategoryDto(saved);
    }

    @Transactional
    public CategoryDTO updateCategory(UUID id, CategoryUpdateRequest request) {
        Category category = getCategoryEntity(id);

        if (request.getName() != null) {
            category.setName(request.getName().trim());
        }

        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }

        category.setUpdatedAt(nowUtc());
        Category saved = categoryRepository.save(category);
        log.info("Category updated: {}", saved.getName());
        return productMapper.toCategoryDto(saved);
    }

    @Transactional
    public void deleteCategory(UUID id) {
        Category category = getCategoryEntity(id);
        categoryRepository.delete(category);
        log.info("Category deleted: {}", category.getName());
    }

    @Transactional(readOnly = true)
    public Page<CategoryDTO> getAllCategories(Pageable pageable) {
        return categoryRepository.findAll(pageable)
                .map(productMapper::toCategoryDto);
    }

    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(UUID id) {
        Category category = getCategoryEntity(id);
        return productMapper.toCategoryDto(category);
    }

    @Transactional(readOnly = true)
    public Category getCategoryEntity(UUID id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }
}
