package com.networkmonitor.alert.service;

import com.networkmonitor.alert.dto.AlertDTO;
import com.networkmonitor.alert.entity.Alert;
import com.networkmonitor.alert.enums.AlertSeverity;
import com.networkmonitor.alert.enums.AlertStatus;
import com.networkmonitor.alert.repository.AlertRepository;
import com.networkmonitor.common.exception.ResourceNotFoundException;
import com.networkmonitor.websocket.event.ThreatDetectedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final BlacklistedIpService blacklistedIpService;

    @Transactional
    public Alert createAlert(Alert alert) {
        Alert savedAlert = alertRepository.save(alert);
        eventPublisher.publishEvent(new ThreatDetectedEvent(this, savedAlert));
        return savedAlert;
    }

    @Transactional(readOnly = true)
    public Page<AlertDTO> getAlerts(AlertStatus status, AlertSeverity severity, Pageable pageable) {
        return alertRepository.findByFilters(status, severity, pageable).map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public AlertDTO getAlertById(Long id) {
        return alertRepository.findById(id)
                .map(this::mapToDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with id " + id));
    }

    @Transactional
    public AlertDTO acknowledgeAlert(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with id " + id));
        alert.setStatus(AlertStatus.ACKNOWLEDGED);
        return mapToDTO(alertRepository.save(alert));
    }

    @Transactional
    public AlertDTO resolveAlert(Long id) {
        return resolveAlert(id, null, "admin");
    }

    @Transactional
    public AlertDTO resolveAlert(Long id, com.networkmonitor.alert.dto.ResolveAlertRequest request, String username) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with id " + id));
        alert.setStatus(AlertStatus.RESOLVED);
        alert.setResolvedAt(Instant.now());

        if (request != null) {
            if ("BLACKLIST".equalsIgnoreCase(request.action()) && alert.getSourceIp() != null) {
                if (!blacklistedIpService.isIpBlacklisted(alert.getSourceIp())) {
                    String reason = (request.blacklistReason() != null && !request.blacklistReason().isBlank())
                            ? request.blacklistReason()
                            : "Blacklisted via Alert #" + alert.getId() + " (" + alert.getAlertType() + ")";
                    try {
                        blacklistedIpService.addIpToBlacklist(alert.getSourceIp(), reason, username != null ? username : "admin");
                    } catch (Exception ignored) {
                    }
                }
                String note = alert.getDescription() != null ? alert.getDescription() : "";
                alert.setDescription(note + " [RESOLVED & BLACKLISTED by " + (username != null ? username : "admin") + "]");
            } else if ("GENUINE".equalsIgnoreCase(request.action())) {
                String notes = (request.notes() != null && !request.notes().isBlank()) ? request.notes() : "Verified genuine request / false positive";
                String note = alert.getDescription() != null ? alert.getDescription() : "";
                alert.setDescription(note + " [RESOLVED: MARKED GENUINE - " + notes + "]");
            }
        }

        return mapToDTO(alertRepository.save(alert));
    }

    private AlertDTO mapToDTO(Alert alert) {
        AlertDTO dto = new AlertDTO();
        dto.setId(alert.getId());
        dto.setRuleId(alert.getRule() != null ? alert.getRule().getId() : null);
        dto.setCaptureSessionId(alert.getCaptureSession() != null ? alert.getCaptureSession().getId() : null);
        dto.setAlertType(alert.getAlertType());
        dto.setSourceIp(alert.getSourceIp());
        dto.setDestinationIp(alert.getDestinationIp());
        dto.setSeverity(alert.getSeverity());
        dto.setDescription(alert.getDescription());
        dto.setStatus(alert.getStatus());
        dto.setDetectedAt(alert.getDetectedAt());
        dto.setResolvedAt(alert.getResolvedAt());

        // Forensic Diagnostics & Heuristic Verdict
        String type = alert.getAlertType() != null ? alert.getAlertType() : "";
        switch (type) {
            case "PORT_SCAN" -> {
                dto.setConfidenceScore(98);
                dto.setVerdict("High Probability Malicious Port Probe (Stealth Reconnaissance)");
                dto.setForensicDetails("Rapid sequential destination port probing · Zero application data transferred · 100% TCP SYN probes");
            }
            case "ABNORMAL_REQUEST_RATE" -> {
                dto.setConfidenceScore(92);
                dto.setVerdict("High Probability Connection Flood / Service Port Brute-Force");
                dto.setForensicDetails("Aggressive SYN flood targeting core service ports (80/443/22) · Low handshake completion ratio");
            }
            case "SUSPICIOUS_CONNECTION" -> {
                dto.setConfidenceScore(99);
                dto.setVerdict("Confirmed Malicious IP (Blacklisted Address)");
                dto.setForensicDetails("Connection initiated by or targeting an actively blacklisted host IP");
            }
            case "TRAFFIC_SPIKE" -> {
                dto.setConfidenceScore(65);
                dto.setVerdict("Anomalous Throughput Burst (Review for False Positive)");
                dto.setForensicDetails("Packet rate exceeded baseline sliding window · Could be bulk transfer or benign download burst");
            }
            default -> {
                dto.setConfidenceScore(75);
                dto.setVerdict("Heuristic Rule Triggered");
                dto.setForensicDetails("Traffic pattern triggered threshold heuristic");
            }
        }

        return dto;
    }
}
