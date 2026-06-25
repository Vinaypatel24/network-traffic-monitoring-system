package com.networkmonitor.alert.controller;

import com.networkmonitor.alert.dto.BlacklistedIpDTO;
import com.networkmonitor.alert.service.BlacklistedIpService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/blacklist")
@RequiredArgsConstructor
public class BlacklistedIpController {

    private final BlacklistedIpService blacklistedIpService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Page<BlacklistedIpDTO>> getAllBlacklistedIps(Pageable pageable) {
        return ResponseEntity.ok(blacklistedIpService.getAllBlacklistedIps(pageable));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BlacklistedIpDTO> addIpToBlacklist(
            @RequestBody BlacklistRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        BlacklistedIpDTO dto = blacklistedIpService.addIpToBlacklist(request.getIpAddress(), request.getReason(), userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BlacklistedIpDTO> updateBlacklistStatus(
            @PathVariable Long id,
            @RequestParam boolean enabled) {
        return ResponseEntity.ok(blacklistedIpService.updateBlacklistStatus(id, enabled));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeIpFromBlacklist(@PathVariable Long id) {
        blacklistedIpService.removeIpFromBlacklist(id);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class BlacklistRequest {
        private String ipAddress;
        private String reason;
    }
}
