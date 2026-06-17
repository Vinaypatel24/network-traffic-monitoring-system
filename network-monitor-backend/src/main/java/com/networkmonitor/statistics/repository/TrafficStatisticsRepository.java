package com.networkmonitor.statistics.repository;

import com.networkmonitor.statistics.entity.TrafficStatistics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrafficStatisticsRepository extends JpaRepository<TrafficStatistics, Long> {

    @Query("SELECT t FROM TrafficStatistics t WHERE t.captureSessionId = :sessionId ORDER BY t.windowStart ASC")
    List<TrafficStatistics> findByCaptureSessionIdOrderByWindowStartAsc(Long sessionId);
}
