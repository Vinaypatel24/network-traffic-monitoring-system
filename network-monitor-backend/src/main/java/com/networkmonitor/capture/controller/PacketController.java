package com.networkmonitor.capture.controller;

import com.networkmonitor.capture.entity.CaptureSession;
import com.networkmonitor.capture.entity.Packet;
import com.networkmonitor.capture.repository.CaptureSessionRepository;
import com.networkmonitor.capture.repository.PacketRepository;
import com.networkmonitor.common.exception.ResourceNotFoundException;
import com.networkmonitor.common.response.PageResponse;
import com.networkmonitor.user.entity.User;
import com.networkmonitor.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/packets")
@RequiredArgsConstructor
public class PacketController {

    private final PacketRepository packetRepository;
    private final CaptureSessionRepository captureSessionRepository;
    private final UserRepository userRepository;

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<PageResponse<Packet>> getPacketsBySession(
            Authentication authentication,
            @PathVariable Long sessionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        User user = userRepository.findByUsername(authentication.getName()).orElseThrow();
        CaptureSession session = captureSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("CaptureSession", sessionId));

        // Check ownership unless admin
        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        if (!isAdmin && !session.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("CaptureSession", sessionId); // Hide existence
        }

        Page<Packet> packetPage = packetRepository.findByCaptureSessionId(
                sessionId,
                PageRequest.of(page, size, Sort.by("capturedAt").descending())
        );

        return ResponseEntity.ok(new PageResponse<>(
                packetPage.getContent(),
                packetPage.getNumber(),
                packetPage.getSize(),
                packetPage.getTotalElements()
        ));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<Packet>> getAllPackets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        // Admin-only global query
        Page<Packet> packetPage = packetRepository.findAll(
                PageRequest.of(page, size, Sort.by("capturedAt").descending())
        );

        return ResponseEntity.ok(new PageResponse<>(
                packetPage.getContent(),
                packetPage.getNumber(),
                packetPage.getSize(),
                packetPage.getTotalElements()
        ));
    }
}
