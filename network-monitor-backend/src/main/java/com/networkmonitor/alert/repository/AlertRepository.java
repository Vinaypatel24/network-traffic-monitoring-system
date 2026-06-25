package com.networkmonitor.alert.repository;

import com.networkmonitor.alert.entity.Alert;
import com.networkmonitor.alert.enums.AlertStatus;
import com.networkmonitor.alert.enums.AlertSeverity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    
    @Query("SELECT a FROM Alert a WHERE (:status IS NULL OR a.status = :status) " +
           "AND (:severity IS NULL OR a.severity = :severity)")
    Page<Alert> findByFilters(
            @Param("status") AlertStatus status,
            @Param("severity") AlertSeverity severity,
            Pageable pageable);
}
