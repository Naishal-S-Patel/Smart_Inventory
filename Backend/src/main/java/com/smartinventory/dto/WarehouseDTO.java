package com.smartinventory.dto;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class WarehouseDTO {

    private final UUID id;
    private final String name;
    private final String code;
    private final String city;
    private final String state;
    private final int capacity;
    private final boolean isActive;
}
