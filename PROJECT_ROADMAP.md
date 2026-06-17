# Project Roadmap

**Project:** Network Traffic Monitoring & Threat Detection System

This roadmap breaks down the project into weekly milestones across 13 weeks (6 Sprints).

---

## Phase 1: Foundation (Sprint 1)

### Week 1 — Setup & Security
- **Tasks:**
  - Initialize Git repo, Spring Boot project, React project.
  - Design Database schema and write Flyway migrations (V1 & V2).
  - Implement User, Role entities, and Repositories.
  - Build stateless JWT authentication (HS256) with `httpOnly` cookies for refresh tokens.
  - Write unit tests for Auth service.
- **Dependencies:** None.
- **Estimated Completion:** Week 1 End
- **Deliverables:** Working backend API for register, login, refresh, logout.
- **Testing:** Unit tests for `AuthService`. Postman collection for manual verification.

---

## Phase 2: Capture Engine (Sprint 2)

### Week 2 — Pcap4J Integration
- **Tasks:**
  - Implement `NetworkInterfaceService` to list available NICs via Pcap4J.
  - Implement `CaptureSession` entity and repository.
  - Implement `PacketCaptureService` with an `@Async` capture loop.
  - Build `CaptureController` to start/stop sessions.
- **Dependencies:** Week 1 (Auth + Database).
- **Estimated Completion:** Week 2 End
- **Deliverables:** API to list NICs and start/stop live packet capture.
- **Testing:** Manual side-by-side verification with Wireshark.

---

## Phase 3: Parsing & Storage (Sprint 3)

### Weeks 3 & 4 — Protocol Parsers & Batch Inserts
- **Tasks:**
  - Implement `ProtocolParserFactory`, `TcpParser`, `UdpParser`, `IcmpParser`, `DnsParser`.
  - Design `PacketDTO` and MapStruct mappers.
  - Implement ultra-fast JDBC `batchUpdate` insert path for packets.
  - Build `PacketController` for paginated queries.
- **Dependencies:** Week 2 (Capture Engine).
- **Estimated Completion:** Week 4 End
- **Deliverables:** Packets are decoded and persistently stored in PostgreSQL.
- **Testing:** Unit tests for parsers using raw byte arrays.

---

## Phase 4: Statistics (Sprint 4)

### Weeks 5 & 6 — In-Memory Aggregation
- **Tasks:**
  - Implement `TrafficStatistics` and `IpStatistics` entities.
  - Build `StatisticsAggregatorService` using `ConcurrentHashMap` counters.
  - Create `@Scheduled` task to flush counters to the database.
  - Build `StatisticsController` to serve dashboard charts.
- **Dependencies:** Weeks 3-4 (Packet Parsing).
- **Estimated Completion:** Week 6 End
- **Deliverables:** Pre-aggregated statistics APIs (packets/min, top IPs, protocol distribution).
- **Testing:** Integration tests seeding DB and verifying stats endpoints.

---

## Phase 5: Threat Detection & WebSocket (Sprint 5)

### Weeks 7, 8, & 9 — Detection Engine & Live Stream
- **Tasks:**
  - Implement `ThreatDetectionEngine` and `SlidingWindowCounter`.
  - Build 4 strategies: Port Scan, Traffic Spike, Abnormal Rate, Suspicious Connection.
  - Create `Alert` and `BlacklistedIp` CRUD APIs.
  - Configure STOMP WebSocket broker with JWT authentication.
  - Implement `DashboardBroadcastService` for real-time pushing.
- **Dependencies:** Weeks 5-6 (Statistics).
- **Estimated Completion:** Week 9 End
- **Deliverables:** Real-time threat detection alerts and live STOMP topic streams.
- **Testing:** Integration tests firing simulated port scans against the monitored host.

---

## Phase 6: Frontend Dashboard (Sprint 6)

### Weeks 10 & 11 — React + Vite UI
- **Tasks:**
  - Setup Axios interceptors and AuthContext.
  - Build Dashboard (Chart.js pie/line charts, Live Packet Feed).
  - Build Packets grid (filtering/pagination).
  - Build Alerts management UI (Admin forms).
- **Dependencies:** Weeks 1-9 (Full Backend).
- **Estimated Completion:** Week 11 End
- **Deliverables:** Fully functional React SPA.
- **Testing:** E2E manual testing of flows (login -> start capture -> view dashboard).

---

## Phase 7: Delivery (Sprint 6 cont.)

### Weeks 12 & 13 — Hardening, Docker & Demo
- **Tasks:**
  - Comprehensive unit and integration test coverage.
  - Docker multi-stage builds for backend and frontend.
  - `docker-compose.yml` finalization (handling `network_mode: host` fixes).
  - Write `README.md` and Windows setup guide.
  - Record Demo video.
- **Dependencies:** Weeks 10-11 (Frontend).
- **Estimated Completion:** Week 13 End
- **Deliverables:** Containerized stack ready for deployment.
