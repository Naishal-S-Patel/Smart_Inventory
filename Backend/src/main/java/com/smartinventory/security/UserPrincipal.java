package com.smartinventory.security;

import com.smartinventory.entity.Role;
import com.smartinventory.entity.RoleName;
import com.smartinventory.entity.User;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Getter
public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final String email;
    private final String password;
    private final boolean active;
    private final OffsetDateTime accountLockedUntil;
    private final Set<RoleName> roles;

    public UserPrincipal(UUID id, String email, String password, boolean active,
                         OffsetDateTime accountLockedUntil, Set<RoleName> roles) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.active = active;
        this.accountLockedUntil = accountLockedUntil;
        this.roles = roles;
    }

    public static UserPrincipal fromUser(User user) {
        Set<RoleName> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());
        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.isActive(),
                user.getAccountLockedUntil(),
                roleNames
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
                .collect(Collectors.toSet());
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        if (accountLockedUntil == null) {
            return true;
        }
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        return !now.isBefore(accountLockedUntil);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
