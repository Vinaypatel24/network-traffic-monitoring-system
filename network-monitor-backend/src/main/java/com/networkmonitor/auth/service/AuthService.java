package com.networkmonitor.auth.service;

import com.networkmonitor.auth.dto.JwtResponse;
import com.networkmonitor.auth.dto.LoginRequest;
import com.networkmonitor.auth.dto.RegisterRequest;
import com.networkmonitor.auth.dto.UserDTO;
import com.networkmonitor.auth.security.JwtUtil;
import com.networkmonitor.common.exception.ResourceNotFoundException;
import com.networkmonitor.user.entity.Role;
import com.networkmonitor.user.entity.User;
import com.networkmonitor.user.repository.RoleRepository;
import com.networkmonitor.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository         userRepository;
    private final RoleRepository         roleRepository;
    private final PasswordEncoder        passwordEncoder;
    private final AuthenticationManager  authenticationManager;
    private final JwtUtil                jwtUtil;
    private final UserDetailsService     userDetailsService;
    private final RefreshTokenService    refreshTokenService;

    @Value("${jwt.expiry-ms}")
    private long jwtExpiryMs;

    @Transactional
    public UserDTO register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already in use");
        }

        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new ResourceNotFoundException("Role not found", 0L));

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        user.addRole(userRole);
        User savedUser = userRepository.save(user);

        return mapToDTO(savedUser);
    }

    @Transactional
    public AuthResult login(LoginRequest request) {
        // Authenticate (throws BadCredentialsException if invalid)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();

        String accessToken = jwtUtil.generateToken(userDetails);
        String refreshToken = refreshTokenService.createRefreshToken(user);

        JwtResponse jwtResponse = JwtResponse.builder()
                .accessToken(accessToken)
                .expiresIn(jwtExpiryMs)
                .build();

        return new AuthResult(jwtResponse, refreshToken);
    }

    @Transactional
    public AuthResult refresh(String rawRefreshToken) {
        User user = refreshTokenService.verifyAndRotate(rawRefreshToken);
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());

        String newAccessToken = jwtUtil.generateToken(userDetails);
        String newRefreshToken = refreshTokenService.createRefreshToken(user);

        JwtResponse jwtResponse = JwtResponse.builder()
                .accessToken(newAccessToken)
                .expiresIn(jwtExpiryMs)
                .build();

        return new AuthResult(jwtResponse, newRefreshToken);
    }

    @Transactional
    public void logout(String username) {
        User user = userRepository.findByUsername(username).orElseThrow();
        refreshTokenService.revokeAllUserTokens(user);
    }

    public UserDTO getCurrentUser(String username) {
        User user = userRepository.findByUsername(username).orElseThrow();
        return mapToDTO(user);
    }

    private UserDTO mapToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                .build();
    }

    // Helper record to pass both tokens back to the controller
    public record AuthResult(JwtResponse jwtResponse, String rawRefreshToken) {}
}
