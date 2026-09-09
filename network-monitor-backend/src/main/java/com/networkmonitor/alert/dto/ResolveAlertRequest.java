package com.networkmonitor.alert.dto;

/**
 * Request payload for resolving security alerts.
 * Supports dual resolution paths:
 * - action = "BLACKLIST" (confirms threat, bans IP in blacklist)
 * - action = "GENUINE" (dismisses threat as legitimate traffic / false positive)
 */
public record ResolveAlertRequest(
        String action,              // "BLACKLIST" or "GENUINE"
        String blacklistReason,     // Reason for blacklisting
        String notes                // Resolution or justification notes
) {}
