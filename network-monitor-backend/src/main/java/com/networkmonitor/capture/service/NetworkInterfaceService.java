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
        if (System.getProperty("os.name", "").toLowerCase().contains("win")) {
            String currentJnaPath = System.getProperty("jna.library.path", "");
            if (!currentJnaPath.contains("Npcap")) {
                System.setProperty("jna.library.path", "C:\\Windows\\System32\\Npcap;" + currentJnaPath);
            }
        }

        try {
            List<PcapNetworkInterface> allDevs = Pcaps.findAllDevs();
            if (allDevs != null && !allDevs.isEmpty()) {
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
            } else {
                log.warn("No network interfaces found via Pcap4J. Check permissions or Npcap installation.");
            }
        } catch (PcapNativeException e) {
            log.error("Failed to discover network interfaces: {}", e.getMessage(), e);
        } catch (Error e) {
            // Covers UnsatisfiedLinkError (and all other JVM Errors).
            log.warn("Npcap/libpcap native library not found — packet capture is DISABLED. "
                    + "Install Npcap from https://npcap.com to enable capture. Error: {}", e.getMessage());
        } catch (Throwable t) {
            log.error("Unexpected error during network interface discovery: {}", t.getMessage(), t);
        } finally {
            ensureDemoInterfaceExists();
        }
    }

    private void ensureDemoInterfaceExists() {
        if (networkInterfaceRepository.findByName("virtual-demo-0").isEmpty()) {
            NetworkInterface demoNic = NetworkInterface.builder()
                    .name("virtual-demo-0")
                    .description("Virtual Simulation Adapter (Demo Traffic)")
                    .loopback(true)
                    .active(true)
                    .build();
            networkInterfaceRepository.save(demoNic);
            log.info("Registered virtual demo interface: {}", demoNic.getName());
        }
    }

    public List<NetworkInterface> getAllInterfaces() {
        return networkInterfaceRepository.findAll();
    }
    
    public NetworkInterface getInterfaceById(Long id) {
        return networkInterfaceRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Interface not found"));
    }
}
