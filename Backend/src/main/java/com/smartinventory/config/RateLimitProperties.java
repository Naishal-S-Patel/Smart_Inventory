package com.smartinventory.config;

import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.rate-limit")
public class RateLimitProperties {

    /** Maximum number of requests allowed per IP within the time window. */
    private int requestsPerMinute = 60;

    /** Length of the sliding window in seconds. */
    private int windowSeconds = 60;
}
