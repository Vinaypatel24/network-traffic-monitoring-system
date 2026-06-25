package com.networkmonitor.alert.service;

import com.networkmonitor.alert.dto.AlertRuleDTO;
import com.networkmonitor.alert.entity.AlertRule;
import com.networkmonitor.alert.repository.AlertRuleRepository;
import com.networkmonitor.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlertRuleService {

    private final AlertRuleRepository alertRuleRepository;

    @Transactional(readOnly = true)
    public List<AlertRuleDTO> getAllRules() {
        return alertRuleRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AlertRuleDTO createRule(AlertRuleDTO dto) {
        AlertRule rule = AlertRule.builder()
                .ruleType(dto.getRuleType())
                .thresholdValue(dto.getThresholdValue())
                .timeWindowSeconds(dto.getTimeWindowSeconds())
                .severity(dto.getSeverity())
                .enabled(dto.getEnabled() != null ? dto.getEnabled() : true)
                .description(dto.getDescription())
                .build();
        return mapToDTO(alertRuleRepository.save(rule));
    }

    @Transactional
    public AlertRuleDTO updateRule(Long id, AlertRuleDTO dto) {
        AlertRule rule = alertRuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AlertRule not found with id " + id));
        
        if (dto.getThresholdValue() != null) rule.setThresholdValue(dto.getThresholdValue());
        if (dto.getTimeWindowSeconds() != null) rule.setTimeWindowSeconds(dto.getTimeWindowSeconds());
        if (dto.getSeverity() != null) rule.setSeverity(dto.getSeverity());
        if (dto.getEnabled() != null) rule.setEnabled(dto.getEnabled());
        if (dto.getDescription() != null) rule.setDescription(dto.getDescription());
        
        return mapToDTO(alertRuleRepository.save(rule));
    }

    public AlertRule getRuleByType(String ruleType) {
        return alertRuleRepository.findByRuleType(ruleType).orElse(null);
    }

    private AlertRuleDTO mapToDTO(AlertRule rule) {
        AlertRuleDTO dto = new AlertRuleDTO();
        dto.setId(rule.getId());
        dto.setRuleType(rule.getRuleType());
        dto.setThresholdValue(rule.getThresholdValue());
        dto.setTimeWindowSeconds(rule.getTimeWindowSeconds());
        dto.setSeverity(rule.getSeverity());
        dto.setEnabled(rule.getEnabled());
        dto.setDescription(rule.getDescription());
        return dto;
    }
}
