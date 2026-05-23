package com.smartinventory.service;

import com.smartinventory.dto.AuthResponse;
import com.smartinventory.dto.AuthUserDto;
import com.smartinventory.dto.JwtAuthenticationResponse;
import com.smartinventory.dto.RegisterRequest;
import com.smartinventory.entity.RefreshToken;
import com.smartinventory.entity.Role;
import com.smartinventory.entity.RoleName;
import com.smartinventory.entity.User;
import com.smartinventory.exception.AccountLockedException;
import com.smartinventory.exception.DuplicateEmailException;
import com.smartinventory.exception.InvalidCredentialsException;
import com.smartinventory.exception.TokenExpiredException;
import com.smartinventory.repository.RefreshTokenRepository;
import com.smartinventory.repository.RoleRepository;
import com.smartinventory.repository.UserRepository;
import com.smartinventory.security.JwtService;
import com.smartinventory.security.UserPrincipal;
import jakarta.transaction.Transactional;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final Duration LOCKOUT_DURATION = Duration.ofMinutes(15);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final Clock clock;
    private final long refreshTokenDays;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            Clock clock,
            @Value("${jwt.refresh-token-exp-days}") long refreshTokenDays
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.clock = clock;
        this.refreshTokenDays = refreshTokenDays;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new DuplicateEmailException(request.getEmail());
        }

        Role defaultRole = roleRepository.findByName(RoleName.STAFF)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.STAFF)));

        OffsetDateTime now = nowUtc();
        User user = new User();
        user.setEmail(request.getEmail().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setActive(true);
        user.setFailedLoginAttempts(0);
        user.setAccountLockedUntil(null);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        user.getRoles().add(defaultRole);

        User saved = userRepository.save(user);
        UserPrincipal principal = UserPrincipal.fromUser(saved);
        String accessToken = jwtService.generateAccessToken(principal);
        String refreshToken = createRefreshToken(saved, principal, now);

        log.info("User registered: {}", saved.getEmail());
        return buildAuthResponse(saved, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse login(String email, String password) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        if (isLocked(user)) {
            throw new AccountLockedException();
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            handleFailedLogin(user);
            throw new InvalidCredentialsException();
        }

        resetFailedAttempts(user);
        User saved = userRepository.save(user);
        UserPrincipal principal = UserPrincipal.fromUser(saved);
        String accessToken = jwtService.generateAccessToken(principal);
        String refreshToken = createRefreshToken(saved, principal, nowUtc());

        log.info("User logged in: {}", saved.getEmail());
        return buildAuthResponse(saved, accessToken, refreshToken);
    }

    @Transactional
    public JwtAuthenticationResponse refresh(String refreshToken) {
        RefreshToken token = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(TokenExpiredException::new);

        OffsetDateTime now = nowUtc();
        if (token.getRevokedAt() != null || now.isAfter(token.getExpiresAt())) {
            token.setRevokedAt(now);
            refreshTokenRepository.save(token);
            throw new TokenExpiredException();
        }

        User user = token.getUser();
        UserPrincipal principal = UserPrincipal.fromUser(user);
        String newAccessToken = jwtService.generateAccessToken(principal);
        String newRefreshToken = createRefreshToken(user, principal, now);

        token.setRevokedAt(now);
        refreshTokenRepository.save(token);

        return JwtAuthenticationResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    @Transactional
    public void logout(String refreshToken) {
        RefreshToken token = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(TokenExpiredException::new);
        token.setRevokedAt(nowUtc());
        refreshTokenRepository.save(token);
    }

    private String createRefreshToken(User user, UserPrincipal principal, OffsetDateTime now) {
        String refreshToken = jwtService.generateRefreshToken(principal);
        RefreshToken entity = new RefreshToken();
        entity.setUser(user);
        entity.setToken(refreshToken);
        entity.setCreatedAt(now);
        entity.setExpiresAt(now.plusDays(refreshTokenDays));
        refreshTokenRepository.save(entity);
        return refreshToken;
    }

    private void handleFailedLogin(User user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);
        user.setUpdatedAt(nowUtc());
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setAccountLockedUntil(nowUtc().plus(LOCKOUT_DURATION));
        }
        userRepository.save(user);
        log.warn("Failed login attempt {} for {}", attempts, user.getEmail());
    }

    private void resetFailedAttempts(User user) {
        user.setFailedLoginAttempts(0);
        user.setAccountLockedUntil(null);
        user.setUpdatedAt(nowUtc());
    }

    private boolean isLocked(User user) {
        OffsetDateTime lockedUntil = user.getAccountLockedUntil();
        return lockedUntil != null && nowUtc().isBefore(lockedUntil);
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        List<String> roles = user.getRoles().stream().map(role -> role.getName().name()).toList();
        AuthUserDto authUser = AuthUserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .roles(roles)
                .build();

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(authUser)
                .build();
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }
}
