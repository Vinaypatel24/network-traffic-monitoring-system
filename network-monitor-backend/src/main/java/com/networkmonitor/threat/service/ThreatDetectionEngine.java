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
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class ThreatDetectionEngine {

    private final List<ThreatDetectionStrategy> strategies;
    private final AlertService alertService;
    private final AlertRuleService alertRuleService;
    private final EntityManager entityManager;

    // Cooldown map: key -> last timestamp in millis (suppresses duplicate alerts within 5s)
    private final Map<String, Long> alertCooldowns = new ConcurrentHashMap<>();

    @Async("taskExecutor")
    @Transactional
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
                        // If rule exists in database and is explicitly disabled, skip
                        if (rule != null && Boolean.FALSE.equals(rule.getEnabled())) {
                            return;
                        }

                        // Deduplication: suppress multiple alerts for the same source IP & threat type within 5 seconds
                        String dedupeKey = threatAlert.alertType() + ":" + (threatAlert.sourceIp() != null ? threatAlert.sourceIp() : "any");
                        long now = System.currentTimeMillis();
                        Long lastAlertTime = alertCooldowns.get(dedupeKey);
                        if (lastAlertTime != null && (now - lastAlertTime) < 5000) {
                            return;
                        }
                        alertCooldowns.put(dedupeKey, now);

                        Alert alert = Alert.builder()
                                .rule(rule)
                                .alertType(threatAlert.alertType())
                                .sourceIp(threatAlert.sourceIp())
                                .destinationIp(threatAlert.destinationIp())
                                .severity(AlertSeverity.valueOf(threatAlert.severity()))
                                .description(threatAlert.description())
                                .build();
                        
                        if (threatAlert.captureSessionId() != null) {
                            com.networkmonitor.capture.entity.CaptureSession sessionRef =
                                    entityManager.getReference(com.networkmonitor.capture.entity.CaptureSession.class, threatAlert.captureSessionId());
                            alert.setCaptureSession(sessionRef);
                        }

                        alertService.createAlert(alert);
                    });
                } catch (Exception e) {
                    log.error("Error executing threat detection strategy {}: {}", strategy.name(), e.getMessage());
                }
            }
        }
    }
}
