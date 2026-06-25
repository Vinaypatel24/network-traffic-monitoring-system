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
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with id " + id));
        alert.setStatus(AlertStatus.RESOLVED);
        alert.setResolvedAt(Instant.now());
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
        return dto;
    }
}
