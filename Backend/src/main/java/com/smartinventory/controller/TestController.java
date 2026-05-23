package com.smartinventory.controller;

import com.smartinventory.dto.ApiResponse;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/test")
public class TestController {

    private final Clock clock;

    public TestController(Clock clock) {
        this.clock = clock;
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Void>> health() {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        ApiResponse<Void> response = ApiResponse.success(null, "Service is running", now);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/protected")
    public ResponseEntity<ApiResponse<String>> protectedEndpoint() {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        ApiResponse<String> response = ApiResponse.success("Protected access granted", "OK", now);
        return ResponseEntity.ok(response);
    }
}
