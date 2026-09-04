package com.networkmonitor.statistics.service;

import com.networkmonitor.capture.dto.PacketDTO;
import com.networkmonitor.statistics.entity.IpStatistics;
import com.networkmonitor.statistics.entity.TrafficStatistics;
import com.networkmonitor.statistics.repository.IpStatisticsRepository;
import com.networkmonitor.statistics.repository.TrafficStatisticsRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.LongAdder;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatisticsAggregatorService {

    private final TrafficStatisticsRepository trafficRepository;
    private final IpStatisticsRepository ipRepository;

    // Keys: "sessionId:protocol" -> LongAdder[packets, bytes]
    private final Map<String, LongAdder[]> trafficCounters = new ConcurrentHashMap<>();
    
    // Keys: "sessionId:ip:direction" -> LongAdder[packets, bytes]
    private final Map<String, LongAdder[]> ipCounters = new ConcurrentHashMap<>();

    // Short-term tick counters for real-time WebSocket dashboard broadcast
    // Keys: "protocol" -> LongAdder[packets, bytes]
    private final Map<String, LongAdder[]> tickCounters = new ConcurrentHashMap<>();

    // Lifetime counters in memory
    private final LongAdder totalPacketsAccumulator = new LongAdder();
    private final LongAdder totalBytesAccumulator = new LongAdder();

    // Keep track of the current minute window
    private Instant currentWindowStart = Instant.now().truncatedTo(ChronoUnit.MINUTES);

    public void aggregateBatch(Long sessionId, List<PacketDTO> packets) {
        if (packets == null || packets.isEmpty()) return;

        for (PacketDTO pkt : packets) {
            int size = pkt.getPacketSize() != null ? pkt.getPacketSize() : 0;
            String proto = pkt.getProtocol() != null ? pkt.getProtocol().toUpperCase() : "OTHER";

            totalPacketsAccumulator.increment();
            totalBytesAccumulator.add(size);

            // Tick counter (for 1-second WebSocket emission)
            LongAdder[] tickAdders = tickCounters.computeIfAbsent(proto, k -> new LongAdder[]{new LongAdder(), new LongAdder()});
            tickAdders[0].increment();
            tickAdders[1].add(size);

            // Traffic stats
            String trafficKey = sessionId + ":" + proto;
            LongAdder[] tAdders = trafficCounters.computeIfAbsent(trafficKey, k -> new LongAdder[]{new LongAdder(), new LongAdder()});
            tAdders[0].increment(); // packets
            tAdders[1].add(size);   // bytes

            // IP Stats - Source
            if (pkt.getSrcIp() != null) {
                String srcKey = sessionId + ":" + pkt.getSrcIp() + ":SOURCE";
                LongAdder[] sAdders = ipCounters.computeIfAbsent(srcKey, k -> new LongAdder[]{new LongAdder(), new LongAdder()});
                sAdders[0].increment();
                sAdders[1].add(size);
            }

            // IP Stats - Destination
            if (pkt.getDstIp() != null) {
                String dstKey = sessionId + ":" + pkt.getDstIp() + ":DESTINATION";
                LongAdder[] dAdders = ipCounters.computeIfAbsent(dstKey, k -> new LongAdder[]{new LongAdder(), new LongAdder()});
                dAdders[0].increment();
                dAdders[1].add(size);
            }
        }
    }

    /**
     * Drains the packets and bytes accumulated since the last broadcast tick.
     */
    public List<TrafficTickDTO> drainTickStats() {
        Map<String, LongAdder[]> snapshot = new java.util.HashMap<>();
        tickCounters.forEach((k, v) -> {
            if (tickCounters.remove(k, v)) {
                snapshot.put(k, v);
            }
        });

        List<TrafficTickDTO> result = new ArrayList<>();
        snapshot.forEach((proto, adders) -> {
            long pkts = adders[0].sum();
            long bytes = adders[1].sum();
            if (pkts > 0) {
                result.add(new TrafficTickDTO(proto, pkts, bytes));
            }
        });

        return result;
    }

    public long getTotalLifetimePackets() {
        return totalPacketsAccumulator.sum();
    }

    public long getTotalLifetimeBytes() {
        return totalBytesAccumulator.sum();
    }

    /**
     * Flushes counters to the database every minute.
     */
    @Scheduled(cron = "0 * * * * *")
    public void flushToDatabase() {
        Instant windowEnd = Instant.now().truncatedTo(ChronoUnit.MINUTES);
        Instant windowStart = currentWindowStart;
        
        if (!windowEnd.isAfter(windowStart)) {
            return; // Not enough time has passed
        }

        // Atomic drain
        Map<String, LongAdder[]> trafficSnapshot = new java.util.HashMap<>();
        trafficCounters.forEach((k, v) -> {
            if (trafficCounters.remove(k, v)) trafficSnapshot.put(k, v);
        });

        Map<String, LongAdder[]> ipSnapshot = new java.util.HashMap<>();
        ipCounters.forEach((k, v) -> {
            if (ipCounters.remove(k, v)) ipSnapshot.put(k, v);
        });

        currentWindowStart = windowEnd;

        // Process Traffic Stats
        List<TrafficStatistics> tStats = new ArrayList<>();
        trafficSnapshot.forEach((key, adders) -> {
            long pkts = adders[0].sum();
            long bytes = adders[1].sum();
            if (pkts > 0) {
                String[] parts = key.split(":", 3);
                tStats.add(TrafficStatistics.builder()
                        .captureSessionId(Long.parseLong(parts[0]))
                        .protocol(parts[1])
                        .packetCount(pkts)
                        .byteCount(bytes)
                        .windowStart(windowStart)
                        .windowEnd(windowEnd)
                        .build());
            }
        });

        if (!tStats.isEmpty()) {
            trafficRepository.saveAll(tStats);
        }

        // Process IP Stats
        List<IpStatistics> iStats = new ArrayList<>();
        ipSnapshot.forEach((key, adders) -> {
            long pkts = adders[0].sum();
            long bytes = adders[1].sum();
            if (pkts > 0) {
                String[] parts = key.split(":", 3);
                iStats.add(IpStatistics.builder()
                        .captureSessionId(Long.parseLong(parts[0]))
                        .ipAddress(parts[1])
                        .direction(parts[2])
                        .packetCount(pkts)
                        .byteCount(bytes)
                        .windowStart(windowStart)
                        .windowEnd(windowEnd)
                        .build());
            }
        });

        if (!iStats.isEmpty()) {
            ipRepository.saveAll(iStats);
        }

        log.info("Flushed {} traffic stats and {} IP stats for window {} - {}", tStats.size(), iStats.size(), windowStart, windowEnd);
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TrafficTickDTO {
        private String protocol;
        private long packetCount;
        private long byteCount;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SummaryOverviewDTO {
        private long totalPackets;
        private long totalBytes;
        private long activeThreats;
        private boolean hasActiveCapture;
        private String activeInterface;
    }
}
