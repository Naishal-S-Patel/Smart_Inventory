package com.smartinventory.mapper;

import com.smartinventory.dto.CustomerDTO;
import com.smartinventory.dto.SalesOrderDTO;
import com.smartinventory.dto.SalesOrderItemDTO;
import com.smartinventory.entity.Customer;
import com.smartinventory.entity.SalesOrder;
import com.smartinventory.entity.SalesOrderItem;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class SalesOrderMapper {

    private final ProductMapper productMapper;
    private final InventoryMapper inventoryMapper;

    public SalesOrderMapper(ProductMapper productMapper, InventoryMapper inventoryMapper) {
        this.productMapper = productMapper;
        this.inventoryMapper = inventoryMapper;
    }

    public CustomerDTO toCustomerDto(Customer customer) {
        if (customer == null) {
            return null;
        }
        return CustomerDTO.builder()
                .id(customer.getId())
                .customerCode(customer.getCustomerCode())
                .fullName(customer.getFullName())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .address(customer.getAddress())
                .city(customer.getCity())
                .state(customer.getState())
                .country(customer.getCountry())
                .loyaltyPoints(customer.getLoyaltyPoints())
                .isActive(customer.isActive())
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }

    public SalesOrderItemDTO toSalesOrderItemDto(SalesOrderItem item) {
        if (item == null) {
            return null;
        }
        return SalesOrderItemDTO.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .product(productMapper.toProductDto(item.getProduct()))
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .build();
    }

    public SalesOrderDTO toSalesOrderDto(SalesOrder salesOrder) {
        if (salesOrder == null) {
            return null;
        }
        List<SalesOrderItemDTO> itemDtos = salesOrder.getItems().stream()
                .map(this::toSalesOrderItemDto)
                .collect(Collectors.toList());

        return SalesOrderDTO.builder()
                .id(salesOrder.getId())
                .orderNumber(salesOrder.getOrderNumber())
                .customerId(salesOrder.getCustomer().getId())
                .customer(toCustomerDto(salesOrder.getCustomer()))
                .warehouseId(salesOrder.getWarehouse().getId())
                .warehouse(inventoryMapper.toWarehouseDto(salesOrder.getWarehouse()))
                .status(salesOrder.getStatus())
                .totalAmount(salesOrder.getTotalAmount())
                .paymentMethod(salesOrder.getPaymentMethod())
                .paymentStatus(salesOrder.getPaymentStatus())
                .notes(salesOrder.getNotes())
                .createdBy(toUserId(salesOrder.getCreatedBy()))
                .createdAt(salesOrder.getCreatedAt())
                .updatedAt(salesOrder.getUpdatedAt())
                .items(itemDtos)
                .build();
    }

    private UUID toUserId(com.smartinventory.entity.User user) {
        if (user == null) {
            return null;
        }
        return user.getId();
    }
}
