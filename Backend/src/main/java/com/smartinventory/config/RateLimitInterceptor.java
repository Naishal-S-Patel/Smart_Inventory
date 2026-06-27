package com.smartinventory.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Sliding-window rate limiter keyed by client IP address.
 * Uses a ConcurrentHashMap of Deques — each deque holds the request
 * timestamps (epoch ms) within the current window.
 */
@Slf4j
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimitProperties properties;
    private final ConcurrentHashMap<String, Deque<Long>> requestLog = new ConcurrentHashMap<>();

    public RateLimitInterceptor(RateLimitProperties properties) {
        this.properties = properties;
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {
        String clientIp = resolveClientIp(request);
        long now = System.currentTimeMillis();
        long windowMs = (long) properties.getWindowSeconds() * 1000L;
        long cutoff = now - windowMs;

        Deque<Long> timestamps = requestLog.computeIfAbsent(clientIp, k -> new ArrayDeque<>());

        synchronized (timestamps) {
            // Remove timestamps outside the sliding window
            while (!timestamps.isEmpty() && timestamps.peekFirst() < cutoff) {
                timestamps.pollFirst();
            }

            if (timestamps.size() >= properties.getRequestsPerMinute()) {
                log.warn("Rate limit exceeded for IP: {} ({} requests in {}s)",
                        clientIp, timestamps.size(), properties.getWindowSeconds());
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"success\":false,\"message\":\"Too many requests. Please slow down.\"}");
                return false;
            }

            timestamps.addLast(now);
        }

        return true;
    }

    /**
     * Respects X-Forwarded-For so requests through reverse proxies / load
     * balancers are attributed to the real client rather than the proxy IP.
     */
    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // X-Forwarded-For may contain a comma-separated chain; take the first (leftmost)
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
