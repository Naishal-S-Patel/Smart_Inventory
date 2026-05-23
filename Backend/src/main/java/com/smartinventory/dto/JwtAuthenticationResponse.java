package com.smartinventory.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JwtAuthenticationResponse {

    private final String accessToken;
    private final String refreshToken;
}
