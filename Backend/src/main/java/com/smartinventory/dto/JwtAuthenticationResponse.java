package com.smartinventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class JwtAuthenticationResponse {

    private final String accessToken;
    private final String refreshToken;
}

