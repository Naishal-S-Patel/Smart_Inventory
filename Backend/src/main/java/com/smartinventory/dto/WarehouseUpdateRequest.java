package com.smartinventory.dto;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseUpdateRequest {

    @Size(max = 150, message = "Name must not exceed 150 characters")
    private String name;

    @Size(max = 50, message = "Code must not exceed 50 characters")
    private String code;

    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;

    @Size(max = 100, message = "State must not exceed 100 characters")
    private String state;

    @Min(value = 1, message = "Capacity must be positive")
    private Integer capacity;

    private Boolean isActive;
}
