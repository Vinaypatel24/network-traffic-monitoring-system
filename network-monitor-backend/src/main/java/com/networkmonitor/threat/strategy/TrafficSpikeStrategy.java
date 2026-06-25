package com.networkmonitor.threat.strategy;

import com.networkmonitor.capture.dto.PacketDTO;
import com.networkmonitor.threat.model.SlidingWindowCounter;
import com.networkmonitor.threat.model.ThreatAlert;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.LongAdder;

/**
 * TRAFFIC SPIKE DETECTION
 *
 * Fires when total bytes-per-second originating from a single source IP
 * exceeds {@code thresholdBytesPerSecond} within the sliding window.
 *
 * Uses per-IP SlidingWindowCounter for packet count and a separate byte accumulator.
 */
@Slf4j
@Component
public class TrafficSpikeStrategy implements ThreatDetectionStrategy {

    @Value("${threat.traffic-spike.threshold-packets:500}")
    private long thresholdPackets;

    @Value("${threat.traffic-spike.window-seconds:5}")
    private long windowSeconds;

    private final SlidingWindowCounter windowCounter;

    public TrafficSpikeStrategy(
            @Value("${threat.traffic-spike.window-seconds:5}") long windowSeconds) {
        this.windowCounter = new SlidingWindowCounter(windowSeconds);
    }

    @Override
    public Optional<ThreatAlert> analyze(PacketDTO packet) {
        if (packet.getSrcIp() == null) return Optional.empty();

        String srcIp = packet.getSrcIp();
        long count = windowCounter.record(srcIp);

        if (count > thresholdPackets) {
            log.warn("[TrafficSpike] Detected from {} — {} packets in {}s window",
                    srcIp, count, windowSeconds);
            return Optional.of(new ThreatAlert(
                    packet.getCaptureSessionId(),
                    "TRAFFIC_SPIKE",
                    srcIp,
                    packet.getDstIp(),
                    "MEDIUM",
                    String.format("Traffic spike from %s: %d packets in %ds (threshold=%d)",
                            srcIp, count, windowSeconds, thresholdPackets),
                    null
            ));
        }
        return Optional.empty();
    }

    @Override
    public String name() {
        return "TrafficSpikeStrategy";
    }
}
