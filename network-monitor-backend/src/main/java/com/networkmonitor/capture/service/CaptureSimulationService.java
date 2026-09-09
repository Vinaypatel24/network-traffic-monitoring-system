package com.networkmonitor.capture.service;

import com.networkmonitor.capture.dto.PacketDTO;
import com.networkmonitor.capture.entity.CaptureSession;
import com.networkmonitor.capture.event.PacketBatchCapturedEvent;
import com.networkmonitor.capture.repository.CaptureSessionRepository;
import com.networkmonitor.capture.repository.PacketBatchRepository;
import com.networkmonitor.statistics.service.StatisticsAggregatorService;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
@RequiredArgsConstructor
public class CaptureSimulationService {

    private final PacketBatchRepository packetBatchRepository;
    private final StatisticsAggregatorService statisticsAggregatorService;
    private final ApplicationEventPublisher eventPublisher;
    private final CaptureSessionRepository captureSessionRepository;

    private final Map<Long, AtomicBoolean> activeSimulations = new ConcurrentHashMap<>();

    private static final List<String> COMMON_EXT_IPS = List.of(
            "8.8.8.8", "1.1.1.1", "142.250.190.46", "151.101.1.140", "13.107.42.16", "20.190.159.2", "198.51.100.77"
    );
    private static final List<String> LOCAL_IPS = List.of(
            "192.168.1.10", "192.168.1.25", "192.168.1.50", "10.0.0.15", "10.0.0.22"
    );
    // Port scan timing constants (ticks, each tick ~300ms)
    private static final int PORT_SCAN_INITIAL_TICK = 10; // approx 3 seconds
    private static final int PORT_SCAN_INTERVAL_TICKS = 30; // approx 9 seconds

    @Async("taskExecutor")
    public void startSimulation(CaptureSession session) {
        Long sessionId = session.getId();
        AtomicBoolean isRunning = new AtomicBoolean(true);
        activeSimulations.put(sessionId, isRunning);
        log.info("Started packet capture simulation for session {}", sessionId);

        int tickCounter = 0;
        while (isRunning.get()) {
            try {
                tickCounter++;
                int batchSize = ThreadLocalRandom.current().nextInt(5, 25);
                List<PacketDTO> batch = new ArrayList<>(batchSize);
                Instant now = Instant.now();

                // 1. Port scan threat simulation (initial tick and interval)
                boolean injectScan = (tickCounter == PORT_SCAN_INITIAL_TICK || tickCounter % PORT_SCAN_INTERVAL_TICKS == 0);
                // 2. Abnormal SYN connection flood simulation (at tick 25 and every 50 ticks)
                boolean injectFlood = (tickCounter == 25 || tickCounter % 50 == 0);

                if (injectScan) {
                    // Port scanning attack: 65 distinct port probes from 198.51.100.77 (threshold 50 in 10s)
                    String attackerIp = "198.51.100.77";
                    String targetIp = "192.168.1.10";
                    for (int p = 1000; p < 1065; p++) {
                        batch.add(PacketDTO.builder()
                                .captureSessionId(sessionId)
                                .srcIp(attackerIp)
                                .dstIp(targetIp)
                                .srcPort(ThreadLocalRandom.current().nextInt(40000, 60000))
                                .dstPort(p)
                                .protocol("TCP")
                                .tcpFlags("SYN")
                                .packetSize(60)
                                .ttl(64)
                                .capturedAt(now)
                                .build());
                    }
                } else if (injectFlood) {
                    // Abnormal request rate: 110 SYN connection attempts to port 443 (threshold 100 in 30s)
                    String floodIp = "203.0.113.88";
                    String targetIp = "192.168.1.10";
                    for (int i = 0; i < 110; i++) {
                        batch.add(PacketDTO.builder()
                                .captureSessionId(sessionId)
                                .srcIp(floodIp)
                                .dstIp(targetIp)
                                .srcPort(ThreadLocalRandom.current().nextInt(30000, 65000))
                                .dstPort(443)
                                .protocol("TCP")
                                .tcpFlags("SYN")
                                .packetSize(64)
                                .ttl(64)
                                .capturedAt(now)
                                .build());
                    }
                } else {
                    for (int i = 0; i < batchSize; i++) {
                        String protocol;
                        int rand = ThreadLocalRandom.current().nextInt(100);
                        int dstPort;
                        int srcPort = ThreadLocalRandom.current().nextInt(30000, 65000);
                        String tcpFlags = null;

                        if (rand < 60) {
                            protocol = "TCP";
                            dstPort = ThreadLocalRandom.current().nextBoolean() ? 443 : 80;
                            tcpFlags = "ACK";
                        } else if (rand < 85) {
                            protocol = "UDP";
                            dstPort = 53;
                        } else {
                            protocol = "ICMP";
                            dstPort = 0;
                        }

                        String srcIp = LOCAL_IPS.get(ThreadLocalRandom.current().nextInt(LOCAL_IPS.size()));
                        String dstIp = COMMON_EXT_IPS.get(ThreadLocalRandom.current().nextInt(COMMON_EXT_IPS.size()));
                        int size = ThreadLocalRandom.current().nextInt(64, 1500);

                        batch.add(PacketDTO.builder()
                                .captureSessionId(sessionId)
                                .srcIp(srcIp)
                                .dstIp(dstIp)
                                .srcPort(srcPort)
                                .dstPort(dstPort)
                                .protocol(protocol)
                                .tcpFlags(tcpFlags)
                                .packetSize(size)
                                .ttl(64)
                                .capturedAt(now)
                                .build());
                    }
                }

                if (!batch.isEmpty()) {
                    packetBatchRepository.batchInsert(batch);
                    statisticsAggregatorService.aggregateBatch(sessionId, batch);
                    eventPublisher.publishEvent(new PacketBatchCapturedEvent(this, new ArrayList<>(batch)));

                    long batchBytes = batch.stream().mapToLong(p -> p.getPacketSize() != null ? p.getPacketSize() : 0).sum();
                    captureSessionRepository.findById(sessionId).ifPresent(s -> {
                        s.setTotalPackets(s.getTotalPackets() + batch.size());
                        s.setTotalBytes(s.getTotalBytes() + batchBytes);
                        captureSessionRepository.save(s);
                    });
                }

                Thread.sleep(300);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("Error in capture simulation loop: {}", e.getMessage());
            }
        }

        log.info("Exited packet capture simulation for session {}", sessionId);
        activeSimulations.remove(sessionId);
    }

    public void stopSimulation(Long sessionId) {
        AtomicBoolean flag = activeSimulations.get(sessionId);
        if (flag != null) {
            flag.set(false);
            log.info("Signaled capture simulation stop for session {}", sessionId);
        }
    }

    @PreDestroy
    public void cleanup() {
        activeSimulations.values().forEach(flag -> flag.set(false));
    }
}
