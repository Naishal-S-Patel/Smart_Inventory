package com.smartinventory.service;

import com.smartinventory.dto.UserDTO;
import com.smartinventory.entity.Role;
import com.smartinventory.entity.User;
import com.smartinventory.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toUserDto)
                .collect(Collectors.toList());
    }

    private UserDTO toUserDto(User user) {
        String roleStr = user.getRoles().stream()
                .map(Role::getName)
                .map(Enum::name)
                .findFirst()
                .orElse("STAFF");

        // Map department based on role name
        String department = switch (roleStr) {
            case "ADMIN" -> "IT";
            case "MANAGER" -> "Management";
            case "ANALYST" -> "Analytics";
            default -> "Warehouse";
        };

        String status = user.isActive() ? "active" : "inactive";

        return UserDTO.builder()
                .id(user.getId())
                .name(user.getFirstName() + " " + user.getLastName())
                .email(user.getEmail())
                .role(roleStr)
                .department(department)
                .status(status)
                .lastLogin(user.getUpdatedAt()) // Use updatedAt as a fallback for last login
                .build();
    }
}
