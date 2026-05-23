package com.smartinventory.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final String secret;
    private final Duration accessTokenTtl;
    private final Duration refreshTokenTtl;
    private final Clock clock;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-exp-minutes}") long accessMinutes,
            @Value("${jwt.refresh-token-exp-days}") long refreshDays,
            Clock clock
    ) {
        this.secret = secret;
        this.accessTokenTtl = Duration.ofMinutes(accessMinutes);
        this.refreshTokenTtl = Duration.ofDays(refreshDays);
        this.clock = clock;
    }

    public String generateAccessToken(UserPrincipal principal) {
        Map<String, Object> claims = new HashMap<>();
        List<String> roles = principal.getRoles().stream().map(Enum::name).toList();
        claims.put("roles", roles);
        return buildToken(claims, principal.getUsername(), accessTokenTtl);
    }

    public String generateRefreshToken(UserPrincipal principal) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        return buildToken(claims, principal.getUsername(), refreshTokenTtl);
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        String username = extractSubject(token);
        return username.equalsIgnoreCase(userDetails.getUsername()) && !isTokenExpired(token);
    }

    public Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String extractSubject(String token) {
        return extractClaims(token).getSubject();
    }

    private String buildToken(Map<String, Object> claims, String subject, Duration ttl) {
        Instant now = clock.instant();
        Instant expiresAt = now.plus(ttl);
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiresAt))
                .signWith(signingKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private boolean isTokenExpired(String token) {
        Date expiration = extractClaims(token).getExpiration();
        return expiration.before(Date.from(clock.instant()));
    }

    private Key signingKey() {
        if (secret.startsWith("base64:")) {
            byte[] decoded = Decoders.BASE64.decode(secret.substring("base64:".length()));
            return Keys.hmacShaKeyFor(decoded);
        }
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}
