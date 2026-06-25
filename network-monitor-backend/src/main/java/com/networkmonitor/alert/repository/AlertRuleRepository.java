package com.networkmonitor.alert.repository;

import com.networkmonitor.alert.entity.AlertRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AlertRuleRepository extends JpaRepository<AlertRule, Long> {
    Optional<AlertRule> findByRuleType(String ruleType);
}
