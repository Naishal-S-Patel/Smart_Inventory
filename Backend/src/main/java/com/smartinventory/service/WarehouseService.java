package com.smartinventory.service;

import com.smartinventory.dto.WarehouseCreateRequest;
import com.smartinventory.dto.WarehouseUpdateRequest;
import com.smartinventory.dto.WarehouseDTO;
import com.smartinventory.entity.Warehouse;
import com.smartinventory.exception.WarehouseNotFoundException;
import com.smartinventory.mapper.InventoryMapper;
import com.smartinventory.repository.WarehouseRepository;
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
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final InventoryMapper inventoryMapper;
    private final Clock clock;

    public WarehouseService(WarehouseRepository warehouseRepository, InventoryMapper inventoryMapper, Clock clock) {
        this.warehouseRepository = warehouseRepository;
        this.inventoryMapper = inventoryMapper;
        this.clock = clock;
    }

    @Transactional
    public WarehouseDTO createWarehouse(WarehouseCreateRequest request) {
        if (warehouseRepository.existsByCodeIgnoreCase(request.getCode())) {
            throw new IllegalArgumentException("Warehouse code already exists: " + request.getCode());
        }

        OffsetDateTime now = nowUtc();
        Warehouse warehouse = new Warehouse();
        warehouse.setName(request.getName().trim());
        warehouse.setCode(request.getCode().trim().toUpperCase());
        warehouse.setCity(request.getCity().trim());
        warehouse.setState(request.getState().trim());
        warehouse.setCapacity(request.getCapacity());
        warehouse.setActive(true);
        warehouse.setCreatedAt(now);
        warehouse.setUpdatedAt(now);

        Warehouse saved = warehouseRepository.save(warehouse);
        log.info("Warehouse created: {}", saved.getCode());
        return inventoryMapper.toWarehouseDto(saved);
    }

    @Transactional
    public WarehouseDTO updateWarehouse(UUID id, WarehouseUpdateRequest request) {
        Warehouse warehouse = warehouseRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new WarehouseNotFoundException(id));

        if (request.getCode() != null && !request.getCode().equalsIgnoreCase(warehouse.getCode())) {
            if (warehouseRepository.existsByCodeIgnoreCase(request.getCode())) {
                throw new IllegalArgumentException("Warehouse code already exists: " + request.getCode());
            }
            warehouse.setCode(request.getCode().trim().toUpperCase());
        }

        if (request.getName() != null) {
            warehouse.setName(request.getName().trim());
        }
        if (request.getCity() != null) {
            warehouse.setCity(request.getCity().trim());
        }
        if (request.getState() != null) {
            warehouse.setState(request.getState().trim());
        }
        if (request.getCapacity() != null) {
            warehouse.setCapacity(request.getCapacity());
        }
        if (request.getIsActive() != null) {
            warehouse.setActive(request.getIsActive());
        }

        warehouse.setUpdatedAt(nowUtc());
        Warehouse saved = warehouseRepository.save(warehouse);
        log.info("Warehouse updated: {}", saved.getCode());
        return inventoryMapper.toWarehouseDto(saved);
    }

    @Transactional(readOnly = true)
    public WarehouseDTO getWarehouseById(UUID id) {
        Warehouse warehouse = getWarehouseEntity(id);
        return inventoryMapper.toWarehouseDto(warehouse);
    }

    @Transactional(readOnly = true)
    public Page<WarehouseDTO> getWarehouses(Pageable pageable) {
        return warehouseRepository.findByIsActiveTrue(pageable)
                .map(inventoryMapper::toWarehouseDto);
    }

    @Transactional(readOnly = true)
    public Warehouse getWarehouseEntity(UUID id) {
        return warehouseRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new WarehouseNotFoundException(id));
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }
}
