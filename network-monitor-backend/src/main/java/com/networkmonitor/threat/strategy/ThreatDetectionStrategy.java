package com.networkmonitor.threat.strategy;

import com.networkmonitor.capture.dto.PacketDTO;
import com.networkmonitor.threat.model.ThreatAlert;

import java.util.Optional;

/**
 * Strategy interface for threat detection algorithms.
 * Each implementation analyzes a single PacketDTO and returns an alert if a threat is detected.
 */
public interface ThreatDetectionStrategy {

    /**
     * Analyzes the given packet and returns an alert if the strategy
     * fires, or {@link Optional#empty()} otherwise.
     *
     * @param packet the parsed packet to inspect
     * @return an Optional ThreatAlert
     */
    Optional<ThreatAlert> analyze(PacketDTO packet);

    /** Human-readable strategy name, used in logging. */
    String name();
}
