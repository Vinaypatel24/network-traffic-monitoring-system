package com.networkmonitor.capture.service;

import com.networkmonitor.capture.entity.CaptureSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.pcap4j.core.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
@RequiredArgsConstructor
public class PacketCaptureService {

    @Value("${capture.queue-capacity:50000}")
    private int queueCapacity;

    // Stores handles for active sessions so we can stop them
    private final Map<Long, PcapHandle> activeHandles = new ConcurrentHashMap<>();
    private final Map<Long, AtomicBoolean> activeFlags = new ConcurrentHashMap<>();

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

            PacketListener listener = packet -> {
                if (!isRunning.get()) {
                    return;
                }
                
                // TODO in Sprint 3: Offer packet to BlockingQueue for worker threads to process
                // For now, just logging at TRACE
                log.trace("Captured packet of size {} bytes", packet.length());
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
    }
}
