package com.networkmonitor.threat.strategy;

import com.networkmonitor.capture.dto.PacketDTO;
import com.networkmonitor.threat.model.SlidingWindowCounter;
import com.networkmonitor.threat.model.ThreatAlert;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * ABNORMAL REQUEST RATE DETECTION
 *
 * Fires when a single source IP is sending requests (TCP SYN or new connections)
 * at an abnormally high rate — specifically targeting connection attempts
 * to well-known service ports (HTTP/HTTPS/SSH/FTP).
 *
 * Detects potential brute-force or DDoS connection flood.
 */
@Slf4j
@Component
public class AbnormalRateStrategy implements ThreatDetectionStrategy {

    @Value("${threat.abnormal-rate.threshold:100}")
    private long threshold;

    @Value("${threat.abnormal-rate.window-seconds:30}")
    private long windowSeconds;

    private final SlidingWindowCounter windowCounter;

    // Monitored service ports (connection-oriented)
    private static final java.util.Set<Integer> SERVICE_PORTS =
            java.util.Set.of(21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 6379, 8080, 8443);

    public AbnormalRateStrategy(
            @Value("${threat.abnormal-rate.window-seconds:30}") long windowSeconds) {
        this.windowCounter = new SlidingWindowCounter(windowSeconds);
    }

    @Override
    public Optional<ThreatAlert> analyze(PacketDTO packet) {
        if (packet.getSrcIp() == null || packet.getDstPort() == null) return Optional.empty();

        // Only track packets to well-known service ports
        if (!SERVICE_PORTS.contains(packet.getDstPort())) return Optional.empty();

        // Only track TCP packets with SYN flag (connection attempts)
        boolean isSyn = "TCP".equals(packet.getProtocol())
                && packet.getTcpFlags() != null
                && packet.getTcpFlags().contains("SYN")
                && !packet.getTcpFlags().contains("ACK");

        if (!isSyn) return Optional.empty();

        String key = packet.getSrcIp() + ":" + packet.getDstPort();
        long count = windowCounter.record(key);

        if (count > threshold) {
            log.warn("[AbnormalRate] Detected from {} → port {} — {} attempts in {}s",
                    packet.getSrcIp(), packet.getDstPort(), count, windowSeconds);
            return Optional.of(new ThreatAlert(
                    packet.getCaptureSessionId(),
                    "ABNORMAL_REQUEST_RATE",
                    packet.getSrcIp(),
                    packet.getDstIp(),
                    "HIGH",
                    String.format("Abnormal connection rate from %s to port %d: %d attempts in %ds",
                            packet.getSrcIp(), packet.getDstPort(), count, windowSeconds),
                    null
            ));
        }
        return Optional.empty();
    }

    @Override
    public String name() {
        return "AbnormalRateStrategy";
    }
}
