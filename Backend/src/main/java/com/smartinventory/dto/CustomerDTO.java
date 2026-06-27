package com.smartinventory.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
@Schema(description = "Customer details")
public class CustomerDTO {

    private final UUID id;
    private final String customerCode;
    private final String fullName;
    private final String email;
    private final String phone;
    private final String address;
    private final String city;
    private final String state;
    private final String country;
    private final int loyaltyPoints;
    private final boolean isActive;
    private final OffsetDateTime createdAt;
    private final OffsetDateTime updatedAt;
}
