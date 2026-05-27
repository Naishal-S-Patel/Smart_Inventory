package com.smartinventory.service;

import com.smartinventory.dto.CustomerCreateRequest;
import com.smartinventory.dto.CustomerDTO;
import com.smartinventory.dto.CustomerUpdateRequest;
import com.smartinventory.entity.Customer;
import com.smartinventory.exception.CustomerNotFoundException;
import com.smartinventory.mapper.SalesOrderMapper;
import com.smartinventory.repository.CustomerRepository;
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
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final SalesOrderMapper salesOrderMapper;
    private final Clock clock;

    public CustomerService(CustomerRepository customerRepository, SalesOrderMapper salesOrderMapper, Clock clock) {
        this.customerRepository = customerRepository;
        this.salesOrderMapper = salesOrderMapper;
        this.clock = clock;
    }

    @Transactional
    public CustomerDTO createCustomer(CustomerCreateRequest request) {
        if (customerRepository.existsByCustomerCodeIgnoreCase(request.getCustomerCode())) {
            throw new IllegalArgumentException("Customer code already exists: " + request.getCustomerCode());
        }
        if (request.getEmail() != null && customerRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new IllegalArgumentException("Customer email already exists: " + request.getEmail());
        }

        OffsetDateTime now = nowUtc();
        Customer customer = new Customer();
        customer.setCustomerCode(request.getCustomerCode().trim());
        customer.setFullName(request.getFullName().trim());
        customer.setEmail(trimOrNull(request.getEmail()));
        customer.setPhone(trimOrNull(request.getPhone()));
        customer.setAddress(trimOrNull(request.getAddress()));
        customer.setCity(trimOrNull(request.getCity()));
        customer.setState(trimOrNull(request.getState()));
        customer.setCountry(trimOrNull(request.getCountry()));
        customer.setLoyaltyPoints(0);
        customer.setActive(true);
        customer.setCreatedAt(now);
        customer.setUpdatedAt(now);

        Customer saved = customerRepository.save(customer);
        log.info("Customer created: {}", saved.getCustomerCode());
        return salesOrderMapper.toCustomerDto(saved);
    }

    @Transactional
    public CustomerDTO updateCustomer(UUID id, CustomerUpdateRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new CustomerNotFoundException(id));

        if (request.getCustomerCode() != null
                && !request.getCustomerCode().equalsIgnoreCase(customer.getCustomerCode())) {
            if (customerRepository.existsByCustomerCodeIgnoreCase(request.getCustomerCode())) {
                throw new IllegalArgumentException("Customer code already exists: " + request.getCustomerCode());
            }
            customer.setCustomerCode(request.getCustomerCode().trim());
        }

        if (request.getFullName() != null) {
            customer.setFullName(request.getFullName().trim());
        }

        if (request.getEmail() != null
                && !request.getEmail().equalsIgnoreCase(customer.getEmail())) {
            if (customerRepository.existsByEmailIgnoreCase(request.getEmail())) {
                throw new IllegalArgumentException("Customer email already exists: " + request.getEmail());
            }
            customer.setEmail(trimOrNull(request.getEmail()));
        }

        if (request.getPhone() != null) {
            customer.setPhone(trimOrNull(request.getPhone()));
        }

        if (request.getAddress() != null) {
            customer.setAddress(trimOrNull(request.getAddress()));
        }

        if (request.getCity() != null) {
            customer.setCity(trimOrNull(request.getCity()));
        }

        if (request.getState() != null) {
            customer.setState(trimOrNull(request.getState()));
        }

        if (request.getCountry() != null) {
            customer.setCountry(trimOrNull(request.getCountry()));
        }

        if (request.getLoyaltyPoints() != null) {
            customer.setLoyaltyPoints(request.getLoyaltyPoints());
        }

        if (request.getIsActive() != null) {
            customer.setActive(request.getIsActive());
        }

        customer.setUpdatedAt(nowUtc());
        Customer saved = customerRepository.save(customer);
        log.info("Customer updated: {}", saved.getCustomerCode());
        return salesOrderMapper.toCustomerDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<CustomerDTO> getCustomers(Boolean isActive, String city, String state,
                                          String country, String query, Pageable pageable) {
        return customerRepository.searchCustomers(isActive, trimOrNull(city), trimOrNull(state),
                        trimOrNull(country), trimOrNull(query), pageable)
                .map(salesOrderMapper::toCustomerDto);
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }

    private String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
