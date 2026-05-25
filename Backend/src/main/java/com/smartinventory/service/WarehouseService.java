package com.smartinventory.service;

import com.smartinventory.dto.WarehouseDTO;
import com.smartinventory.entity.Warehouse;
import com.smartinventory.exception.WarehouseNotFoundException;
import com.smartinventory.mapper.InventoryMapper;
import com.smartinventory.repository.WarehouseRepository;
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

    public WarehouseService(WarehouseRepository warehouseRepository, InventoryMapper inventoryMapper) {
        this.warehouseRepository = warehouseRepository;
        this.inventoryMapper = inventoryMapper;
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
}
