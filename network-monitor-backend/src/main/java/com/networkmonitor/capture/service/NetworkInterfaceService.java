package com.networkmonitor.capture.service;

import com.networkmonitor.capture.entity.NetworkInterface;
import com.networkmonitor.capture.repository.NetworkInterfaceRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.pcap4j.core.PcapNativeException;
import org.pcap4j.core.PcapNetworkInterface;
import org.pcap4j.core.Pcaps;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NetworkInterfaceService {

    private final NetworkInterfaceRepository networkInterfaceRepository;

    @PostConstruct
    @Transactional
    public void discoverInterfaces() {
        try {
            List<PcapNetworkInterface> allDevs = Pcaps.findAllDevs();
            if (allDevs == null || allDevs.isEmpty()) {
                log.warn("No network interfaces found via Pcap4J. Check permissions or Npcap installation.");
                return;
            }

            for (PcapNetworkInterface pcapInterface : allDevs) {
                Optional<NetworkInterface> existing = networkInterfaceRepository.findByName(pcapInterface.getName());
                
                if (existing.isEmpty()) {
                    NetworkInterface nic = NetworkInterface.builder()
                            .name(pcapInterface.getName())
                            .description(pcapInterface.getDescription())
                            .loopback(pcapInterface.isLoopBack())
                            .active(pcapInterface.isUp())
                            .build();
                    networkInterfaceRepository.save(nic);
                    log.info("Discovered new interface: {} ({})", nic.getName(), nic.getDescription());
                } else {
                    NetworkInterface nic = existing.get();
                    nic.setDescription(pcapInterface.getDescription());
                    nic.setLoopback(pcapInterface.isLoopBack());
                    nic.setActive(pcapInterface.isUp());
                    networkInterfaceRepository.save(nic);
                }
            }
        } catch (PcapNativeException e) {
            log.error("Failed to discover network interfaces: {}", e.getMessage(), e);
        }
    }

    public List<NetworkInterface> getAllInterfaces() {
        return networkInterfaceRepository.findAll();
    }
    
    public NetworkInterface getInterfaceById(Long id) {
        return networkInterfaceRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Interface not found"));
    }
}
