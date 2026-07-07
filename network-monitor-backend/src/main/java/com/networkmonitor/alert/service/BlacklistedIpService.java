package com.networkmonitor.alert.service;

import com.networkmonitor.alert.dto.BlacklistedIpDTO;
import com.networkmonitor.alert.entity.BlacklistedIp;
import com.networkmonitor.alert.repository.BlacklistedIpRepository;
import com.networkmonitor.common.exception.ResourceNotFoundException;
import com.networkmonitor.user.entity.User;
import com.networkmonitor.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BlacklistedIpService {

    private final BlacklistedIpRepository blacklistedIpRepository;
    private final UserRepository userRepository;

    @Transactional
    public BlacklistedIpDTO addIpToBlacklist(String ipAddress, String reason, String username) {
        if (blacklistedIpRepository.findByIpAddress(ipAddress).isPresent()) {
            throw new IllegalArgumentException("IP address is already in the blacklist");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        BlacklistedIp blacklistedIp = BlacklistedIp.builder()
                .ipAddress(ipAddress)
                .reason(reason)
                .addedBy(user)
                .build();

        return mapToDTO(blacklistedIpRepository.save(blacklistedIp));
    }

    @Transactional
    public BlacklistedIpDTO updateBlacklistStatus(Long id, boolean enabled) {
        BlacklistedIp blacklistedIp = blacklistedIpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blacklisted IP not found with id " + id));
        
        blacklistedIp.setEnabled(enabled);
        return mapToDTO(blacklistedIpRepository.save(blacklistedIp));
    }

    @Transactional
    public void removeIpFromBlacklist(Long id) {
        if (!blacklistedIpRepository.existsById(id)) {
            throw new ResourceNotFoundException("Blacklisted IP not found with id " + id);
        }
        blacklistedIpRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Page<BlacklistedIpDTO> getAllBlacklistedIps(Pageable pageable) {
        return blacklistedIpRepository.findAll(pageable).map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public boolean isIpBlacklisted(String ipAddress) {
        return blacklistedIpRepository.existsByIpAddressAndEnabledTrue(ipAddress);
    }

    private BlacklistedIpDTO mapToDTO(BlacklistedIp entity) {
        BlacklistedIpDTO dto = new BlacklistedIpDTO();
        dto.setId(entity.getId());
        dto.setIpAddress(entity.getIpAddress());
        dto.setReason(entity.getReason());
        dto.setAddedByUserId(entity.getAddedBy() != null ? entity.getAddedBy().getId() : null);
        dto.setAddedAt(entity.getAddedAt());
        dto.setEnabled(entity.getEnabled());
        return dto;
    }
}
