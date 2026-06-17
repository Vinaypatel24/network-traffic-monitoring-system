package com.networkmonitor.capture.controller;

import com.networkmonitor.capture.entity.CaptureSession;
import com.networkmonitor.capture.entity.NetworkInterface;
import com.networkmonitor.capture.service.CaptureSessionManager;
import com.networkmonitor.capture.service.NetworkInterfaceService;
import com.networkmonitor.common.response.ApiResponse;
import com.networkmonitor.common.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CaptureController {

    private final NetworkInterfaceService networkInterfaceService;
    private final CaptureSessionManager captureSessionManager;

    // ─── Interfaces ─────────────────────────────────────────────────────────

    @GetMapping("/interfaces")
    public ResponseEntity<ApiResponse<List<NetworkInterface>>> getInterfaces() {
        return ResponseEntity.ok(ApiResponse.success(networkInterfaceService.getAllInterfaces()));
    }

    // ─── Sessions ───────────────────────────────────────────────────────────

    @PostMapping("/capture/start")
    public ResponseEntity<ApiResponse<CaptureSession>> startCapture(
            Authentication authentication,
            @RequestBody StartCaptureRequest request) {
        
        CaptureSession session = captureSessionManager.startSession(authentication.getName(), request.interfaceId());
        return ResponseEntity.ok(ApiResponse.success("Capture started", session));
    }

    @PostMapping("/capture/stop/{id}")
    public ResponseEntity<ApiResponse<CaptureSession>> stopCapture(
            Authentication authentication,
            @PathVariable Long id) {
        
        CaptureSession session = captureSessionManager.stopSession(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Capture stopped", session));
    }

    @GetMapping("/capture/status")
    public ResponseEntity<ApiResponse<CaptureSession>> getActiveSession(Authentication authentication) {
        Optional<CaptureSession> session = captureSessionManager.getActiveSession(authentication.getName());
        return session.map(s -> ResponseEntity.ok(ApiResponse.success(s)))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success("No active session", null)));
    }

    @GetMapping("/capture/sessions")
    public ResponseEntity<PageResponse<CaptureSession>> getSessions(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long userId) {
        
        Page<CaptureSession> sessionPage;
        
        // Admin cross-user view
        if (userId != null && authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            sessionPage = captureSessionManager.getAllSessions(PageRequest.of(page, size, Sort.by("startTime").descending()));
        } else {
            // User view (own sessions)
            sessionPage = captureSessionManager.getUserSessions(authentication.getName(), 
                    PageRequest.of(page, size, Sort.by("startTime").descending()));
        }

        return ResponseEntity.ok(new PageResponse<>(
                sessionPage.getContent(),
                sessionPage.getNumber(),
                sessionPage.getSize(),
                sessionPage.getTotalElements()
        ));
    }

    @GetMapping("/capture/sessions/{id}")
    public ResponseEntity<ApiResponse<CaptureSession>> getSession(
            Authentication authentication,
            @PathVariable Long id) {
        
        // Ownership checked inside manager
        CaptureSession session = captureSessionManager.getSession(id);
        return ResponseEntity.ok(ApiResponse.success(session));
    }
    
    // ─── Admin ──────────────────────────────────────────────────────────────

    @GetMapping("/admin/sessions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<CaptureSession>> getAllSessions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Page<CaptureSession> sessionPage = captureSessionManager.getAllSessions(
                PageRequest.of(page, size, Sort.by("startTime").descending()));

        return ResponseEntity.ok(new PageResponse<>(
                sessionPage.getContent(),
                sessionPage.getNumber(),
                sessionPage.getSize(),
                sessionPage.getTotalElements()
        ));
    }

    // DTO for request body
    public record StartCaptureRequest(Long interfaceId) {}
}
