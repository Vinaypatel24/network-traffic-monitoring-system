package com.networkmonitor.capture.service;

import com.networkmonitor.capture.entity.CaptureSession;
import com.networkmonitor.capture.entity.NetworkInterface;
import com.networkmonitor.capture.enums.CaptureStatus;
import com.networkmonitor.capture.repository.CaptureSessionRepository;
import com.networkmonitor.common.exception.CaptureException;
import com.networkmonitor.common.exception.DuplicateActiveSessionException;
import com.networkmonitor.common.exception.ResourceNotFoundException;
import com.networkmonitor.user.entity.User;
import com.networkmonitor.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CaptureSessionManager {

    private final CaptureSessionRepository captureSessionRepository;
    private final UserRepository userRepository;
    private final NetworkInterfaceService networkInterfaceService;
    private final PacketCaptureService packetCaptureService; // To actually start/stop pcap handle

    @Transactional
    public CaptureSession startSession(String username, Long interfaceId) {
        User user = userRepository.findByUsername(username).orElseThrow();
        
        Optional<CaptureSession> activeSession = captureSessionRepository.findByUserIdAndStatus(user.getId(), CaptureStatus.RUNNING);
        if (activeSession.isPresent()) {
            throw new DuplicateActiveSessionException(user.getId());
        }

        NetworkInterface nic = networkInterfaceService.getInterfaceById(interfaceId);

        CaptureSession session = CaptureSession.builder()
                .user(user)
                .networkInterface(nic)
                .interfaceName(nic.getName())
                .status(CaptureStatus.RUNNING)
                .build();

        try {
            session = captureSessionRepository.save(session);
        } catch (DataIntegrityViolationException e) {
            // Caught if partial unique index hits concurrently
            throw new DuplicateActiveSessionException(user.getId());
        }

        try {
            packetCaptureService.startCapture(session, nic.getName());
        } catch (Exception e) {
            session.setStatus(CaptureStatus.ERROR);
            session.setEndTime(Instant.now());
            captureSessionRepository.save(session);
            throw new CaptureException("Failed to start packet capture: " + e.getMessage(), e);
        }

        return session;
    }

    @Transactional
    public CaptureSession stopSession(String username, Long sessionId) {
        User user = userRepository.findByUsername(username).orElseThrow();
        
        CaptureSession session = captureSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("CaptureSession", sessionId));

        // Check ownership unless Admin
        if (!session.getUser().getId().equals(user.getId()) && user.getRoles().stream().noneMatch(r -> r.getName().equals("ROLE_ADMIN"))) {
            throw new ResourceNotFoundException("CaptureSession", sessionId); // Don't expose that it exists
        }

        if (session.getStatus() != CaptureStatus.RUNNING) {
            return session;
        }

        packetCaptureService.stopCapture(session.getId());

        session.setStatus(CaptureStatus.STOPPED);
        session.setEndTime(Instant.now());
        
        // Assume packetCaptureService updates total bytes/packets periodically, 
        // but we might want a final flush here.
        
        return captureSessionRepository.save(session);
    }

    public Page<CaptureSession> getUserSessions(String username, Pageable pageable) {
        User user = userRepository.findByUsername(username).orElseThrow();
        return captureSessionRepository.findByUserId(user.getId(), pageable);
    }
    
    public Page<CaptureSession> getAllSessions(Pageable pageable) {
        return captureSessionRepository.findAll(pageable);
    }

    public Optional<CaptureSession> getActiveSession(String username) {
        User user = userRepository.findByUsername(username).orElseThrow();
        return captureSessionRepository.findByUserIdAndStatus(user.getId(), CaptureStatus.RUNNING);
    }

    public CaptureSession getSession(Long id) {
        return captureSessionRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("CaptureSession", id));
    }
}
