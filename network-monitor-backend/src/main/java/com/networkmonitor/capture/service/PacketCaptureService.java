package com.networkmonitor.capture.service;

import com.networkmonitor.capture.entity.CaptureSession;
import com.networkmonitor.capture.dto.PacketDTO;
import com.networkmonitor.capture.parser.ProtocolParserFactory;
import com.networkmonitor.capture.repository.PacketBatchRepository;
import com.networkmonitor.capture.repository.CaptureSessionRepository;
import com.networkmonitor.statistics.service.StatisticsAggregatorService;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.pcap4j.core.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
@RequiredArgsConstructor
public class PacketCaptureService {

    @Value("${capture.queue-capacity:50000}")
    private int queueCapacity;

    @Value("${capture.worker-threads:4}")
    private int workerThreads;

    @Value("${capture.batch-flush-size:2000}")
    private int batchFlushSize;

    @Value("${capture.batch-flush-interval-ms:500}")
    private long batchFlushIntervalMs;

    private final ProtocolParserFactory protocolParserFactory;
    private final PacketBatchRepository packetBatchRepository;
    private final CaptureSessionRepository captureSessionRepository;
    private final StatisticsAggregatorService statisticsAggregatorService;

    private final Map<Long, PcapHandle> activeHandles = new ConcurrentHashMap<>();
    private final Map<Long, AtomicBoolean> activeFlags = new ConcurrentHashMap<>();
    
    // One queue and thread pool per session, or a global one.
    // Given the architecture, a dedicated queue per active session prevents slow sessions from blocking others.
    private final Map<Long, BlockingQueue<org.pcap4j.packet.Packet>> sessionQueues = new ConcurrentHashMap<>();
    private final Map<Long, ExecutorService> sessionExecutors = new ConcurrentHashMap<>();

    @Async("taskExecutor")
    public void startCapture(CaptureSession session, String interfaceName) {
        log.info("Starting packet capture for session {} on interface {}", session.getId(), interfaceName);
        
        PcapHandle handle = null;
        try {
            PcapNetworkInterface nif = Pcaps.getDevByName(interfaceName);
            if (nif == null) {
                throw new PcapNativeException("Interface not found: " + interfaceName);
            }

            int snapLen = 65536;           // Capture all packets, no truncation
            int timeout = 10;              // in millis
            
            handle = nif.openLive(snapLen, PcapNetworkInterface.PromiscuousMode.PROMISCUOUS, timeout);
            
            activeHandles.put(session.getId(), handle);
            AtomicBoolean isRunning = new AtomicBoolean(true);
            activeFlags.put(session.getId(), isRunning);

            // Setup Queue and Workers
            BlockingQueue<org.pcap4j.packet.Packet> queue = new ArrayBlockingQueue<>(queueCapacity);
            sessionQueues.put(session.getId(), queue);

            ExecutorService executor = Executors.newFixedThreadPool(workerThreads);
            sessionExecutors.put(session.getId(), executor);

            for (int i = 0; i < workerThreads; i++) {
                executor.submit(() -> processQueue(session.getId(), queue, isRunning));
            }

            PacketListener listener = packet -> {
                if (!isRunning.get()) return;
                if (!queue.offer(packet)) {
                    // Queue full, packet dropped. In high load, consider metrics here.
                }
            };

            log.info("Capture loop starting for session {}", session.getId());
            // Loop infinitely until interrupted or handle closed
            handle.loop(-1, listener);
            log.info("Capture loop exited for session {}", session.getId());

        } catch (PcapNativeException | NotOpenException | InterruptedException e) {
            log.error("Capture interrupted or failed for session {}: {}", session.getId(), e.getMessage());
        } finally {
            if (handle != null && handle.isOpen()) {
                handle.close();
            }
            activeHandles.remove(session.getId());
            activeFlags.remove(session.getId());
        }
    }

    private void processQueue(Long sessionId, BlockingQueue<org.pcap4j.packet.Packet> queue, AtomicBoolean isRunning) {
        List<PacketDTO> batch = new ArrayList<>(batchFlushSize);
        long lastFlushTime = System.currentTimeMillis();

        while (isRunning.get() || !queue.isEmpty()) {
            try {
                org.pcap4j.packet.Packet packet = queue.poll(100, TimeUnit.MILLISECONDS);
                
                if (packet != null) {
                    PacketDTO dto = protocolParserFactory.parse(sessionId, packet);
                    batch.add(dto);
                }

                boolean shouldFlush = batch.size() >= batchFlushSize || 
                        (!batch.isEmpty() && (System.currentTimeMillis() - lastFlushTime) >= batchFlushIntervalMs);

                if (shouldFlush) {
                    packetBatchRepository.batchInsert(batch);
                    statisticsAggregatorService.aggregateBatch(sessionId, batch);
                    
                    // Update session totals (simplified; ideally done async or less frequently)
                    updateSessionTotals(sessionId, batch);
                    
                    batch.clear();
                    lastFlushTime = System.currentTimeMillis();
                }

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("Error processing packet batch: {}", e.getMessage());
                batch.clear();
            }
        }
        
        // Final flush
        if (!batch.isEmpty()) {
            try {
                packetBatchRepository.batchInsert(batch);
                statisticsAggregatorService.aggregateBatch(sessionId, batch);
                updateSessionTotals(sessionId, batch);
            } catch (Exception e) {
                log.error("Error on final flush: {}", e.getMessage());
            }
        }
    }

    private void updateSessionTotals(Long sessionId, List<PacketDTO> batch) {
        long bytes = batch.stream().mapToLong(p -> p.getPacketSize() != null ? p.getPacketSize() : 0).sum();
        captureSessionRepository.findById(sessionId).ifPresent(s -> {
            s.setTotalPackets(s.getTotalPackets() + batch.size());
            s.setTotalBytes(s.getTotalBytes() + bytes);
            captureSessionRepository.save(s);
        });
    }

    public void stopCapture(Long sessionId) {
        AtomicBoolean flag = activeFlags.get(sessionId);
        if (flag != null) {
            flag.set(false);
        }

        PcapHandle handle = activeHandles.remove(sessionId);
        if (handle != null) {
            try {
                handle.breakLoop();
                handle.close();
                log.info("Successfully stopped capture handle for session {}", sessionId);
            } catch (NotOpenException e) {
                log.warn("Handle already closed for session {}", sessionId);
            }
        }

        // Shutdown workers
        ExecutorService executor = sessionExecutors.remove(sessionId);
        if (executor != null) {
            executor.shutdown();
            try {
                if (!executor.awaitTermination(2, TimeUnit.SECONDS)) {
                    executor.shutdownNow();
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
        sessionQueues.remove(sessionId);
    }
    
    @PreDestroy
    public void cleanup() {
        activeFlags.values().forEach(flag -> flag.set(false));
        activeHandles.forEach((id, handle) -> {
            try { handle.breakLoop(); handle.close(); } catch (Exception ignored) {}
        });
        sessionExecutors.values().forEach(ExecutorService::shutdownNow);
    }
}
