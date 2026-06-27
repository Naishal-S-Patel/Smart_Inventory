package com.smartinventory.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class CategoryDTO {

    private final UUID id;
    private final String name;
    private final String description;
    private final OffsetDateTime createdAt;
    private final OffsetDateTime updatedAt;
}
