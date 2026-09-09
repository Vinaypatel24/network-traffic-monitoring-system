package com.networkmonitor.alert.controller;

import com.networkmonitor.alert.dto.AlertDTO;
import com.networkmonitor.alert.enums.AlertSeverity;
import com.networkmonitor.alert.enums.AlertStatus;
import com.networkmonitor.alert.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.networkmonitor.alert.dto.ResolveAlertRequest;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping({"/api/alerts", "/api/v1/alerts"})
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Page<AlertDTO>> getAlerts(
            @RequestParam(required = false) AlertStatus status,
            @RequestParam(required = false) AlertSeverity severity,
            Pageable pageable) {
        return ResponseEntity.ok(alertService.getAlerts(status, severity, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<AlertDTO> getAlertById(@PathVariable Long id) {
        return ResponseEntity.ok(alertService.getAlertById(id));
    }

    @PostMapping("/{id}/acknowledge")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<AlertDTO> acknowledgeAlert(@PathVariable Long id) {
        return ResponseEntity.ok(alertService.acknowledgeAlert(id));
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<AlertDTO> resolveAlert(
            @PathVariable Long id,
            @RequestBody(required = false) ResolveAlertRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(alertService.resolveAlert(id, request, username));
    }
}
