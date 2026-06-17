# Network Traffic Monitoring & Threat Detection System
### Complete Software Architecture Blueprint (Student-Level DPI Project)

**Stack:** Java 21 · Spring Boot 3.x · Spring Security · JWT · Spring Data JPA/Hibernate · WebSocket (STOMP) · Pcap4J · PostgreSQL · React · Chart.js · Docker

---

## 1. High-Level System Architecture

```
                                ┌──────────────────────────────────────────┐
                                │              CLIENT (Browser)              │
                                │  React SPA  +  Chart.js  +  STOMP Client   │
                                └───────────────┬─────────────┬─────────────┘
                                                 │ HTTPS/REST  │ WSS (STOMP over WebSocket)
                                                 ▼             ▼
                        ┌────────────────────────────────────────────────────┐
                        │                 SPRING BOOT APPLICATION             │
                        │ ┌────────────────┐  ┌───────────────────────────┐  │
                        │ │  Security Layer │  │   WebSocket Broker (STOMP) │  │
                        │ │ JWT Filter Chain│  │  /topic/packets            │  │
                        │ │ Role Guard      │  │  /topic/statistics         │  │
                        │ └───────┬─────────┘  │  /topic/alerts              │  │
                        │         │            └──────────────┬──────────────┘  │
                        │         ▼                           ▲                 │
                        │ ┌──────────────────┐                │                 │
                        │ │   REST Controllers │───────────────┘                 │
                        │ └─────────┬─────────┘                                  │
                        │           ▼                                           │
                        │ ┌─────────────────────┐   ┌─────────────────────┐     │
                        │ │  Service Layer       │──▶│ Threat Detection     │     │
                        │ │ (Capture/Stats/Alert) │   │ Engine (Strategies)  │     │
                        │ └─────────┬─────────────┘   └──────────┬───────────┘     │
                        │           ▼                            │                  │
                        │ ┌─────────────────────┐                 │                  │
                        │ │ Packet Capture Engine │                 │                  │
                        │ │ (Pcap4J + Bounded     │                 │                  │
                        │ │  Queue + Worker Pool) │                 │                  │
                        │ └─────────┬─────────────┘                 │                  │
                        │           ▼                                ▼                  │
                        │ ┌──────────────────────────────────────────────────┐         │
                        │ │     Spring Data JPA / Hibernate Repositories      │         │
                        │ └───────────────────────┬────────────────────────┘         │
                        └─────────────────────────┼──────────────────────────────────┘
                                                    ▼
                                          ┌───────────────────┐
                                          │   PostgreSQL DB    │
                                          │ users, packets,    │
                                          │ alerts, stats, ...  │
                                          └───────────────────┘
                                                    ▲
                                          ┌───────────────────┐
                                          │  Network Interface │
                                          │  (NIC, promiscuous │
                                          │   mode via libpcap)│
                                          └───────────────────┘
```

**Logical layers (top → bottom):** Presentation (React) → API Gateway/Security (Spring Security + JWT) → Application/Service Layer → Domain Engines (Capture, Detection) → Persistence (JPA/Hibernate) → Database (PostgreSQL). WebSocket runs as a parallel, event-driven channel fed by the same service layer rather than a separate system, which keeps the architecture a **modular monolith** — the right complexity level for a student project, while every module is decoupled enough to be peeled into a microservice later (a strong interview talking point).

---

## 2. Detailed Component Architecture

| Component | Responsibility | Key Classes |
|---|---|---|
| **Auth Module** | Register/login, issue & validate JWT, password hashing, role checks | `AuthController`, `AuthService`, `JwtUtil`, `JwtAuthFilter`, `CustomUserDetailsService` |
| **Capture Module** | List NICs, start/stop capture sessions, run Pcap4J capture loop on dedicated threads | `PacketCaptureService`, `CaptureSessionManager`, `NetworkInterfaceService` |
| **Parsing Module** | Convert raw `Packet` (Pcap4J) into normalized `PacketDTO` | `ProtocolParserFactory`, `TcpParser`, `UdpParser`, `IcmpParser`, `DnsParser`, `BaseProtocolParser` |
| **Persistence Module** | Batch-write parsed packets, statistics, alerts to PostgreSQL | `PacketRepository`, `TrafficStatisticsRepository`, `AlertRepository` |
| **Statistics Module** | Aggregate live counters, compute per-minute/protocol/top-IP stats | `StatisticsAggregatorService`, `StatsScheduler` |
| **Threat Detection Module** | Run pluggable detection strategies on sliding windows of recent traffic | `ThreatDetectionEngine`, `ThreatDetectionStrategy` (interface), 4 concrete strategies |
| **Alert Module** | Persist alerts, expose alert APIs, manage alert rules/thresholds | `AlertService`, `AlertRuleService`, `AlertController` |
| **WebSocket Module** | Push live packet/stat/alert events to subscribed dashboards | `WebSocketConfig`, `DashboardBroadcastService` |
| **Common/Infra** | Exception handling, API response wrapper, pagination, mapping | `GlobalExceptionHandler`, `ApiResponse<T>`, `PacketMapper` (MapStruct) |

### Component Interaction Diagram (textual)

```
PacketCaptureService --(raw bytes)--> BlockingQueue --(consumer threads)--> ProtocolParserFactory
        |                                                                          |
        |                                                                          v
        |                                                                  PacketDTO (normalized)
        |                                                                          |
        |          ┌───────────────────────────────────────────────────────────────┼────────────────┐
        |          v                                                               v                |
        |   PacketRepository.batchInsert()                          StatisticsAggregatorService      |
        |                                                                          |                  v
        |                                                                          v          ThreatDetectionEngine
        |                                                            TrafficStatisticsRepository      |
        |                                                                                              v
        +-------------------------------------------------------------------------------------> AlertRepository
                                                                                                       |
                                                                                                       v
                                                                                     DashboardBroadcastService (WebSocket)
```

---

## 3. Complete Folder Structure

### Backend (single Maven module — `network-monitor-backend`)

```
network-monitor-backend/
├── pom.xml
├── Dockerfile
├── src/
│   ├── main/
│   │   ├── java/com/networkmonitor/
│   │   │   ├── NetworkMonitorApplication.java
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── WebSocketConfig.java
│   │   │   │   ├── CorsConfig.java
│   │   │   │   ├── SwaggerConfig.java
│   │   │   │   └── AsyncConfig.java
│   │   │   ├── auth/
│   │   │   │   ├── controller/AuthController.java
│   │   │   │   ├── service/AuthService.java
│   │   │   │   ├── dto/{LoginRequest,RegisterRequest,JwtResponse}.java
│   │   │   │   ├── security/{JwtUtil,JwtAuthFilter,CustomUserDetailsService}.java
│   │   │   ├── user/
│   │   │   │   ├── entity/{User,Role}.java
│   │   │   │   ├── repository/{UserRepository,RoleRepository}.java
│   │   │   │   └── service/UserService.java
│   │   │   ├── capture/
│   │   │   │   ├── entity/CaptureSession.java
│   │   │   │   ├── repository/CaptureSessionRepository.java
│   │   │   │   ├── service/{PacketCaptureService,NetworkInterfaceService,CaptureSessionManager}.java
│   │   │   │   ├── controller/CaptureController.java
│   │   │   │   └── enums/CaptureStatus.java
│   │   │   ├── packet/
│   │   │   │   ├── entity/Packet.java
│   │   │   │   ├── repository/PacketRepository.java
│   │   │   │   ├── dto/PacketDTO.java
│   │   │   │   ├── parser/{ProtocolParserFactory,BaseProtocolParser,
│   │   │   │   │            TcpParser,UdpParser,IcmpParser,DnsParser}.java
│   │   │   │   ├── controller/PacketController.java
│   │   │   │   └── mapper/PacketMapper.java
│   │   │   ├── statistics/
│   │   │   │   ├── entity/TrafficStatistics.java
│   │   │   │   ├── repository/TrafficStatisticsRepository.java
│   │   │   │   ├── service/StatisticsAggregatorService.java
│   │   │   │   ├── scheduler/StatsScheduler.java
│   │   │   │   ├── dto/{ProtocolDistributionDTO,TopIpDTO,OverviewStatsDTO}.java
│   │   │   │   └── controller/StatisticsController.java
│   │   │   ├── detection/
│   │   │   │   ├── ThreatDetectionEngine.java
│   │   │   │   ├── strategy/
│   │   │   │   │   ├── ThreatDetectionStrategy.java          (interface)
│   │   │   │   │   ├── PortScanDetectionStrategy.java
│   │   │   │   │   ├── TrafficSpikeDetectionStrategy.java
│   │   │   │   │   ├── AbnormalRequestRateStrategy.java
│   │   │   │   │   └── SuspiciousConnectionStrategy.java
│   │   │   │   ├── window/SlidingWindowCounter.java
│   │   │   │   └── event/ThreatDetectedEvent.java
│   │   │   ├── alert/
│   │   │   │   ├── entity/{Alert,AlertRule}.java
│   │   │   │   ├── repository/{AlertRepository,AlertRuleRepository}.java
│   │   │   │   ├── service/{AlertService,AlertRuleService}.java
│   │   │   │   ├── controller/AlertController.java
│   │   │   │   └── enums/{AlertSeverity,AlertStatus}.java
│   │   │   ├── websocket/
│   │   │   │   ├── DashboardBroadcastService.java
│   │   │   │   └── dto/{PacketEvent,StatsEvent,AlertEvent}.java
│   │   │   └── common/
│   │   │       ├── exception/{GlobalExceptionHandler,ResourceNotFoundException,
│   │   │       │               CaptureException}.java
│   │   │       ├── response/{ApiResponse,PageResponse}.java
│   │   │       └── util/IpUtils.java
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── db/migration/   (Flyway: V1__init_schema.sql, V2__seed_roles.sql, ...)
│   └── test/java/com/networkmonitor/
│       ├── detection/PortScanDetectionStrategyTest.java
│       ├── packet/parser/TcpParserTest.java
│       ├── auth/AuthServiceTest.java
│       └── integration/PacketCaptureIntegrationTest.java
```

### Frontend (`network-monitor-frontend`)

```
network-monitor-frontend/
├── package.json
├── Dockerfile
├── nginx.conf
├── public/
└── src/
    ├── api/
    │   ├── axiosClient.js
    │   ├── authApi.js
    │   ├── captureApi.js
    │   ├── packetApi.js
    │   ├── statisticsApi.js
    │   └── alertApi.js
    ├── services/
    │   └── websocketService.js        (STOMP client + topic subscriptions)
    ├── context/AuthContext.jsx
    ├── hooks/{useAuth,useWebSocket,usePagination}.js
    ├── components/
    │   ├── layout/{Navbar,Sidebar,ProtectedRoute}.jsx
    │   ├── dashboard/{StatCard,ProtocolPieChart,TrafficLineChart,
    │   │              TopIpsTable,LivePacketFeed}.jsx
    │   ├── alerts/{AlertList,AlertSeverityBadge,AlertRuleForm}.jsx
    │   └── packets/{PacketTable,PacketFilterBar}.jsx
    ├── pages/
    │   ├── LoginPage.jsx
    │   ├── RegisterPage.jsx
    │   ├── DashboardPage.jsx
    │   ├── PacketsPage.jsx
    │   ├── AlertsPage.jsx
    │   └── SettingsPage.jsx
    ├── utils/{formatBytes,formatDate}.js
    ├── App.jsx
    └── main.jsx
```

### Deployment root

```
network-monitor-system/
├── docker-compose.yml
├── network-monitor-backend/
├── network-monitor-frontend/
└── docs/  (diagrams, ERD, README)
```

---

## 4. Database Design (PostgreSQL)

| Table | Purpose |
|---|---|
| `users` | Login credentials, profile |
| `roles` | `ROLE_ADMIN`, `ROLE_USER` |
| `user_roles` | many-to-many join |
| `network_interfaces` | Discovered NICs (name, description, status) |
| `capture_sessions` | One row per "start capture → stop capture" run |
| `packets` | Every captured/parsed packet (high volume, partitioned) |
| `traffic_statistics` | Pre-aggregated per time-bucket/protocol counters |
| `ip_statistics` | Per-IP rolled-up counters (top talkers) |
| `alert_rules` | Configurable thresholds per detection type |
| `alerts` | Generated alert/incident records |

### DDL (core tables)

```sql
CREATE TABLE roles (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(30) UNIQUE NOT NULL        -- ROLE_ADMIN, ROLE_USER
);

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(50)  UNIQUE NOT NULL,
    email           VARCHAR(120) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    enabled         BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT now()
);

CREATE TABLE user_roles (
    user_id   BIGINT REFERENCES users(id) ON DELETE CASCADE,
    role_id   BIGINT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE network_interfaces (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    description   VARCHAR(255),
    is_loopback   BOOLEAN DEFAULT FALSE,
    is_active     BOOLEAN DEFAULT FALSE
);

CREATE TABLE capture_sessions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id),
    interface_id    BIGINT REFERENCES network_interfaces(id),
    start_time      TIMESTAMP NOT NULL DEFAULT now(),
    end_time        TIMESTAMP,
    status          VARCHAR(20) NOT NULL DEFAULT 'RUNNING',   -- RUNNING/STOPPED/ERROR
    total_packets   BIGINT DEFAULT 0,
    total_bytes     BIGINT DEFAULT 0
);

-- High-volume table, partitioned by captured_at (monthly range partitions in production;
-- a single table is fine for student-scale demo, but document the partition strategy).
CREATE TABLE packets (
    id                  BIGSERIAL PRIMARY KEY,
    capture_session_id  BIGINT REFERENCES capture_sessions(id) ON DELETE CASCADE,
    src_ip              VARCHAR(45) NOT NULL,
    dst_ip              VARCHAR(45) NOT NULL,
    src_port            INTEGER,
    dst_port            INTEGER,
    protocol            VARCHAR(10) NOT NULL,     -- TCP/UDP/ICMP/DNS/HTTP/HTTPS
    packet_size         INTEGER NOT NULL,
    ttl                 INTEGER,
    tcp_flags           VARCHAR(20),
    captured_at         TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_packets_session_time ON packets(capture_session_id, captured_at);
CREATE INDEX idx_packets_src_ip       ON packets(src_ip);
CREATE INDEX idx_packets_dst_ip       ON packets(dst_ip);
CREATE INDEX idx_packets_protocol     ON packets(protocol);

CREATE TABLE traffic_statistics (
    id                  BIGSERIAL PRIMARY KEY,
    capture_session_id  BIGINT REFERENCES capture_sessions(id) ON DELETE CASCADE,
    window_start        TIMESTAMP NOT NULL,
    window_end          TIMESTAMP NOT NULL,
    protocol            VARCHAR(10),
    packet_count        BIGINT DEFAULT 0,
    byte_count          BIGINT DEFAULT 0
);
CREATE INDEX idx_stats_window ON traffic_statistics(window_start, window_end);

CREATE TABLE ip_statistics (
    id                  BIGSERIAL PRIMARY KEY,
    capture_session_id  BIGINT REFERENCES capture_sessions(id) ON DELETE CASCADE,
    ip_address          VARCHAR(45) NOT NULL,
    direction            VARCHAR(10) NOT NULL,     -- SOURCE / DESTINATION
    packet_count        BIGINT DEFAULT 0,
    byte_count          BIGINT DEFAULT 0,
    window_start        TIMESTAMP NOT NULL,
    window_end          TIMESTAMP NOT NULL
);

CREATE TABLE alert_rules (
    id                  BIGSERIAL PRIMARY KEY,
    rule_type           VARCHAR(40) NOT NULL,      -- PORT_SCAN / TRAFFIC_SPIKE / ...
    threshold_value     DOUBLE PRECISION NOT NULL,
    time_window_seconds INTEGER NOT NULL,
    severity            VARCHAR(10) NOT NULL,      -- LOW/MEDIUM/HIGH/CRITICAL
    enabled              BOOLEAN DEFAULT TRUE
);

CREATE TABLE alerts (
    id                  BIGSERIAL PRIMARY KEY,
    rule_id             BIGINT REFERENCES alert_rules(id),
    capture_session_id  BIGINT REFERENCES capture_sessions(id),
    alert_type          VARCHAR(40) NOT NULL,
    source_ip           VARCHAR(45),
    destination_ip      VARCHAR(45),
    severity            VARCHAR(10) NOT NULL,
    description         TEXT,
    status              VARCHAR(20) DEFAULT 'NEW',  -- NEW/ACKNOWLEDGED/RESOLVED
    detected_at         TIMESTAMP NOT NULL DEFAULT now(),
    resolved_at         TIMESTAMP
);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_time   ON alerts(detected_at);
```

---

## 5. Entity Relationship Diagram — Explanation

```
users (1) ───< (M) capture_sessions (1) ───< (M) packets
  │                       │
  │ (M2M via user_roles)  │ (1) ───< (M) traffic_statistics
  ▼                       │ (1) ───< (M) ip_statistics
roles                      ▼
                    network_interfaces (1) ───< (M) capture_sessions

alert_rules (1) ───< (M) alerts >─── (M) capture_sessions (1)
```

- **users ↔ roles**: many-to-many through `user_roles` — supports future granular permissions beyond just `USER`/`ADMIN`.
- **users → capture_sessions**: one user can run many capture sessions over time (one-to-many); each session belongs to exactly one user, enabling per-user audit history.
- **network_interfaces → capture_sessions**: a NIC can be reused across many sessions.
- **capture_sessions → packets**: the core fact table relationship; deleting a session cascades to its packets (so a "Clear History" admin action is one delete).
- **capture_sessions → traffic_statistics / ip_statistics**: pre-aggregated rollups scoped to a session, decoupled from the raw `packets` table so dashboard queries never have to scan millions of packet rows live.
- **alert_rules → alerts**: a rule is a *template* (threshold + type); each time it fires it produces an `alert` row, giving you both "current configuration" and "historical incidents" without conflating the two.

---

## 6. Backend Module Breakdown

1. **Auth & User Module** — registration, login, JWT issuance/validation, `UserDetailsService`, BCrypt hashing, role seeding (Flyway).
2. **Capture Module** — interface discovery (`PcapNetworkInterface.getAllPcapNetworkInterfaces()`), session lifecycle (start/stop/status), one capture thread per active session.
3. **Parsing Module** — Factory + Template Method pattern: `ProtocolParserFactory` inspects the IP protocol number / EtherType and delegates to the right parser, each returning a normalized `PacketDTO`.
4. **Persistence Module** — JPA repositories + a **batch-insert path** (JDBC `batchUpdate` via `JdbcTemplate`, *not* `saveAll()`) for packet writes, since Hibernate's per-entity `save()` cannot keep up with thousands of packets/sec.
5. **Statistics Module** — in-memory `ConcurrentHashMap` counters updated per-packet (cheap), flushed to `traffic_statistics`/`ip_statistics` every N seconds by a `@Scheduled` job (expensive DB write amortized).
6. **Threat Detection Module** — `ThreatDetectionEngine` runs each enabled `ThreatDetectionStrategy` against a shared sliding-window data structure on a fixed schedule (e.g., every 5s).
7. **Alert Module** — persists `Alert` entities, exposes CRUD for `AlertRule`, supports filtering/resolving alerts.
8. **WebSocket Module** — `DashboardBroadcastService` is the single choke point that pushes `PacketEvent`/`StatsEvent`/`AlertEvent` to STOMP topics; throttled to avoid flooding the browser.
9. **Common/Infra** — global exception handler returning a consistent `ApiResponse<T>` envelope, MapStruct DTO mappers, pagination wrapper.

---

## 7. Frontend Module Breakdown

| Module | Responsibility |
|---|---|
| `api/` | Axios instance with JWT interceptor (attaches `Authorization: Bearer <token>`, handles 401 → redirect to login) |
| `services/websocketService.js` | Wraps `@stomp/stompjs` + `sockjs-client`; exposes `subscribePackets()`, `subscribeStats()`, `subscribeAlerts()` |
| `context/AuthContext` | Holds JWT + user info in React state (never `localStorage` alone for sensitive flows — discuss XSS tradeoffs) |
| `components/dashboard/*` | Chart.js wrappers: protocol pie chart, packets/min line chart, top-IP bar/table, live packet ticker |
| `components/alerts/*` | Alert table with severity badges, rule configuration form |
| `pages/*` | Route-level screens composing the components above |
| `hooks/useWebSocket` | Manages subscribe/unsubscribe lifecycle tied to component mount |

**State management:** React Context + hooks is sufficient at this scale; mention Redux/Zustand as a scalability upgrade if the interviewer probes.

---

## 8. API Design (All Endpoints)

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Returns JWT + refresh token |
| POST | `/api/auth/refresh` | Public (refresh token) | Issue new access token |
| GET  | `/api/auth/me` | Bearer | Current user profile |

### Capture
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET  | `/api/interfaces` | Bearer | List available NICs |
| POST | `/api/capture/start` | Bearer | Body: `{interfaceId}` → starts session |
| POST | `/api/capture/stop/{sessionId}` | Bearer | Stops session |
| GET  | `/api/capture/sessions` | Bearer | Paginated session history |
| GET  | `/api/capture/sessions/{id}` | Bearer | Session detail |
| GET  | `/api/capture/status` | Bearer | Active session(s) for current user |

### Packets
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/packets?sessionId=&protocol=&srcIp=&dstIp=&page=&size=` | Bearer | Filtered, paginated packet log |
| GET | `/api/packets/{id}` | Bearer | Single packet detail |

### Statistics
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/statistics/overview?sessionId=` | Bearer | Totals: packets, bytes, duration |
| GET | `/api/statistics/protocol-distribution?sessionId=` | Bearer | Pie-chart data |
| GET | `/api/statistics/packets-per-minute?sessionId=` | Bearer | Line-chart time series |
| GET | `/api/statistics/top-source-ips?sessionId=&limit=10` | Bearer | Top talkers |
| GET | `/api/statistics/top-destination-ips?sessionId=&limit=10` | Bearer | Top destinations |
| GET | `/api/statistics/network-usage?sessionId=` | Bearer | Bytes in/out summary |

### Alerts
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/alerts?status=&severity=&page=&size=` | Bearer | Paginated alert list |
| GET | `/api/alerts/{id}` | Bearer | Alert detail |
| PATCH | `/api/alerts/{id}/acknowledge` | Bearer | Mark acknowledged |
| PATCH | `/api/alerts/{id}/resolve` | Bearer | Mark resolved |
| GET | `/api/alert-rules` | Bearer (ADMIN) | List configured rules |
| POST | `/api/alert-rules` | Bearer (ADMIN) | Create rule |
| PUT | `/api/alert-rules/{id}` | Bearer (ADMIN) | Update threshold/enable/disable |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/users` | ADMIN | List users |
| PUT | `/api/admin/users/{id}/role` | ADMIN | Change role |

### WebSocket
| Endpoint | Type | Description |
|---|---|---|
| `/ws` | SockJS/STOMP handshake (JWT passed as query param or `Authorization` header during handshake) | Connection entry point |
| `/topic/packets/{sessionId}` | Subscribe | Live packet stream (batched) |
| `/topic/statistics/{sessionId}` | Subscribe | Live stat updates |
| `/topic/alerts` | Subscribe | Live alert notifications |

---

## 9. Security Architecture

```
Request → CorsFilter → JwtAuthFilter (extracts & validates token, sets SecurityContext)
        → FilterSecurityInterceptor (role/authority check per @PreAuthorize / antMatcher)
        → Controller
```

- **Password storage:** BCrypt (`PasswordEncoder`), never plaintext.
- **JWT:** signed with HS256 (or RS256 if you want to demonstrate asymmetric signing) using a secret/key from environment variables — never hardcoded. Access token short-lived (15 min), refresh token longer-lived (7 days), refresh tokens stored hashed in DB so they can be revoked.
- **Stateless sessions:** `SessionCreationPolicy.STATELESS` — every request re-authenticates via the JWT filter; no server-side session store, which is what lets the REST tier scale horizontally.
- **RBAC:** `ROLE_USER` can manage their own capture sessions; `ROLE_ADMIN` can manage alert rules and view all users' sessions — enforced via `@PreAuthorize("hasRole('ADMIN')")` at the method level, not just URL patterns, so it survives refactors.
- **WebSocket auth:** the STOMP `CONNECT` frame is intercepted in a `ChannelInterceptor` that validates the same JWT (passed as a STOMP header) before allowing the session to subscribe — otherwise WebSocket would be an unauthenticated side door into the same data the REST API protects.
- **CORS:** explicit allow-list of the React dev/prod origins, not `*`, since credentials (JWT) are involved.
- **Input validation:** `@Valid` + Bean Validation annotations on all request DTOs; parameterized JPA queries eliminate SQL injection by construction.
- **Least privilege for capture:** the JVM process needs raw-socket capability to sniff packets — discussed in §10 and §23 as a deliberate, scoped exception to "run as non-root," not a blanket privilege escalation.

---

## 10. Packet Processing Pipeline

```
[NIC, promiscuous mode]
        │  Pcap4J PacketListener.gotPacket()
        ▼
[Capture Thread]  -- one per active session
        │  offer() — non-blocking, bounded capacity (e.g., 50,000)
        ▼
[BlockingQueue<RawPacket>]   ←── backpressure: if full, drop oldest + increment "dropped" counter
        │
        ▼  poll() by a fixed-size worker pool (e.g., 4 threads, ExecutorService)
[ProtocolParserFactory.parse(rawPacket)]
        │  returns PacketDTO{srcIp, dstIp, srcPort, dstPort, protocol, size, ttl, flags, timestamp}
        ▼
   ┌─────────────┬────────────────────┬───────────────────────┐
   ▼             ▼                    ▼                        ▼
Batch buffer   In-memory counters   Sliding-window feed     (every 1s) WebSocket
(flush every   (AtomicLong /        for ThreatDetection      batch broadcast
500ms or       ConcurrentHashMap)   Engine
2000 rows,
whichever
first) → JDBC
batch INSERT
```

**Why this design:** a single capture thread must never block on I/O (DB writes, JSON serialization) or it will drop packets at the kernel buffer level. Decoupling *capture* from *processing* via a bounded queue (classic **Producer–Consumer**) is the single most important performance decision in this project and is exactly the kind of thing interviewers probe on.

---

## 11. Threat Detection Architecture

```java
public interface ThreatDetectionStrategy {
    List<AlertCandidate> evaluate(DetectionContext context);
    String getType(); // "PORT_SCAN", "TRAFFIC_SPIKE", ...
}
```

`ThreatDetectionEngine` (Spring `@Component`, driven by `@Scheduled(fixedRate = 5000)`) iterates all enabled strategies, each operating on a shared `DetectionContext` built from the last N seconds of `PacketDTO`s held in a ring buffer / `SlidingWindowCounter`.

| Strategy | Algorithm |
|---|---|
| **PortScanDetectionStrategy** | Per source IP, count **distinct destination ports** contacted within a rolling window (e.g., 60s). If `distinctPorts > threshold` (default 15) → flag `PORT_SCAN`. |
| **TrafficSpikeDetectionStrategy** | Maintain a trailing moving average + standard deviation of packets/sec in 10s buckets. If `currentRate > mean + k·stddev` (k=3) → flag `TRAFFIC_SPIKE`. |
| **AbnormalRequestRateStrategy** | Per (srcIp → dstIp) pair, if packet rate exceeds a static threshold (e.g., >100 pkt/s) → flag `ABNORMAL_REQUEST_RATE`. |
| **SuspiciousConnectionStrategy** | Flags connections to known-bad ports (e.g., 4444, 31337), repeated SYN-without-ACK (half-open scans), or destination IPs on a configurable blacklist. |

Each strategy returns `AlertCandidate` objects which `ThreatDetectionEngine` converts to `Alert` entities (persist), then publishes a Spring `ApplicationEvent` (`ThreatDetectedEvent`) — an **Observer** that `DashboardBroadcastService` listens to, decoupling detection from delivery.

Thresholds are **not hardcoded** — they're read from `alert_rules`, so the system is tunable without redeploying, and you can demo "reducing false positives by adjusting the rule" live in an interview.

---

## 12. WebSocket Architecture

- Transport: SockJS fallback + native WebSocket, STOMP as the messaging sub-protocol (`spring-boot-starter-websocket` + `@EnableWebSocketMessageBroker`).
- Broker: simple in-memory broker (`enableSimpleBroker("/topic")`) — sufficient for a student deployment; mention RabbitMQ/ActiveMQ as the upgrade path for multi-instance scaling (`enableStompBrokerRelay`).
- Endpoint: `/ws` (handshake), application destination prefix `/app`, broker prefix `/topic`.
- **Throttled broadcast:** rather than emitting one WebSocket message per packet (which can flood the browser at thousands of packets/sec), the backend buffers events and emits **batched snapshots every 1 second** (`List<PacketDTO>` capped at e.g. 200 most recent) — a deliberate UX/performance tradeoff worth explaining in interviews.
- **Topic scoping:** topics are session-scoped (`/topic/packets/{sessionId}`) so multiple users' dashboards never cross-pollinate data.
- **Auth on connect:** `ChannelInterceptor.preSend()` validates the JWT on the `CONNECT` STOMP frame; unauthenticated frames are rejected before subscription.

---

## 13. Design Patterns Used

| Pattern | Where | Why |
|---|---|---|
| **Producer–Consumer** | Capture thread → BlockingQueue → worker pool | Decouples fast capture from slower parse/persist/detect |
| **Factory Method** | `ProtocolParserFactory` | Choose parser implementation by protocol number at runtime |
| **Template Method** | `BaseProtocolParser` | Shared parse skeleton (extract IP header) with protocol-specific hooks |
| **Strategy** | `ThreatDetectionStrategy` implementations | Swap/add detection algorithms without touching the engine |
| **Observer / Pub-Sub** | `ApplicationEventPublisher` → `ThreatDetectedEvent` listeners | Decouple alert generation from alert delivery (WS, future email/SMS) |
| **Builder** | `PacketDTO.builder()...build()` | Readable construction of a many-field immutable DTO |
| **Repository** | Spring Data JPA interfaces | Standard persistence abstraction |
| **DTO / Mapper** | MapStruct `PacketMapper` | Never leak JPA entities to the controller layer |
| **Singleton (Spring-managed)** | `PacketCaptureService`, `ThreatDetectionEngine` | One coordinating instance per application context |
| **Chain of Responsibility (optional)** | Security filter chain | Standard Spring Security mechanism, worth naming explicitly in interviews |

---

## 14. UML Diagrams Required

1. **Use Case Diagram** — Actors: `User`, `Admin`. Use cases: Register/Login, Start/Stop Capture, View Dashboard, View Packet Logs, View Alerts, Configure Alert Rules (Admin), Manage Users (Admin).
2. **Class Diagram** — Core domain: `User`, `Role`, `CaptureSession`, `Packet`, `TrafficStatistics`, `AlertRule`, `Alert`, plus service classes (`PacketCaptureService`, `ThreatDetectionEngine`) and the `ThreatDetectionStrategy` interface hierarchy.
3. **Component Diagram** — The 9 backend modules from §2 and their dependencies (Capture → Parsing → Persistence/Statistics/Detection → WebSocket).
4. **Deployment Diagram** — Docker host running `backend` (privileged, host network), `frontend` (nginx), `postgres` containers; browser client connecting over HTTPS/WSS.
5. **State Diagram** — `CaptureSession`: `IDLE → RUNNING → (STOPPED | ERROR)`. `Alert`: `NEW → ACKNOWLEDGED → RESOLVED`.
6. **Activity Diagram** — End-to-end packet lifecycle (capture → parse → branch into persist/stat/detect → broadcast).

---

## 15. Sequence Diagrams Required

1. **User Registration & Login** — Client → `AuthController` → `AuthService` → `UserRepository`/`PasswordEncoder` → `JwtUtil.generateToken()` → Client.
2. **Start Capture Session** — Client → `CaptureController` → `CaptureSessionManager` → `PacketCaptureService.startCapture(interface)` → Pcap4J handle opened → `CaptureSession` persisted (`RUNNING`).
3. **Live Packet Flow** — `PacketListener.gotPacket()` → Queue → Worker → `ProtocolParserFactory` → parallel fan-out to `PacketRepository` (batch), `StatisticsAggregatorService`, `ThreatDetectionEngine` sliding window.
4. **Threat Detection → Alert → Dashboard** — `ThreatDetectionEngine` (scheduled tick) → strategy `.evaluate()` → `AlertService.createAlert()` → DB insert → `ApplicationEventPublisher.publish(ThreatDetectedEvent)` → `DashboardBroadcastService` → STOMP `/topic/alerts` → Client renders toast + updates table.
5. **Historical Packet Query** — Client → `PacketController` (filters + pageable) → `PacketRepository` (indexed query) → paginated `ApiResponse<Page<PacketDTO>>` → Client table.
6. **Alert Resolution** — Client → `AlertController.resolve(id)` → `AlertService` updates status/`resolved_at` → DB → response.

---

## 16. Data Flow Diagrams Required

**Level 0 (Context):** `[Network Interface]` → `Network Traffic Monitoring System` ← `[User/Admin]`; outputs: dashboard data, alert notifications.

**Level 1 (Major Processes):**
```
1.0 Capture Traffic  → 2.0 Parse & Normalize → 3.0 Persist Packets (D1: packets)
                                              → 4.0 Aggregate Statistics (D2: traffic_statistics)
                                              → 5.0 Detect Threats (D3: alert_rules) → 6.0 Generate Alert (D4: alerts)
6.0 → 7.0 Notify Dashboard (WebSocket) → [User]
```

**Level 2 (Zoom into 5.0 Detect Threats):** sub-processes 5.1 Port Scan Check, 5.2 Traffic Spike Check, 5.3 Abnormal Rate Check, 5.4 Suspicious Connection Check, each reading from data store `D5: sliding-window buffer` and `D3: alert_rules`, writing candidate alerts to `D4: alerts`.

---

## 17. Development Roadmap (Phases)

| Phase | Goal | Approx. Duration |
|---|---|---|
| **0. Setup & Design** | Repo scaffolding, ERD, API contract, Docker base images | Week 1 |
| **1. Auth & Core Skeleton** | Spring Boot project, Spring Security + JWT, user CRUD | Week 2 |
| **2. Packet Capture Engine** | Pcap4J integration, interface listing, capture session lifecycle | Weeks 3–4 |
| **3. Parsing & Storage** | Protocol parsers, batch persistence, packet query API | Week 5 |
| **4. Statistics Engine** | In-memory counters, scheduled aggregation, statistics API | Week 6 |
| **5. Threat Detection** | Strategy interface + 4 detection algorithms, alert persistence | Weeks 7–8 |
| **6. WebSocket Real-Time Layer** | STOMP config, JWT-secured handshake, broadcast service | Week 9 |
| **7. Frontend Dashboard** | React app, Chart.js visualizations, live feed, auth flow | Weeks 10–11 |
| **8. Alerts UI, Polish, Testing** | Alert management screens, unit/integration tests | Week 12 |
| **9. Dockerization & Docs** | docker-compose, README, architecture diagrams, demo recording | Week 13 |

---

## 18. Sprint-Wise Implementation Plan (2-Week Sprints)

- **Sprint 1 (Wks 1–2):** Project setup, DB schema + Flyway migrations, Auth module (register/login/JWT), Postman collection.
- **Sprint 2 (Wks 3–4):** Pcap4J capture service, interface discovery API, capture session start/stop, manual verification with Wireshark side-by-side.
- **Sprint 3 (Wks 5–6):** Protocol parser factory (TCP/UDP/ICMP/DNS), batch JDBC insert pipeline, packet query REST API with pagination/filtering.
- **Sprint 4 (Wks 7–8):** Statistics aggregator + scheduled flush, statistics REST endpoints, start of threat detection engine (port scan + traffic spike strategies).
- **Sprint 5 (Wks 9–10):** Remaining detection strategies, alert persistence + rules CRUD, WebSocket layer (packets/stats/alerts topics) with JWT-secured handshake.
- **Sprint 6 (Wks 11–12):** React dashboard (charts, live feed, alerts page), end-to-end integration testing, Dockerization, deployment docs, demo video.

---

## 19. Resume-Worthy Features (How to Phrase This Project)

- Built a **real-time Deep Packet Inspection platform** capturing and classifying live TCP/UDP/ICMP/DNS traffic using **Pcap4J**, processing thousands of packets/sec via a **producer-consumer pipeline** with bounded queues and a worker thread pool.
- Designed a **pluggable threat detection engine** (Strategy pattern) implementing **port scan, traffic spike, abnormal request rate, and suspicious connection detection** using sliding-window statistics.
- Implemented **stateless JWT authentication with RBAC** (Spring Security) securing both REST APIs and a **JWT-authenticated WebSocket/STOMP** channel.
- Built a **live-updating React dashboard** (Chart.js) streaming protocol distribution, top talkers, and packets-per-minute via WebSocket, with sub-second latency.
- Optimized high-throughput packet persistence with **batched JDBC inserts**, indexed PostgreSQL schema, and pre-aggregated statistics tables to keep dashboard queries O(1) instead of scanning raw packet logs.
- Containerized the full stack with **Docker Compose** (Spring Boot, PostgreSQL, Nginx-served React), documenting the privileged-capability tradeoffs required for live packet capture.
- Wrote unit tests for protocol parsers and detection strategies, plus integration tests using sample `.pcap` fixtures.

---

## 20. Advanced Features for Later (Stretch Goals)

- **ML-based anomaly detection** (Isolation Forest / lightweight autoencoder) trained on historical traffic statistics to catch anomalies the rule-based engine misses.
- **GeoIP visualization** of source IPs on a world map (MaxMind GeoLite2).
- **Threat intelligence integration** — check destination IPs against AbuseIPDB/VirusTotal feeds.
- **TLS metadata inspection** — extract SNI from TLS ClientHello to classify HTTPS destinations without decrypting payloads.
- **Kafka** between capture and processing for true horizontal scalability and replay capability.
- **Elasticsearch + Kibana** for long-term log search/analytics instead of (or alongside) PostgreSQL.
- **Offline mode** — upload a `.pcap` file and run the same parsing/detection pipeline retroactively.
- **Notification channels** — email/SMS/Slack/webhook alerts in addition to the dashboard.
- **Multi-tenant SaaS mode** — isolate capture sessions and dashboards per organization.
- **Rule import from Suricata/Snort/Zeek** signature formats for credibility with security tooling.

---

## 21. Common Interview Questions & Answers

**Q1. Why does packet capture need elevated privileges, and how did you handle that securely?**
Raw socket access (`AF_PACKET`/libpcap) requires `CAP_NET_RAW`/`CAP_NET_ADMIN` or root, because reading link-layer frames bypasses the normal socket API. I scoped this narrowly: only the capture container/process runs with that capability (`--cap-add=NET_RAW`), while the rest of the application (auth, API, DB access) runs as an unprivileged user — least privilege applied at the process boundary, not the whole app.

**Q2. Why WebSocket instead of polling the REST API every few seconds?**
Polling wastes bandwidth and adds latency proportional to the poll interval. WebSocket (STOMP) gives push-based, sub-second updates and scales better with many idle-but-connected clients, since the server only sends data when something changes.

**Q3. How do you keep the capture thread from dropping packets under load?**
By never doing blocking work (DB writes, detection logic) on the capture thread itself. It only does `queue.offer(rawPacket)` into a bounded `BlockingQueue`; a separate worker pool consumes from the queue. If the queue fills up (consumers can't keep pace), I drop the oldest entries and increment a `droppedPacketCount` metric rather than blocking capture — a classic backpressure tradeoff between data completeness and system stability.

**Q4. Why batch JDBC inserts instead of `JpaRepository.saveAll()`?**
Hibernate's `saveAll()` issues one `INSERT` per entity (or per-batch with `hibernate.jdbc.batch_size` tuned), with full entity lifecycle overhead (dirty checking, ID generation round-trips). At thousands of packets/sec that overhead dominates. A direct `JdbcTemplate.batchUpdate()` with array-based parameter binding is dramatically faster for a write-heavy, append-only table like `packets`.

**Q5. How would you scale this horizontally?**
Put a message broker (Kafka/RabbitMQ) between capture and processing so multiple consumer instances can process packets in parallel; move the WebSocket broker from in-memory to a relay (RabbitMQ STOMP plugin) so multiple Spring Boot instances share broadcast state; partition the `packets` table by time range; move stale data to cold storage/Elasticsearch.

**Q6. How did you choose detection thresholds, and how do you avoid false positives?**
Thresholds (distinct ports for a port scan, packets/sec for a spike, etc.) are stored in an `alert_rules` table, not hardcoded, so they're tunable per environment without a redeploy. For traffic spikes specifically I use a statistical baseline (mean + k·stddev) rather than a fixed number, so "normal" bursts (e.g., a large download) don't always trigger an alert — though I'm upfront that a rule-based system always has a false-positive/false-negative tradeoff, which is exactly why an ML-based stretch goal exists.

**Q7. Why JWT over server-side sessions?**
JWT keeps the API stateless — no session store to keep in sync if you scale to multiple instances — at the cost of harder token revocation (mitigated with short-lived access tokens + a revocable refresh token table).

**Q8. How is the WebSocket channel secured, given JWT is normally an HTTP header?**
The STOMP `CONNECT` frame carries a custom header with the JWT; a `ChannelInterceptor` validates it before the session is allowed to subscribe to any topic, so the WebSocket entry point gets the same authentication guarantee as the REST API rather than being an unauthenticated bypass.

**Q9. Why PostgreSQL instead of a NoSQL store for packet logs?**
The data is structured and relational (sessions own packets, statistics roll up from packets), and I need indexed range/filter queries (by IP, protocol, time) plus strong consistency for alert state transitions — a relational engine fits better than a document store at this scale. I do note time-series/columnar stores (TimescaleDB, ClickHouse) as a better fit if packet volume grew by orders of magnitude.

**Q10. What's the time complexity of the port-scan detection check?**
Per packet it's O(1) amortized (HashMap insert into a per-source-IP set of seen ports); the periodic evaluation scan is O(k) where k is the number of distinct source IPs active in the current window, not O(n) over raw packets, because the sliding window structure pre-aggregates as packets arrive.

**Q11. How do you test a system that depends on live network capture?**
Unit tests target the pure logic (parsers given raw byte arrays, detection strategies given synthetic `PacketDTO` lists) so they don't need an actual NIC. Integration tests replay a checked-in sample `.pcap` file through Pcap4J's offline reader (`PcapHandle` opened from a file) to exercise the full pipeline deterministically.

**Q12. Isn't it ironic/risky to need root-level capabilities in a security tool?**
Yes — and that's a deliberate design discussion point: the privileged surface is minimized to exactly the capture component, isolated from the API/auth/DB layers, audited via the `capture_sessions` table (who started what, when), and the container exposes no other escalated capability.

**Q13. How do you handle encrypted HTTPS traffic if you call this "Deep Packet Inspection"?**
I'm explicit that this is **metadata-level DPI**, not payload decryption — I classify protocols, ports, packet sizes, and (as a stretch goal) TLS SNI from the unencrypted ClientHello, but I never claim to read encrypted application data, which would require something out of scope like a TLS-terminating proxy.

**Q14. Why a modular monolith instead of microservices for a "production-grade" feel?**
At this scale, microservices would add operational complexity (service discovery, distributed tracing, network hops) without a corresponding benefit. I structured the monolith into clearly bounded modules (capture, detection, alerting, etc.) so each one *could* become a separate service later — I can point to exactly where the seams are.

**Q15. How do you prevent the dashboard itself from leaking sensitive packet data across users?**
Capture sessions are owned by a `user_id`; every query (REST and WebSocket topic) is scoped by session ownership checked against the authenticated principal, and `ROLE_ADMIN` is the only role permitted to see across users.

---

## 22. Potential Technical Challenges & Solutions

| Challenge | Solution |
|---|---|
| High packet volume overwhelms DB writes | Bounded queue + worker pool + JDBC batch inserts + pre-aggregated stats tables |
| Pcap4J needs native libpcap/Npcap, differs across OS | Document setup per OS; in Docker, use a Linux base image with `libpcap-dev` preinstalled |
| Capturing inside Docker's network namespace only sees container-internal traffic | Run the backend container with `network_mode: host` and `cap_add: [NET_RAW, NET_ADMIN]`, or capture on the host and have the app process consume it |
| WebSocket flooding the browser with one message per packet | Server-side throttling — batch + emit at fixed intervals (e.g., 1s) |
| False positives in rule-based detection | Configurable, persisted thresholds; statistical (mean+stddev) rather than fixed cutoffs where possible |
| Distinguishing the monitoring machine's own traffic as noise | Filter/flag loopback and the host's own management traffic separately in the capture filter (BPF expression) |
| Token revocation with stateless JWT | Short-lived access tokens + a refresh-token table that can be invalidated server-side |
| Clock/timestamp precision across capture and DB | Use packet capture timestamps (from Pcap4J, not "time received by app") consistently for ordering and windowing |
| Memory growth from unbounded in-memory structures | Fixed-size ring buffers / sliding windows with periodic eviction, bounded queue capacity |

---

## 23. Deployment Architecture Using Docker

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: netmonitor
      POSTGRES_USER: netmonitor
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports: ["5432:5432"]

  backend:
    build: ./network-monitor-backend
    depends_on: [postgres]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/netmonitor
      JWT_SECRET: ${JWT_SECRET}
    # Live capture requires raw-socket access; host networking + capabilities
    # are scoped ONLY to this container, not the whole stack.
    network_mode: "host"
    cap_add:
      - NET_RAW
      - NET_ADMIN
    privileged: false   # cap_add is sufficient; avoid full --privileged

  frontend:
    build: ./network-monitor-frontend
    ports: ["80:80"]
    depends_on: [backend]

volumes:
  pgdata:
```

- **Backend Dockerfile:** multi-stage — `eclipse-temurin:21-jdk` build stage (Maven build), `eclipse-temurin:21-jre-alpine` (+ `libpcap`) runtime stage, copying only the fat JAR.
- **Frontend Dockerfile:** multi-stage — `node:20-alpine` build stage (`npm run build`), served by `nginx:alpine` with a custom `nginx.conf` that reverse-proxies `/api` and `/ws` to the backend container.
- **Important caveat to state explicitly in your report/demo:** because `network_mode: host` is required for the backend to see real host traffic, the backend and postgres containers communicate over `localhost` in that mode, not the Docker bridge network — this is a deliberate, documented exception, not an oversight, and you should call it out as evidence you understand container networking rather than hide it.
- **Production hardening notes (mention even if you don't implement):** run capture in its own minimal sidecar container so the JVM with business logic isn't the privileged one; put Nginx/Traefik in front for TLS termination; externalize secrets via Docker secrets or a vault rather than `.env` files.

---

## 24. Exact Implementation Order — Day 1 to Completion

**Week 1 — Foundation**
- Day 1: Initialize Git repo, Spring Boot project (Spring Initializr: Web, Security, JPA, PostgreSQL, Validation, WebSocket), React app (Vite).
- Day 2: Design full DB schema on paper/dbdiagram.io; write Flyway `V1__init_schema.sql`.
- Day 3: Implement `User`, `Role` entities + repositories; seed roles via migration.
- Day 4: Implement registration endpoint + BCrypt hashing + validation.
- Day 5: Implement `JwtUtil`, `JwtAuthFilter`, `SecurityConfig` (stateless), login endpoint returning JWT.
- Day 6–7: Postman test suite for auth; write `AuthServiceTest` unit tests; push to GitHub with README skeleton.

**Week 2 — Capture Foundations**
- Day 8: Add Pcap4J dependency; write a standalone `main()` that lists interfaces and prints captured packets to console (no Spring yet) — de-risk the trickiest dependency first.
- Day 9: Wrap that into `NetworkInterfaceService` + `GET /api/interfaces`.
- Day 10–11: Implement `PacketCaptureService` with a dedicated capture thread per session, `CaptureSession` entity/repository, start/stop endpoints.
- Day 12–13: Implement `BlockingQueue` + worker pool skeleton (just log parsed counts, no DB write yet) to validate the producer-consumer pipeline under load.
- Day 14: Verify against Wireshark running simultaneously on the same NIC to sanity-check counts.

**Weeks 3–4 — Parsing & Persistence**
- Implement `ProtocolParserFactory`, `TcpParser`, `UdpParser`, `IcmpParser`, `DnsParser` (TDD: unit tests with raw byte fixtures first).
- Implement `PacketDTO` (Builder pattern) and `Packet` entity/mapping.
- Implement batch JDBC insert path; benchmark with synthetic load (e.g., replay a large sample `.pcap`).
- Implement `GET /api/packets` with filtering + pagination; add DB indexes; verify query plans (`EXPLAIN`).

**Weeks 5–6 — Statistics Engine**
- Implement in-memory counters (`ConcurrentHashMap<String, AtomicLong>`) updated per packet.
- Implement `@Scheduled` flush to `traffic_statistics` / `ip_statistics`.
- Implement all `GET /api/statistics/*` endpoints; write integration tests against a seeded test DB (Testcontainers).

**Weeks 7–8 — Threat Detection**
- Define `ThreatDetectionStrategy` interface + `SlidingWindowCounter`.
- Implement `PortScanDetectionStrategy` first (simplest, most demoable) with unit tests using synthetic traffic patterns.
- Implement `TrafficSpikeDetectionStrategy`, `AbnormalRequestRateStrategy`, `SuspiciousConnectionStrategy`.
- Implement `Alert`/`AlertRule` entities, `AlertService`, `alert_rules` CRUD endpoints.
- Wire `ThreatDetectionEngine` scheduler; verify by simulating a port scan with `nmap` against the monitored host.

**Week 9 — WebSocket Layer**
- `WebSocketConfig` (STOMP, `/ws`, `/topic`), JWT `ChannelInterceptor` for `CONNECT`.
- `DashboardBroadcastService` with 1-second batched emission for packets/stats; immediate emission for alerts.
- Test with a simple HTML/JS STOMP client before touching React.

**Weeks 10–11 — Frontend**
- Auth pages + `AuthContext` + Axios interceptor.
- Dashboard page: stat cards, `ProtocolPieChart`, `TrafficLineChart`, `TopIpsTable`, `LivePacketFeed` wired to `useWebSocket`.
- Packets page with filter bar + paginated table.
- Alerts page with severity badges, acknowledge/resolve actions, rule management form (admin).

**Week 12 — Testing & Hardening**
- Fill out unit/integration test coverage; fix bugs found under sustained load tests.
- Add `GlobalExceptionHandler`, consistent `ApiResponse<T>` envelope across all controllers.
- Security review pass: confirm role checks, CORS config, JWT expiry handling on the frontend.

**Week 13 — Dockerization & Delivery**
- Write backend and frontend Dockerfiles (multi-stage), `docker-compose.yml`, `nginx.conf`.
- Document the `network_mode: host` + `cap_add` capture caveat in the README.
- Record a demo (start capture → live dashboard updates → trigger a simulated port scan → alert appears in real time).
- Finalize architecture diagrams (export this document's ASCII diagrams as proper UML images using draw.io/Lucidchart for the final report).

---

### Closing Note
This blueprint intentionally keeps the system a **well-modularized monolith** rather than over-engineering microservices, because that's the right complexity level to *finish* as a student while still demonstrating the specific things interviewers probe for: concurrency design (producer-consumer, bounded queues), security depth (JWT + RBAC + secured WebSocket), data modeling (normalized schema + pre-aggregation for performance), and an honest understanding of the system's own limitations (privilege scoping, encrypted-traffic boundaries, false-positive tradeoffs). Sections 19–21 are written so you can lift them almost directly into your resume bullet points and interview prep notes.
