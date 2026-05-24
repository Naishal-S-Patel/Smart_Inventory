package com.smartinventory.config;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
public class SeedDataRunner implements ApplicationRunner {

    private static final String DEFAULT_PASSWORD = "Password123!";

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public SeedDataRunner(
            JdbcTemplate jdbcTemplate,
            PasswordEncoder passwordEncoder,
            Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        ensureRoles();

        seedUser(
                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                "admin@smartinventory.com",
                "Admin",
                "User",
            "ADMIN"
        );

        seedUser(
                UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                "manager@smartinventory.com",
                "Manager",
                "User",
            "MANAGER"
        );

        seedUser(
                UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                "staff@smartinventory.com",
                "Staff",
                "User",
            "STAFF"
        );

        seedUser(
                UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                "analyst@smartinventory.com",
                "Analyst",
                "User",
            "ANALYST"
        );
    }

        private void ensureRoles() {
        jdbcTemplate.update(
            "INSERT INTO roles (id, name) VALUES (?, ?) ON CONFLICT (name) DO NOTHING",
            UUID.fromString("11111111-1111-1111-1111-111111111111"),
            "ADMIN"
        );
        jdbcTemplate.update(
            "INSERT INTO roles (id, name) VALUES (?, ?) ON CONFLICT (name) DO NOTHING",
            UUID.fromString("22222222-2222-2222-2222-222222222222"),
            "MANAGER"
        );
        jdbcTemplate.update(
            "INSERT INTO roles (id, name) VALUES (?, ?) ON CONFLICT (name) DO NOTHING",
            UUID.fromString("33333333-3333-3333-3333-333333333333"),
            "STAFF"
        );
        jdbcTemplate.update(
            "INSERT INTO roles (id, name) VALUES (?, ?) ON CONFLICT (name) DO NOTHING",
            UUID.fromString("44444444-4444-4444-4444-444444444444"),
            "ANALYST"
        );
        }

            private void seedUser(UUID id, String email, String firstName, String lastName, String roleName) {
            OffsetDateTime now = nowUtc();
            String passwordHash = passwordEncoder.encode(DEFAULT_PASSWORD);

            jdbcTemplate.update(
                """
                    INSERT INTO users (
                        id,
                        email,
                        password_hash,
                        first_name,
                        last_name,
                        is_active,
                        failed_login_attempts,
                        account_locked_until,
                        created_at,
                        updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT (email) DO UPDATE
                    SET
                        password_hash = EXCLUDED.password_hash,
                        first_name = EXCLUDED.first_name,
                        last_name = EXCLUDED.last_name,
                        is_active = TRUE,
                        failed_login_attempts = 0,
                        account_locked_until = NULL,
                        updated_at = EXCLUDED.updated_at
                    """,
                id,
                email.toLowerCase(),
                passwordHash,
                firstName,
                lastName,
                true,
                0,
                null,
                now,
                now
            );

            UUID userId = jdbcTemplate.queryForObject(
                "SELECT id FROM users WHERE email = ?",
                UUID.class,
                email.toLowerCase()
            );

            if (userId != null) {
                jdbcTemplate.update("DELETE FROM user_roles WHERE user_id = ?", userId);
                jdbcTemplate.update(
                    """
                        INSERT INTO user_roles (user_id, role_id)
                        SELECT ?, r.id FROM roles r WHERE r.name = ?
                        ON CONFLICT DO NOTHING
                        """,
                    userId,
                    roleName
                );
            }

            log.info("Seeded user {} with role {}", email, roleName);
            }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }
}
