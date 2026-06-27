package com.smartinventory.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private final boolean success;
    private final ErrorDetail error;
    private final OffsetDateTime timestamp;

    @Getter
    @Builder
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorDetail {
        private final String code;
        private final String message;
    }

    public static ErrorResponse of(String code, String message, OffsetDateTime timestamp) {
        return ErrorResponse.builder()
                .success(false)
                .error(ErrorDetail.builder().code(code).message(message).build())
                .timestamp(timestamp)
                .build();
    }
}
