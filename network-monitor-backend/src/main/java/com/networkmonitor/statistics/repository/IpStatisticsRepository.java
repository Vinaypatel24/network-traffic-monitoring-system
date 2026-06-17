package com.networkmonitor.statistics.repository;

import com.networkmonitor.statistics.entity.IpStatistics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IpStatisticsRepository extends JpaRepository<IpStatistics, Long> {

    @Query("SELECT i FROM IpStatistics i WHERE i.captureSessionId = :sessionId ORDER BY i.windowStart ASC")
    List<IpStatistics> findByCaptureSessionIdOrderByWindowStartAsc(Long sessionId);
}
