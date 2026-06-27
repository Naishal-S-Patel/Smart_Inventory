package com.smartinventory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartinventory.dto.AuthRequest;
import com.smartinventory.entity.Role;
import com.smartinventory.entity.RoleName;
import com.smartinventory.entity.User;
import com.smartinventory.repository.RefreshTokenRepository;
import com.smartinventory.repository.RoleRepository;
import com.smartinventory.repository.UserRepository;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private Clock clock;

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();

        Role role = roleRepository.findByName(RoleName.ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ADMIN)));

        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        User user = userRepository.findByEmailIgnoreCase("admin@smartinventory.com")
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail("admin@smartinventory.com");
                    newUser.setFirstName("Admin");
                    newUser.setLastName("User");
                    newUser.setActive(true);
                    newUser.setFailedLoginAttempts(0);
                    newUser.setCreatedAt(now);
                    return newUser;
                });
        user.setPasswordHash(passwordEncoder.encode("Password123!"));
        user.setUpdatedAt(now);
        
        if (user.getRoles() == null) {
            user.setRoles(new java.util.HashSet<>());
        }
        if (!user.getRoles().contains(role)) {
            user.getRoles().add(role);
        }
        userRepository.save(user);
    }

    @Test
    void validLoginReturnsTokens() throws Exception {
        AuthRequest request = new AuthRequest("admin@smartinventory.com", "Password123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty());
    }

    @Test
    void invalidPasswordReturnsUnauthorized() throws Exception {
        AuthRequest request = new AuthRequest("admin@smartinventory.com", "WrongPass1!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void protectedEndpointWithoutTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/test/protected"))
                .andExpect(status().isUnauthorized());
    }
}
