package com.networkmonitor.websocket.service;

import com.networkmonitor.alert.dto.AlertDTO;
import com.networkmonitor.alert.entity.Alert;
import com.networkmonitor.statistics.service.StatisticsAggregatorService;
import com.networkmonitor.statistics.service.StatisticsAggregatorService.TrafficTickDTO;
import com.networkmonitor.websocket.event.ThreatDetectedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardBroadcastService {

    private final SimpMessagingTemplate messagingTemplate;
    private final StatisticsAggregatorService statisticsAggregatorService;

    @Async("taskExecutor")
    @EventListener
    public void onThreatDetected(ThreatDetectedEvent event) {
        Alert alert = event.getAlert();
        log.info("Broadcasting new threat alert to dashboard: {}", alert.getAlertType());
        
        AlertDTO dto = mapToDTO(alert);
        messagingTemplate.convertAndSend("/topic/alerts", dto);
    }

    /**
     * Broadcasts live traffic statistics to connected dashboard clients every second.
     * Keeps the frontend chart and rate counters actively animated.
     */
    @Scheduled(fixedRateString = "${capture.broadcast-interval-ms:1000}")
    public void broadcastLiveStats() {
        List<TrafficTickDTO> stats = statisticsAggregatorService.drainTickStats();
        if (stats == null || stats.isEmpty()) {
            // Send a zero tick so dashboard line chart scrolls and rate resets to 0/s
            stats = List.of(new TrafficTickDTO("IDLE", 0L, 0L));
        }

        try {
            messagingTemplate.convertAndSend("/topic/stats", stats);
        } catch (Exception e) {
            log.trace("Error broadcasting traffic stats: {}", e.getMessage());
        }
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
