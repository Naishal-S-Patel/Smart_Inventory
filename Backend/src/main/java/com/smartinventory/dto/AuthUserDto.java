package com.smartinventory.dto;

import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthUserDto {

    private final UUID id;
    private final String email;
    private final List<String> roles;
}
