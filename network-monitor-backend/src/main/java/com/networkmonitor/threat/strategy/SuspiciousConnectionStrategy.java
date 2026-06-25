package com.networkmonitor.threat.strategy;

import com.networkmonitor.alert.service.BlacklistedIpService;
import com.networkmonitor.capture.dto.PacketDTO;
import com.networkmonitor.threat.model.ThreatAlert;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Optional;

/**
 * SUSPICIOUS CONNECTION DETECTION
 *
 * Fires when a packet's source or destination IP exists in the active blacklisted_ips list.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SuspiciousConnectionStrategy implements ThreatDetectionStrategy {

    private final BlacklistedIpService blacklistedIpService;

    @Override
    public Optional<ThreatAlert> analyze(PacketDTO packet) {
        if (packet.getSrcIp() == null && packet.getDstIp() == null) {
            return Optional.empty();
        }

        boolean srcBlacklisted = packet.getSrcIp() != null && blacklistedIpService.isIpBlacklisted(packet.getSrcIp());
        boolean dstBlacklisted = packet.getDstIp() != null && blacklistedIpService.isIpBlacklisted(packet.getDstIp());

        if (srcBlacklisted || dstBlacklisted) {
            log.warn("[SuspiciousConnection] Connection involving blacklisted IP detected. Src: {}, Dst: {}",
                    packet.getSrcIp(), packet.getDstIp());
            
            return Optional.of(new ThreatAlert(
                    packet.getCaptureSessionId(),
                    "SUSPICIOUS_CONNECTION",
                    packet.getSrcIp(),
                    packet.getDstIp(),
                    "CRITICAL",
                    String.format("Connection involving blacklisted IP detected. Src: %s, Dst: %s",
                            packet.getSrcIp(), packet.getDstIp()),
                    Instant.now()
            ));
        }

        return Optional.empty();
    }

    @Override
    public String name() {
        return "SuspiciousConnectionStrategy";
    }
}
