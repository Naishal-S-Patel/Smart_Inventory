package com.smartinventory.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Supplier create request")
public class SupplierCreateRequest {

    @NotBlank
    @Size(max = 64)
    private String supplierCode;

    @NotBlank
    @Size(max = 200)
    private String companyName;

    @Size(max = 150)
    private String contactPerson;

    @Email
    @Size(max = 255)
    private String email;

    @Size(max = 50)
    private String phone;

    @Size(max = 255)
    private String address;

    @Size(max = 100)
    private String city;

    @Size(max = 100)
    private String state;

    @Size(max = 100)
    private String country;

    @Min(0)
    private Integer avgLeadDays;
}
