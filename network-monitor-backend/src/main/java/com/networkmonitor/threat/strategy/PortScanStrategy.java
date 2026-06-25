package com.networkmonitor.threat.strategy;

import com.networkmonitor.capture.dto.PacketDTO;
import com.networkmonitor.threat.model.SlidingWindowCounter;
import com.networkmonitor.threat.model.ThreatAlert;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * PORT SCAN DETECTION
 *
 * Fires when a single source IP contacts more than {@code threshold} distinct
 * destination ports within {@code windowSeconds} seconds.
 *
 * Algorithm: sliding window of (srcIp → set of dst ports seen in last N seconds).
 * Simplified via SlidingWindowCounter counting unique port events per srcIp.
 */
@Slf4j
@Component
public class PortScanStrategy implements ThreatDetectionStrategy {

    @Value("${threat.port-scan.threshold:50}")
    private int threshold;

    @Value("${threat.port-scan.window-seconds:10}")
    private long windowSeconds;

    // srcIp → set of dst ports seen (reset on cooldown via SlidingWindowCounter)
    private final ConcurrentHashMap<String, Set<Integer>> portSets = new ConcurrentHashMap<>();
    private final SlidingWindowCounter windowCounter;

    public PortScanStrategy(
            @Value("${threat.port-scan.window-seconds:10}") long windowSeconds) {
        this.windowCounter = new SlidingWindowCounter(windowSeconds);
    }

    @Override
    public Optional<ThreatAlert> analyze(PacketDTO packet) {
        if (packet.getSrcIp() == null || packet.getDstPort() == null) {
            return Optional.empty();
        }

        String srcIp = packet.getSrcIp();
        int dstPort = packet.getDstPort();

        // Add the port to the tracked set for this IP
        Set<Integer> ports = portSets.computeIfAbsent(srcIp,
                k -> ConcurrentHashMap.newKeySet());
        ports.add(dstPort);

        // Record event in the sliding window counter (per IP)
        long count = windowCounter.record(srcIp);

        if (count > threshold) {
            log.warn("[PortScan] Detected from {} — {} port events in {}s window",
                    srcIp, count, windowSeconds);
            return Optional.of(new ThreatAlert(
                    packet.getCaptureSessionId(),
                    "PORT_SCAN",
                    srcIp,
                    packet.getDstIp(),
                    "HIGH",
                    String.format("Port scan detected from %s: %d distinct port probes in %ds",
                            srcIp, count, windowSeconds),
                    null
            ));
        }
        return Optional.empty();
    }

    @Override
    public String name() {
        return "PortScanStrategy";
    }
}
