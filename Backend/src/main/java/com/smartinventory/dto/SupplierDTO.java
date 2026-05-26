package com.smartinventory.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "Supplier details")
public class SupplierDTO {

    private final UUID id;
    private final String supplierCode;
    private final String companyName;
    private final String contactPerson;
    private final String email;
    private final String phone;
    private final String address;
    private final String city;
    private final String state;
    private final String country;
    private final Integer avgLeadDays;
    private final boolean isActive;
    private final OffsetDateTime createdAt;
    private final OffsetDateTime updatedAt;
}
