package com.networkmonitor.statistics.controller;

import com.networkmonitor.capture.entity.CaptureSession;
import com.networkmonitor.capture.repository.CaptureSessionRepository;
import com.networkmonitor.common.exception.ResourceNotFoundException;
import com.networkmonitor.common.response.ApiResponse;
import com.networkmonitor.statistics.entity.IpStatistics;
import com.networkmonitor.statistics.entity.TrafficStatistics;
import com.networkmonitor.statistics.repository.IpStatisticsRepository;
import com.networkmonitor.statistics.repository.TrafficStatisticsRepository;
import com.networkmonitor.user.entity.User;
import com.networkmonitor.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final TrafficStatisticsRepository trafficRepository;
    private final IpStatisticsRepository ipRepository;
    private final CaptureSessionRepository captureSessionRepository;
    private final UserRepository userRepository;

    @GetMapping("/traffic/{sessionId}")
    public ResponseEntity<ApiResponse<List<TrafficStatistics>>> getTrafficStats(
            Authentication authentication,
            @PathVariable Long sessionId) {
        
        checkAccess(authentication.getName(), sessionId);
        List<TrafficStatistics> stats = trafficRepository.findByCaptureSessionIdOrderByWindowStartAsc(sessionId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/ip/{sessionId}")
    public ResponseEntity<ApiResponse<List<IpStatistics>>> getIpStats(
            Authentication authentication,
            @PathVariable Long sessionId) {
        
        checkAccess(authentication.getName(), sessionId);
        List<IpStatistics> stats = ipRepository.findByCaptureSessionIdOrderByWindowStartAsc(sessionId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    private void checkAccess(String username, Long sessionId) {
        User user = userRepository.findByUsername(username).orElseThrow();
        CaptureSession session = captureSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("CaptureSession", sessionId));

        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        if (!isAdmin && !session.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("CaptureSession", sessionId);
        }
    }
}
