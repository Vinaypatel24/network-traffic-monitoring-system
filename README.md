# Network Traffic Monitoring & Threat Detection System

A full-stack application that captures raw network packets, parses them, aggregates traffic statistics, and runs real-time threat detection algorithms (Port Scans, Traffic Spikes, Abnormal Rates, Suspicious Connections).

## Features
- **Live Packet Capture**: Uses `pcap4j` to interface with the host network stack and capture TCP/UDP/ICMP packets in real-time.
- **Traffic Dashboard**: Real-time traffic rate and volume visualization using Chart.js and WebSockets.
- **Threat Detection Engine**: Heuristic-based detection strategies that flag malicious behavior.
- **Alert Management**: Acknowledge and resolve security alerts.
- **IP Blacklisting**: Block specific IPs from communicating on monitored interfaces.

## Architecture
- **Backend**: Spring Boot, Java 21, Maven, PostgreSQL, Pcap4J, WebSocket (STOMP).
- **Frontend**: React, Vite, Tailwind-like custom glassmorphism UI, Chart.js.

## Prerequisites
- **Java 21**
- **Node.js 20+**
- **Docker & Docker Compose** (Optional, for containerized deployment)
- **Npcap / WinPcap** (Required for Windows packet capture natively)

---

## Running Natively (Recommended for Windows)

Because Docker Desktop on Windows runs in a virtualized network namespace, packet capture inside a container will only see traffic from the Docker VM, not your physical Windows machine. For true packet capture on Windows, run the backend natively.

### 1. Database Setup
```bash
docker run --name network-monitor-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=network_monitor -p 5432:5432 -d postgres:15-alpine
```

### 2. Backend
Navigate to `network-monitor-backend`:
```bash
mvn spring-boot:run
```
*(Ensure Npcap is installed on your Windows machine, otherwise Pcap4J will fail to start).*

### 3. Frontend
Navigate to `network-monitor-frontend`:
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Running via Docker (Recommended for Linux)

This setup uses `network_mode: host` to allow the backend container to sniff the physical host's network interfaces.

```bash
docker-compose up --build -d
```
The application will be available at `http://localhost:5173`.

---

## Default Credentials
- **Username**: `admin`
- **Password**: `admin` (or register a new user from the database if authentication is bypassed).

## Screenshots
*(Add screenshots of your dashboard here)*
