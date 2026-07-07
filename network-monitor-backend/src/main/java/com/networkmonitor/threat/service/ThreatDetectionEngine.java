package com.networkmonitor.threat.service;

import com.networkmonitor.alert.entity.Alert;
import com.networkmonitor.alert.entity.AlertRule;
import com.networkmonitor.alert.service.AlertRuleService;
import com.networkmonitor.alert.service.AlertService;
import com.networkmonitor.capture.dto.PacketDTO;
import com.networkmonitor.capture.event.PacketBatchCapturedEvent;
import com.networkmonitor.threat.model.ThreatAlert;
import com.networkmonitor.threat.strategy.ThreatDetectionStrategy;
import com.networkmonitor.alert.enums.AlertSeverity;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ThreatDetectionEngine {

    private final List<ThreatDetectionStrategy> strategies;
    private final AlertService alertService;
    private final AlertRuleService alertRuleService;
    private final EntityManager entityManager;

    @Async("taskExecutor")
    @EventListener
    public void onPacketBatchCaptured(PacketBatchCapturedEvent event) {
        List<PacketDTO> packets = event.getPackets();
        if (packets == null || packets.isEmpty()) {
            return;
        }

        for (PacketDTO packet : packets) {
            for (ThreatDetectionStrategy strategy : strategies) {
                try {
                    Optional<ThreatAlert> threatAlertOpt = strategy.analyze(packet);
                    threatAlertOpt.ifPresent(threatAlert -> {
                        AlertRule rule = alertRuleService.getRuleByType(threatAlert.alertType());
                        if (rule != null && rule.isEnabled()) {
                            // Deduplication/Spam control could be added here
                            Alert alert = Alert.builder()
                                    .rule(rule)
                                    // CaptureSession ID needs to be set, but ThreatAlert has it
                                    // We need to fetch CaptureSession entity, or just store the ID if we mapped it.
                                    // Wait, Alert entity has a relationship to CaptureSession.
                                    // We can map it loosely or fetch it.
                                    .alertType(threatAlert.alertType())
                                    .sourceIp(threatAlert.sourceIp())
                                    .destinationIp(threatAlert.destinationIp())
                                    .severity(AlertSeverity.valueOf(threatAlert.severity()))
                                    .description(threatAlert.description())
                                    .build();
                            
                            // For CaptureSession, we need a proxy reference to avoid full fetch:
                            com.networkmonitor.capture.entity.CaptureSession sessionRef = entityManager.getReference(com.networkmonitor.capture.entity.CaptureSession.class, threatAlert.captureSessionId());
                            alert.setCaptureSession(sessionRef);

                            alertService.createAlert(alert);
                        }
                    });
                } catch (Exception e) {
                    log.error("Error executing threat detection strategy {}: {}", strategy.name(), e.getMessage());
                }
            }
        }
    }
}
