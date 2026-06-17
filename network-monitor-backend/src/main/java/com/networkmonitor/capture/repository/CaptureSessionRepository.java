package com.networkmonitor.capture.repository;

import com.networkmonitor.capture.entity.CaptureSession;
import com.networkmonitor.capture.enums.CaptureStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CaptureSessionRepository extends JpaRepository<CaptureSession, Long> {

    Optional<CaptureSession> findByUserIdAndStatus(Long userId, CaptureStatus status);

    Page<CaptureSession> findByUserId(Long userId, Pageable pageable);
}
