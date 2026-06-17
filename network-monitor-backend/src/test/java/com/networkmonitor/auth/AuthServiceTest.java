package com.networkmonitor.auth;

import com.networkmonitor.auth.dto.LoginRequest;
import com.networkmonitor.auth.dto.RegisterRequest;
import com.networkmonitor.auth.dto.UserDTO;
import com.networkmonitor.auth.security.JwtUtil;
import com.networkmonitor.auth.service.AuthService;
import com.networkmonitor.auth.service.RefreshTokenService;
import com.networkmonitor.user.entity.Role;
import com.networkmonitor.user.entity.User;
import com.networkmonitor.user.repository.RoleRepository;
import com.networkmonitor.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtUtil jwtUtil;
    @Mock private UserDetailsService userDetailsService;
    @Mock private RefreshTokenService refreshTokenService;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private Role userRole;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "jwtExpiryMs", 900000L);

        userRole = new Role(1L, "ROLE_USER");
        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .passwordHash("hashedpassword")
                .createdAt(Instant.now())
                .enabled(true)
                .build();
        testUser.addRole(userRole);
    }

    @Test
    void register_Success() {
        RegisterRequest request = new RegisterRequest("testuser", "test@example.com", "password");

        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.of(userRole));
        when(passwordEncoder.encode("password")).thenReturn("hashedpassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserDTO result = authService.register(request);

        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        assertTrue(result.getRoles().contains("ROLE_USER"));
    }

    @Test
    void register_UsernameTaken() {
        RegisterRequest request = new RegisterRequest("testuser", "test@example.com", "password");
        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> authService.register(request));
    }

    @Test
    void login_Success() {
        LoginRequest request = new LoginRequest("testuser", "password");
        Authentication auth = new UsernamePasswordAuthenticationToken("testuser", "password");

        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(userDetailsService.loadUserByUsername("testuser"))
                .thenReturn(org.springframework.security.core.userdetails.User.builder()
                        .username("testuser")
                        .password("hashedpassword")
                        .authorities("ROLE_USER")
                        .build());
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(jwtUtil.generateToken(any())).thenReturn("mock.jwt.token");
        when(refreshTokenService.createRefreshToken(any())).thenReturn("mock-refresh-token");

        AuthService.AuthResult result = authService.login(request);

        assertNotNull(result);
        assertEquals("mock.jwt.token", result.jwtResponse().getAccessToken());
        assertEquals("mock-refresh-token", result.rawRefreshToken());
    }
}
