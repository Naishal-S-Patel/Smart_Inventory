package com.smartinventory.controller;

import com.smartinventory.dto.ApiResponse;
import com.smartinventory.dto.CustomerCreateRequest;
import com.smartinventory.dto.CustomerDTO;
import com.smartinventory.dto.CustomerUpdateRequest;
import com.smartinventory.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customers")
@Tag(name = "Customers", description = "Customer management")
public class CustomerController {

    private final CustomerService customerService;
    private final Clock clock;

    public CustomerController(CustomerService customerService, Clock clock) {
        this.customerService = customerService;
        this.clock = clock;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    @Operation(summary = "List customers")
    public ResponseEntity<ApiResponse<Page<CustomerDTO>>> getCustomers(
            @Parameter(description = "Active status")
            @RequestParam(value = "active", required = false) Boolean isActive,
            @Parameter(description = "City")
            @RequestParam(value = "city", required = false) String city,
            @Parameter(description = "State")
            @RequestParam(value = "state", required = false) String state,
            @Parameter(description = "Country")
            @RequestParam(value = "country", required = false) String country,
            @Parameter(description = "Search query")
            @RequestParam(value = "query", required = false) String query,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<CustomerDTO> page = customerService.getCustomers(isActive, city, state, country, query, pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Customers retrieved", nowUtc()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "Create customer")
    public ResponseEntity<ApiResponse<CustomerDTO>> createCustomer(
            @Valid @RequestBody CustomerCreateRequest request
    ) {
        CustomerDTO customer = customerService.createCustomer(request);
        return ResponseEntity.ok(ApiResponse.success(customer, "Customer created", nowUtc()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "Update customer")
    public ResponseEntity<ApiResponse<CustomerDTO>> updateCustomer(
            @PathVariable UUID id,
            @Valid @RequestBody CustomerUpdateRequest request
    ) {
        CustomerDTO customer = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(ApiResponse.success(customer, "Customer updated", nowUtc()));
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }
}
