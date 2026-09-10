# Contributing to NetMonitor 🛰️

First off, thank you for considering contributing to **NetMonitor**! Open source projects thrive when developers collaborate, share ideas, and build together.

Whether you're fixing a bug, adding new protocol dissection logic, improving UI charts, or writing documentation, all contributions are warmly welcome.

---

## 🍴 How to Contribute

### 1. Fork & Clone the Repository
1. Click the **Fork** button at the top-right of the repository page:  
   [https://github.com/Vinaypatel24/network-traffic-monitoring-system/fork](https://github.com/Vinaypatel24/network-traffic-monitoring-system/fork)
2. Clone your forked repository locally:
   ```bash
   git clone https://github.com/<YOUR-USERNAME>/network-traffic-monitoring-system.git
   cd network-traffic-monitoring-system
   ```

### 2. Create a Feature Branch
```bash
git checkout -b feature/your-awesome-feature
```

### 3. Local Development Setup
- **Backend (Java 21 / Spring Boot 3)**:
  ```bash
  cd network-monitor-backend
  mvn spring-boot:run -Dspring-boot.run.profiles=dev
  ```
- **Frontend (React 19 / Vite)**:
  ```bash
  cd network-monitor-frontend
  npm install
  npm run dev
  ```
- Open `http://localhost:5173` in your browser.

### 4. Running Verification Checks
Before opening a pull request, ensure tests pass:
- **Backend tests**:
  ```bash
  cd network-monitor-backend
  mvn test
  ```
- **Frontend build & lint**:
  ```bash
  cd network-monitor-frontend
  npm run build
  ```

### 5. Commit & Push
Follow clean conventional commit messages:
```bash
git commit -m "feat(parser): add ARP protocol header dissection"
git push origin feature/your-awesome-feature
```

### 6. Open a Pull Request
Go to your fork on GitHub and click **"Compare & pull request"**. Describe your changes and link any related issues!

---

## 💡 Great First Contribution Ideas

Looking for ways to get involved? Here are high-impact features you can build:

1. **Protocol Parsers**:
   - Add dissection for ARP, ICMPv6, or TLS SNI handshakes in `com.networkmonitor.capture.parser`.
2. **Threat Detection Heuristics**:
   - Add ARP spoofing detection or DNS tunnel beaconing heuristics in `ThreatDetectionEngine`.
3. **Export Capabilities**:
   - Add a 1-click button on the Packets page to export selected packets as `.pcap` or `.csv`.
4. **UI Improvements**:
   - Add customizable alert sound triggers or enhanced Chart.js zoom plugins.

---

## 📄 Code of Conduct
Please be respectful and constructive in all discussions, issues, and pull requests. Let's make network monitoring accessible and exciting for everyone!
