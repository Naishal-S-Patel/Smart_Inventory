package com.smartinventory.mapper;

import com.smartinventory.dto.PurchaseOrderDTO;
import com.smartinventory.dto.PurchaseOrderItemDTO;
import com.smartinventory.dto.SupplierDTO;
import com.smartinventory.entity.PurchaseOrder;
import com.smartinventory.entity.PurchaseOrderItem;
import com.smartinventory.entity.Supplier;
import com.smartinventory.entity.User;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class PurchaseOrderMapper {

    private final ProductMapper productMapper;
    private final InventoryMapper inventoryMapper;

    public PurchaseOrderMapper(ProductMapper productMapper, InventoryMapper inventoryMapper) {
        this.productMapper = productMapper;
        this.inventoryMapper = inventoryMapper;
    }

    public SupplierDTO toSupplierDto(Supplier supplier) {
        if (supplier == null) {
            return null;
        }
        return SupplierDTO.builder()
                .id(supplier.getId())
                .supplierCode(supplier.getSupplierCode())
                .companyName(supplier.getCompanyName())
                .contactPerson(supplier.getContactPerson())
                .email(supplier.getEmail())
                .phone(supplier.getPhone())
                .address(supplier.getAddress())
                .city(supplier.getCity())
                .state(supplier.getState())
                .country(supplier.getCountry())
                .avgLeadDays(supplier.getAvgLeadDays())
                .isActive(supplier.isActive())
                .createdAt(supplier.getCreatedAt())
                .updatedAt(supplier.getUpdatedAt())
                .build();
    }

    public PurchaseOrderItemDTO toPurchaseOrderItemDto(PurchaseOrderItem item) {
        if (item == null) {
            return null;
        }
        return PurchaseOrderItemDTO.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .product(productMapper.toProductDto(item.getProduct()))
                .quantity(item.getQuantity())
                .unitCost(item.getUnitCost())
                .totalCost(item.getTotalCost())
                .receivedQuantity(item.getReceivedQuantity())
                .build();
    }

    public PurchaseOrderDTO toPurchaseOrderDto(PurchaseOrder purchaseOrder) {
        if (purchaseOrder == null) {
            return null;
        }
        List<PurchaseOrderItemDTO> itemDtos = purchaseOrder.getItems().stream()
                .map(this::toPurchaseOrderItemDto)
                .collect(Collectors.toList());

        return PurchaseOrderDTO.builder()
                .id(purchaseOrder.getId())
                .orderNumber(purchaseOrder.getOrderNumber())
                .supplierId(purchaseOrder.getSupplier().getId())
                .supplier(toSupplierDto(purchaseOrder.getSupplier()))
                .warehouseId(purchaseOrder.getWarehouse().getId())
                .warehouse(inventoryMapper.toWarehouseDto(purchaseOrder.getWarehouse()))
                .status(purchaseOrder.getStatus())
                .totalAmount(purchaseOrder.getTotalAmount())
                .expectedDeliveryDate(purchaseOrder.getExpectedDeliveryDate())
                .actualDeliveryDate(purchaseOrder.getActualDeliveryDate())
                .createdBy(toUserId(purchaseOrder.getCreatedBy()))
                .approvedBy(toUserId(purchaseOrder.getApprovedBy()))
                .notes(purchaseOrder.getNotes())
                .createdAt(purchaseOrder.getCreatedAt())
                .updatedAt(purchaseOrder.getUpdatedAt())
                .items(itemDtos)
                .build();
    }

    private UUID toUserId(User user) {
        if (user == null) {
            return null;
        }
        return user.getId();
    }
}
