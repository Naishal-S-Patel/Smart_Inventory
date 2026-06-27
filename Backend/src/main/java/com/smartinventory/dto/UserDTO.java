package com.smartinventory.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class UserDTO {
    private final UUID id;
    private final String name;
    private final String email;
    private final String role;
    private final String department;
    private final String status;
    private final OffsetDateTime lastLogin;
}
