package com.networkmonitor.threat.model;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe sliding window counter.
 * Tracks per-key event timestamps within a configurable rolling window (in seconds).
 */
public class SlidingWindowCounter {

    private final long windowSeconds;
    /** key → deque of event timestamps (epoch millis) */
    private final ConcurrentHashMap<String, Deque<Long>> events = new ConcurrentHashMap<>();

    public SlidingWindowCounter(long windowSeconds) {
        this.windowSeconds = windowSeconds;
    }

    /**
     * Records a new event for the given key and returns the current count
     * within the sliding window.
     */
    public synchronized long record(String key) {
        long now = System.currentTimeMillis();
        long cutoff = now - (windowSeconds * 1000L);

        Deque<Long> timestamps = events.computeIfAbsent(key, k -> new ArrayDeque<>());

        // Evict events older than the window
        while (!timestamps.isEmpty() && timestamps.peekFirst() < cutoff) {
            timestamps.pollFirst();
        }

        timestamps.addLast(now);
        return timestamps.size();
    }

    /**
     * Returns the current event count for the given key without recording a new event.
     */
    public synchronized long getCount(String key) {
        long now = System.currentTimeMillis();
        long cutoff = now - (windowSeconds * 1000L);
        Deque<Long> timestamps = events.get(key);
        if (timestamps == null) return 0;
        // Evict stale entries
        while (!timestamps.isEmpty() && timestamps.peekFirst() < cutoff) {
            timestamps.pollFirst();
        }
        return timestamps.size();
    }

    /** Clears all tracking data (useful on session stop). */
    public void clear() {
        events.clear();
    }
}
