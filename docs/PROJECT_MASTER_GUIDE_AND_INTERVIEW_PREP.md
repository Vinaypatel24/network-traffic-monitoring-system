# Deep Packet Inspection & Network Traffic Monitoring System
## Comprehensive Architecture, Source Code Guide & Interview Masterclass

---

## Executive Summary & System Overview

### What is this Project?
The **Network Traffic Monitoring and Deep Packet Inspection (DPI) System** is an enterprise-grade, real-time cybersecurity platform designed to monitor physical and virtual network interfaces, capture raw network frames, parse multi-layer network protocols, persist traffic metrics at high throughput, detect anomalous network security threats via algorithmic heuristics, and stream live forensic telemetry to an interactive web dashboard.

### Core Problem It Solves
Modern corporate networks and data centers handle millions of packets per second. Conventional perimeter firewalls often inspect only shallow 5-tuples (Source IP, Destination IP, Source Port, Destination Port, and Protocol). However, sophisticated attacks—such as stealth port reconnaissance, distributed SYN floods, volumetric data exfiltration, and command-and-control (C2) communication—exploit protocol-level nuances and dynamic patterns.

This system provides **Deep Packet Inspection (DPI)** and **real-time anomaly detection** with:
1. **Zero Hardware Lock-in**: Works with physical Windows/Linux network adapters via kernel drivers and includes a synthetic simulation engine for restricted cloud/container environments.
2. **High-Throughput Backpressure Pipeline**: Decouples kernel packet ingestion from protocol decoding and database writes using bounded ring buffers and asynchronous thread pools.
3. **Stateful Threat Heuristics**: Evaluates sliding time-window counters to identify scanning attacks, connection floods, and traffic spikes in real time.
4. **Instant Forensic Remediation**: Pushes alerts immediately over WebSockets (STOMP) to an interactive analyst dashboard, enabling one-click IP blacklisting and incident triage.

---

## High-Level Architecture & End-to-End Data Flow

```
+---------------------------------------------------------------------------------------------------------+
|                                           PHYSICAL / VIRTUAL NETWORK                                     |
+---------------------------------------------------------------------------------------------------------+
       |                                                                            |
       v (Raw Frames)                                                               v (Synthetic Packets)
+-----------------------+                                                  +------------------------------+
|   Npcap Kernel Driver |                                                  | CaptureSimulationService     |
|   (NDIS 6 / Promisc)  |                                                  | (Multi-attack Generator)     |
+-----------------------+                                                  +------------------------------+
       |                                                                            |
       v (JNA Native Calls)                                                         |
+-----------------------+                                                           |
| Pcap4J Wrapper Layer  |                                                           |
+-----------------------+                                                           |
       |                                                                            |
       v                                                                            |
+-----------------------------------------------------------------------------+     |
| PacketCaptureService (Producer: handle.loop -> ArrayBlockingQueue[50,000])  |     |
+-----------------------------------------------------------------------------+     |
       |                                                                            |
       v (Non-blocking poll by 4 Worker Threads)                                    |
+-----------------------------------------------------------------------------+     |
| ProtocolParserFactory (Dissects: IPv4/v6 -> TCP Flags / UDP / DNS / ICMP)   | <---+
+-----------------------------------------------------------------------------+
       |
       +------------------------------------+------------------------------------+
       |                                    |                                    |
       v (Micro-Batches: 2000 pkts / 500ms) v (Live Batch Stream)                v (1-second Rolling Ticks)
+-------------------------------+ +----------------------------------+ +----------------------------------+
|   PacketBatchRepository       | | ApplicationEventPublisher        | | StatisticsAggregatorService      |
|   (Spring JdbcTemplate Batch) | | (PacketBatchCapturedEvent)       | | (Byte & Packet Rate Counters)   |
+-------------------------------+ +----------------------------------+ +----------------------------------+
       |                                    |                                    |
       v (High-Speed Persistence)           v (Asynchronous Event Consumer)      v (Periodic Drainage)
+-------------------------------+ +----------------------------------+ +----------------------------------+
|   Database (H2 / PostgreSQL)  | | ThreatDetectionEngine            | | DashboardBroadcastService        |
|   - packets                   | | (PortScan, Flood, Spike, Black)  | | (@Scheduled 1000ms)              |
|   - capture_sessions          | +----------------------------------+ +----------------------------------+
|   - traffic_statistics        |                   |                                    |
+-------------------------------+                   v (Alert Generated)                  v (STOMP Over SockJS)
                                  +----------------------------------+                   |
                                  | AlertService / AlertRepository   |                   |
                                  +----------------------------------+                   |
                                                    |                                    |
                                                    v (ThreatDetectedEvent)              |
                                  +----------------------------------+                   |
                                  | DashboardBroadcastService        |                   |
                                  | (/topic/alerts)                  |                   |
                                  +----------------------------------+                   |
                                                    |                                    |
                                                    +------------------+-----------------+
                                                                       |
                                                                       v (STOMP WebSockets)
                                              +----------------------------------------------------+
                                              | React 18 Single Page Application (Vite)            |
                                              | - AppDataContext (Central state & event routing)   |
                                              | - WebSocketService (SockJS + @stomp/stompjs client)|
                                              | - Dashboard.jsx (Real-time Chart.js Canvas)        |
                                              | - Alerts.jsx & ForensicResolveModal.jsx            |
                                              | - Packets.jsx & Blacklist.jsx                      |
                                              +----------------------------------------------------+
```

---

## The Technology Stack: What We Used & Why

### 1. Npcap (Windows Packet Capture Architecture)
- **What it is**: Npcap is the Windows version of the Libpcap packet capture library, operating as an NDIS 6 LightWeight Filter (LWF) driver.
- **Why we need it**: Standard Java socket networking (`java.net.Socket`, `ServerSocket`) only interacts with Layer 4 (Transport) or Layer 7 (Application) payloads addressed specifically to the local machine's IP and port. It cannot see raw Layer 2/3 headers, unhandled protocols, or traffic destined for other network nodes. Npcap puts the Network Interface Card (NIC) into **Promiscuous Mode**, copying every Ethernet frame directly from the physical wire before the operating system's networking stack inspects or drops it.
- **Installation requirement**: Installed on Windows with "WinPcap API-compatible Mode" enabled.

### 2. Pcap4J 1.8.2 & JNA (Java Native Access)
- **What it is**: Pcap4J is a Java library for capturing, creating, and analyzing network packets. It binds Java to native C libraries (`wpcap.dll` on Windows, `libpcap.so` on Linux).
- **Why we chose it**: It eliminates the need to write custom C++ JNI (Java Native Interface) code. Through JNA, Pcap4J directly invokes native pointers and maps C structures (like `pcap_t` and `pcap_pkthdr`) into strongly typed Java classes (`IpV4Packet`, `TcpPacket`, `DnsPacket`).
- **Core API Methods**:
  - `Pcaps.findAllDevs()`: Enumerates all physical and virtual interfaces recognized by the kernel driver.
  - `nif.openLive(snapLen, PromiscuousMode.PROMISCUOUS, timeout)`: Obtains a low-level packet capture handle.
  - `handle.loop(packetCount, packetListener)`: Enters the native blocking packet capture loop.

### 3. Spring Boot 3.3.0 & Java 21
- **Java 21**: Utilizes modern LTS features including Text Blocks (`"""`), pattern matching, enhanced stream operations, and strict memory layout improvements.
- **Spring Boot 3.3.0**:
  - `spring-boot-starter-web`: REST controllers, MVC routing, JSON marshalling via Jackson.
  - `spring-boot-starter-security`: Spring Security 6 stateless filter chain.
  - `spring-boot-starter-data-jpa`: Object-relational mapping (Hibernate 6) for domain entities.
  - `spring-boot-starter-websocket`: STOMP message broker support over SockJS.
  - `spring-boot-starter-validation`: Jakarta Bean Validation (`@NotNull`, `@NotBlank`, `@Size`).

### 4. Database Engine: Dual-Mode H2 & PostgreSQL
- **H2 Database (2.2.x)**:
  - **What it is**: An ultra-fast, in-memory or embedded disk-based SQL database written in pure Java.
  - **Why used in Development (`application-dev.yml`)**: Zero installation overhead. The user does not need to configure or maintain an external PostgreSQL server. It runs embedded with file persistence (`jdbc:h2:file:./data/netmonitor`) and features a built-in web management console (`/h2-console`).
- **PostgreSQL (16.x)**:
  - **Why used in Production/Docker (`application.yml`)**: High-concurrency ACID transactions, robust table partitioning, and partial index support.

### 5. Flyway Database Migrations
- **What it is**: An automated, code-driven database migration tool.
- **How it works**: Tracks schema versioning in a table named `flyway_schema_history`. When the application boots, Flyway scans `src/main/resources/db/migration/` for versioned SQL scripts (`V1__init_schema.sql`, `V2__seed_roles.sql`) and applies any unexecuted migrations before JPA initializes.
- **Dual-Dialect Handling**:
  - `db/migration/` contains PostgreSQL DDL (e.g. `BIGSERIAL`, partial indexes).
  - `db/migration/h2/` contains H2-compliant DDL (e.g. `BIGINT GENERATED BY DEFAULT AS IDENTITY`).

### 6. Spring JdbcTemplate vs. Hibernate/JPA
- **The Design Decision**:
  - Hibernate/JPA is used for entity management where lifecycle events and complex relationships matter (`User`, `Role`, `Alert`, `BlacklistedIp`, `CaptureSession`).
  - **`JdbcTemplate` is used for Packet Ingestion (`PacketBatchRepository`)**: Under a network flood, thousands of packets arrive per second. If Hibernate's `saveAll()` were used, Hibernate would attach every packet to its `PersistenceContext`, perform dirty checks, manage first-level caches, and generate excessive heap allocation, causing Garbage Collection stalls and OutOfMemoryErrors. `JdbcTemplate.batchUpdate()` sends direct parameterized SQL arrays to the JDBC driver buffer with minimal CPU and memory overhead.

### 7. Stateless Authentication: JWT (JJWT 0.12.5) & Refresh Tokens
- **Why Stateless**: REST APIs and distributed microservices scale best when the backend server does not store user session objects in memory (`HttpSession`).
- **Access Token**: Cryptographically signed HMAC-SHA256 JWT containing username, user ID, and authority claims (`ROLE_USER`, `ROLE_ADMIN`). Expiration is short (15 minutes) to minimize exposure if intercepted.
- **Refresh Token**: Stored as a cryptographic SHA-256 hash in the database with a 7-day lifespan. Stored securely and used via `/api/auth/refresh` to issue new access tokens seamlessly.

### 8. WebSockets & STOMP Protocol
- **What STOMP is**: Simple Text Oriented Messaging Protocol. WebSocket provides a raw duplex TCP pipe; STOMP adds application-level semantics (Frames: `CONNECT`, `SUBSCRIBE`, `SEND`, `MESSAGE`).
- **Endpoints**:
  - Connection endpoint: `/ws` (with SockJS fallback for restrictive proxies).
  - `/topic/stats`: Broadcasts a live 1-second aggregated traffic telemetry payload to update UI charts.
  - `/topic/alerts`: Broadcasts instant threat alerts as soon as an anomaly is identified.
- **Security**: Secured using a Spring messaging `ChannelInterceptor` that extracts and validates the Bearer JWT from the STOMP `CONNECT` frame header.

### 9. Frontend Stack: React 18, Vite, Chart.js & Lucide
- **Vite 5**: Fast build tool and development server using native ES Modules.
- **React 18**: Component-based UI with declarative hooks (`useState`, `useEffect`, `useCallback`, `useContext`, `useRef`).
- **Chart.js & react-chartjs-2**: Renders hardware-accelerated HTML5 Canvas charts with high refresh rates without DOM overhead.
- **Lucide React**: Clean, lightweight icon suite for network telemetry visualization.
- **Custom Glassmorphism CSS**: Bespoke dark/light themes, CSS variables, and micro-animations with zero external CSS framework bloat.

---

## Complete Project Directory Map

```
Deep Packet Inspection/
├── .env.example                               # Environment configuration template
├── docker-compose.yml                         # Container orchestration (Backend + Frontend + Postgres)
├── LICENSE                                    # MIT Open Source License
├── README.md                                  # Repository documentation & screenshots
├── USER_GUIDE.md                              # End-user operational manual
├── start.bat                                  # Full system launch script
├── start-backend.bat                          # Standalone backend launch script
├── docs/                                      # Project design documentation & blueprints
│   └── PROJECT_MASTER_GUIDE_AND_INTERVIEW_PREP.md  # (This comprehensive guide)
│
├── network-monitor-backend/                   # Spring Boot 3 Backend
│   ├── pom.xml                                # Maven build definition & dependencies
│   ├── src/main/resources/
│   │   ├── application.yml                    # Production configuration (Postgres default)
│   │   ├── application-dev.yml                # Local development configuration (H2 mode)
│   │   ├── application-docker.yml             # Dockerized container environment
│   │   └── db/migration/                      # Flyway SQL migration scripts
│   │       ├── V1__init_schema.sql            # PostgreSQL schema
│   │       ├── V2__seed_roles.sql             # PostgreSQL initial seed data
│   │       └── h2/                            # H2 database compatible migrations
│   │           ├── V1__init_schema.sql
│   │           └── V2__seed_roles.sql
│   └── src/main/java/com/networkmonitor/
│       ├── NetworkMonitorApplication.java     # Spring Boot application entry point
│       ├── alert/                             # Alerting & Blacklist Domain
│       ├── auth/                              # JWT Authentication & Security Domain
│       ├── capture/                           # Packet Capture, Dissection & Ingestion
│       ├── common/                            # Global exception handling & standard DTOs
│       ├── config/                            # Spring system configurations
│       ├── statistics/                        # Telemetry aggregation & traffic metrics
│       ├── threat/                            # Threat detection engine & heuristic strategies
│       ├── user/                              # User entity & role definitions
│       └── websocket/                         # WebSocket STOMP broadcasting service
│
└── network-monitor-frontend/                  # React 18 + Vite Frontend
    ├── package.json                           # NPM dependencies & scripts
    ├── vite.config.js                         # Vite build & reverse-proxy configuration
    ├── nginx.conf                             # Production web server configuration
    ├── Dockerfile                             # Multi-stage production container build
    ├── src/
    │   ├── main.jsx                           # React DOM mount point
    │   ├── App.jsx                            # Route definition & layout wrapper
    │   ├── index.css                          # Design tokens, variables & glassmorphic styles
    │   ├── components/                        # Reusable UI widgets
    │   │   ├── Layout.jsx                     # Topbar, navigation & theme switcher
    │   │   └── ForensicResolveModal.jsx       # Threat analysis & one-click blacklist modal
    │   ├── context/                           # React Context providers (Global State)
    │   │   ├── AuthContext.jsx                # User session, login, logout, token persistence
    │   │   ├── ThemeContext.jsx               # Dark / Light theme state
    │   │   └── AppDataContext.jsx             # Real-time alert & blacklist store
    │   ├── pages/                             # Route view components
    │   │   ├── Dashboard.jsx                  # Live telemetry, KPI cards, Chart.js graphs
    │   │   ├── Packets.jsx                    # Live packet stream table with filtering
    │   │   ├── Alerts.jsx                     # Security incidents table with forensic triage
    │   │   ├── Blacklist.jsx                  # Blocked IP manager & manual insertion
    │   │   └── Login.jsx                      # Authentication screen with demo quick-login
    │   └── services/                          # Network communication services
    │       ├── api.js                         # Axios HTTP client with silent token refresh
    │       └── WebSocketService.js            # SockJS + STOMP protocol subscription client
```

---

## Detailed File-by-File Breakdown & Code Walkthrough

### 1. Root Orchestration & Build Configuration

#### `pom.xml` (`network-monitor-backend/pom.xml`)
- **Purpose**: Defines Maven dependencies, compiler plugins, and packaging options.
- **Key Dependencies**:
  - `pcap4j-core` & `pcap4j-packetfactory-static` (v1.8.2): Provides raw packet capture capabilities.
  - `jna` (v5.14.0): Java Native Access library required to bind Npcap C dynamic libraries on Windows.
  - `jjwt-api`, `jjwt-impl`, `jjwt-jackson` (v0.12.5): Modern Java JWT library for creating and parsing signed tokens.
  - `springdoc-openapi-starter-webmvc-ui` (v2.5.0): Generates automated OpenAPI 3.0 documentation and interactive Swagger UI at `/swagger-ui.html`.
  - `h2`: Embedded relational database engine.
  - `flyway-core`: Database migration manager.
- **Compiler Configuration**: Wires Lombok and MapStruct annotation processors simultaneously using `lombok-mapstruct-binding` so getters/setters are generated before MapStruct generates DTO mappers.

#### `application.yml` & `application-dev.yml`
- **Purpose**: Centralized application configuration.
- **Profiles**:
  - `application.yml`: Configured for PostgreSQL by default. Sets Hikari connection pool properties (`maximum-pool-size: 10`), Flyway settings, token expiry parameters (Access: 15m, Refresh: 7 days), and buffer sizes (`queue-capacity: 50000`, `worker-threads: 4`, `batch-flush-size: 2000`).
  - `application-dev.yml`: Overrides settings for local developer convenience. Configures H2 file database (`jdbc:h2:file:./data/netmonitor`), enables `/h2-console`, sets migration path to `db/migration/h2`, and configures debug logging.

#### `docker-compose.yml`
- **Purpose**: Launches the multi-tier containerized stack with a single command.
- **Services**:
  1. `postgres`: PostgreSQL 16 database with persistent Docker volume `postgres_data`.
  2. `backend`: Multi-stage Spring Boot container running Java 21 with network host access.
  3. `frontend`: Nginx Alpine container serving optimized static assets and acting as an API/WebSocket reverse proxy.

---

### 2. Backend: Security & Authentication Module

#### `JwtUtil.java` (`auth/security/JwtUtil.java`)
- **What it does**: Manages cryptographic token generation, signing, and parsing.
- **Technical Highlights**:
  - Uses `io.jsonwebtoken.security.Keys.hmacShaKeyFor()` to build a secure secret key from configured environment properties.
  - `generateToken(UserDetails)`: Embeds username, subject, issued-at, expiration timestamp, and user roles into JWT claims.
  - `extractUsername(token)` and `isTokenValid(token, userDetails)`: Extracts claims and validates signature integrity and expiration time.

#### `JwtAuthFilter.java` (`auth/security/JwtAuthFilter.java`)
- **What it does**: An HTTP request interceptor extending `OncePerRequestFilter`.
- **Flow**:
  1. Inspects every incoming HTTP request header for `Authorization: Bearer <token>`.
  2. If present, extracts the token and parses the username via `JwtUtil`.
  3. If valid and no authentication exists in the current thread's `SecurityContextHolder`, loads the user details via `CustomUserDetailsService`.
  4. Instantiates a `UsernamePasswordAuthenticationToken` and attaches it to `SecurityContextHolder.getContext().setAuthentication(auth)`.
  5. Continues the filter chain. If token is absent, public endpoints continue while secured endpoints are stopped by Spring Security with a 401 Unauthorized status.

#### `SecurityConfig.java` (`config/SecurityConfig.java`)
- **What it does**: The central Spring Security 6 policy definition.
- **Key Rules**:
  - Stateless session policy (`SessionCreationPolicy.STATELESS`): Prevents session cookie generation.
  - Disables CSRF (Cross-Site Request Forgery) because the API is stateless and does not rely on browser session cookies.
  - Disables `frameOptions` to allow the H2 console iframe to render in development.
  - Whitelists public paths: `/api/auth/**`, `/ws/**`, `/h2-console/**`, `/swagger-ui/**`, `/api-docs/**`.
  - Secures all other `/api/**` endpoints behind JWT authentication.
  - Configures Cross-Origin Resource Sharing (CORS) to accept requests from development origins (`localhost:5173`).

#### `AuthService.java` & `RefreshTokenService.java` (`auth/service/`)
- **What they do**: Coordinate registration, credential verification, and token rotation.
- **Login Flow**:
  1. Authenticates raw credentials via Spring's `AuthenticationManager` (which checks `BCryptPasswordEncoder` against the stored hash in `users`).
  2. Generates a fresh 15-minute JWT Access Token.
  3. Calls `RefreshTokenService.createRefreshToken(user.getId())`: generates a 64-character random cryptographic token, computes its SHA-256 hash, persists it to the `refresh_tokens` table, and returns the raw token to the client.
- **Refresh Flow**:
  1. Client sends the refresh token to `/api/auth/refresh`.
  2. Service verifies token existence, checks expiration, and ensures it has not been revoked.
  3. Deletes or rotates the old token and issues a new access token.

#### `AuthController.java` (`auth/controller/AuthController.java`)
- **What it does**: Exposes public REST endpoints for the authentication lifecycle.
- **Endpoints**:
  - `POST /api/auth/login`: Accepts credentials, returns `JwtResponse` (tokens, user profile, roles).
  - `POST /api/auth/register`: Creates new user accounts.
  - `POST /api/auth/refresh`: Exchanges a refresh token for a fresh access token.
  - `GET /api/auth/me`: Returns the authenticated user profile.

---

### 3. Backend: Packet Capture & Dissection Module

#### `PacketCaptureService.java` (`capture/service/PacketCaptureService.java`)
- **What it does**: The primary engine for capturing raw traffic from network interface cards.
- **Concurrency Architecture**:
  - **Thread Separation**: The thread executing `handle.loop()` must never perform database I/O or heavy parsing; doing so would back up Npcap's kernel ring buffer and drop packets.
  - **Producer**: Uses a bounded `ArrayBlockingQueue<Packet>(queueCapacity: 50,000)`. When Npcap delivers a packet, the callback executes `queue.offer(packet)`. If the queue is full under extreme load, it drops packets gracefully without blocking the kernel loop.
  - **Consumer Pool**: Spawns an `ExecutorService` with 4 dedicated worker threads running `processQueue()`.
  - **Micro-Batching**: Workers poll packets, decode them via `ProtocolParserFactory`, and aggregate them into an in-memory batch.
  - **Flushing Criteria**: The batch is committed to the database when it reaches `batchFlushSize` (2,000 packets) OR when `batchFlushIntervalMs` (500 ms) has elapsed.
  - **Event Publication**: After batch persistence, publishes a `PacketBatchCapturedEvent` via Spring's `ApplicationEventPublisher` so the threat engine can inspect the traffic without coupling the modules.

#### `CaptureSimulationService.java` (`capture/service/CaptureSimulationService.java`)
- **What it does**: A synthetic traffic and threat generation engine.
- **Why it is essential**: Allows the platform to be showcased and tested in environments without Npcap drivers, administrative permissions, or active network connections.
- **Features**:
  - Emulates normal web browsing (TCP 80/443, DNS 53, ICMP).
  - Automatically simulates attacks at configured intervals:
    - **Port Scanning**: Probes 65 sequential destination ports from a single IP to trigger `PortScanStrategy`.
    - **Abnormal Connection Flood**: Sends 110 rapid TCP SYN packets to port 443 to trigger `AbnormalRateStrategy`.
  - Pushes packets through the exact same database batching, statistics aggregation, and threat detection pipeline as live capture.

#### `CaptureSessionManager.java` (`capture/service/CaptureSessionManager.java`)
- **What it does**: Manages capture session lifecycles and provides **graceful fallback**.
- **Resilience Strategy**:
  When a user starts a session on a physical interface, it attempts to open the hardware handle via `PacketCaptureService`. If this fails (e.g. missing Npcap or insufficient permissions), it logs a warning and automatically switches to `CaptureSimulationService`. This prevents application crashes and ensures demonstrations remain operational.

#### `ProtocolParserFactory.java` & Protocol Parsers (`capture/parser/`)
- **`ProtocolParserFactory.java`**: Acts as an inspection chain. Dissects the Layer 2/3 frame to extract IP addresses and TTL, then evaluates specialized parsers in order:
  1. `DnsParser`: Checks for `DnsPacket` structures, identifies domain lookups, and extracts source/destination ports.
  2. `TcpParser`: Checks for `TcpPacket`. Extracts ports and reads TCP control flags (`SYN`, `ACK`, `FIN`, `RST`, `PSH`, `URG`).
  3. `UdpParser`: Extracts UDP ports.
  4. `IcmpParser`: Extracts ICMP echo requests/replies.
  5. Fallback: Labels unhandled protocols as `OTHER`.
- **Output**: Returns a normalized `PacketDTO`.

#### `PacketBatchRepository.java` (`capture/repository/PacketBatchRepository.java`)
- **What it does**: Handles high-performance persistence of packet records.
- **Implementation**:
  Uses `JdbcTemplate.batchUpdate()` with raw SQL:
  ```sql
  INSERT INTO packets (capture_session_id, src_ip, dst_ip, src_port, dst_port, protocol, packet_size, ttl, tcp_flags, captured_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ```
  Bypasses Hibernate entity state tracking to maximize ingestion throughput.

---

### 4. Backend: Threat Detection Engine Module

#### `ThreatDetectionEngine.java` (`threat/service/ThreatDetectionEngine.java`)
- **What it does**: Orchestrates asynchronous threat analysis for captured traffic.
- **Event-Driven Design**:
  - Annotates `onPacketBatchCaptured(PacketBatchCapturedEvent)` with `@Async("taskExecutor")` and `@EventListener`.
  - Iterates over each packet in the batch against all registered `ThreatDetectionStrategy` beans.
  - **Cooldown Deduplication**: Maintains a `ConcurrentHashMap<String, Long>` storing `alertType:sourceIp`. If an identical alert was generated within the last 5 seconds, it is suppressed to prevent alert fatigue.
  - If valid, persists an `Alert` entity and dispatches a `ThreatDetectedEvent` to notify connected WebSockets.

#### `SlidingWindowCounter.java` (`threat/model/SlidingWindowCounter.java`)
- **What it is**: An algorithmic utility for tracking time-windowed event frequencies.
- **Data Structure**:
  `ConcurrentHashMap<String, Deque<Long>>` where each key maps to a double-ended queue of epoch millisecond timestamps.
- **Algorithm**:
  1. Current timestamp $T_{now}$ is acquired.
  2. The cutoff is computed: $T_{cutoff} = T_{now} - (windowSeconds \times 1000)$.
  3. Stale timestamps older than $T_{cutoff}$ are evicted from the front (`pollFirst()`).
  4. $T_{now}$ is appended to the back (`addLast()`).
  5. The size of the deque returns the precise event count within the sliding window.

#### Threat Strategies (`threat/strategy/`)
1. **`PortScanStrategy.java`**:
   - **Target**: Network reconnaissance probes (e.g. Nmap SYN scans).
   - **Logic**: Tracks distinct destination ports contacted by each source IP. If a source IP hits more than 50 distinct ports within a 10-second window, it triggers a `HIGH` severity `PORT_SCAN` alert.
2. **`AbnormalRateStrategy.java`**:
   - **Target**: SYN Flood DoS and brute-force connection attempts.
   - **Logic**: Monitors TCP packets where flag is `SYN` (without `ACK`) directed at critical service ports (80, 443, 22, 3306, etc.). If connection attempts exceed 100 within 30 seconds, it triggers a `HIGH` severity `ABNORMAL_REQUEST_RATE` alert.
3. **`TrafficSpikeStrategy.java`**:
   - **Target**: Volumetric DDoS or data exfiltration.
   - **Logic**: Tracks packet volume per source IP. Triggers when an IP sends more than 500 packets within a 5-second window.
4. **`SuspiciousConnectionStrategy.java`**:
   - **Target**: Communication with known malicious actors.
   - **Logic**: Compares source and destination IPs against `BlacklistedIpService`. If a match is found, it immediately generates a `CRITICAL` severity `SUSPICIOUS_CONNECTION` alert.

---

### 5. Backend: Statistics & Real-Time WebSocket Module

#### `StatisticsAggregatorService.java` (`statistics/service/StatisticsAggregatorService.java`)
- **What it does**: Maintains thread-safe in-memory rolling metrics using `AtomicLong` and `LongAdder`.
- **Metrics Collected**:
  - Packets per second and bytes per second.
  - Protocol distributions (TCP, UDP, DNS, ICMP, OTHER).
  - Top active IP addresses by packet count and volume.
- **`drainTickStats()`**: Atomically extracts and resets the last second's metrics into `TrafficTickDTO` objects for WebSocket broadcasting.

#### `DashboardBroadcastService.java` (`websocket/service/DashboardBroadcastService.java`)
- **What it does**: Bridges backend event streams to connected frontend clients.
- **Operations**:
  - `@Scheduled(fixedRate = 1000)`: Periodically calls `drainTickStats()` and broadcasts metrics to the `/topic/stats` channel.
  - `@EventListener`: Listens for `ThreatDetectedEvent` and immediately broadcasts the alert to `/topic/alerts`.

#### `WebSocketConfig.java` (`config/WebSocketConfig.java`)
- **What it does**: Configures the STOMP message broker and WebSocket security.
- **Details**:
  - Registers `/ws` endpoint with SockJS fallback.
  - Configures `/topic` as the outgoing message broker prefix and `/app` for incoming application prefixes.
  - **Inbound Channel Interceptor**: Intercepts STOMP `CONNECT` frames, extracts the `Authorization: Bearer <jwt>` header, validates the token, and sets the authenticated principal on the WebSocket session.

---

### 6. Frontend: Application Architecture & State Management

#### `api.js` (`services/api.js`)
- **What it does**: Centralized Axios HTTP client.
- **Features**:
  - Sets base URL to `/api` (proxied in development by Vite, routed in production by Nginx).
  - **Request Interceptor**: Reads JWT from `localStorage` and injects `Authorization: Bearer <token>`.
  - **Response Interceptor (Silent Refresh)**: If an API call returns a 401 Unauthorized status, it pauses, calls `/api/auth/refresh`, updates `localStorage` with the new access token, and retries the original request automatically. If refresh fails, it redirects the browser to `/login`.

#### `WebSocketService.js` (`services/WebSocketService.js`)
- **What it does**: Manages persistent STOMP connections over SockJS.
- **Features**:
  - Instantiates `@stomp/stompjs` `Client` targeting `${window.location.origin}/ws`.
  - Passes the current JWT in `connectHeaders`.
  - Subscribes to `/topic/stats` and `/topic/alerts`.
  - Includes auto-reconnect logic with heartbeat checks (4,000 ms).

#### `AppDataContext.jsx` (`context/AppDataContext.jsx`)
- **What it does**: Provides centralized state management for alerts and blacklisted IPs.
- **Features**:
  - Fetches existing alerts and blacklist records upon login.
  - Connects to `WebSocketService` and merges incoming real-time alerts into state.
  - Provides `resolveAlert(alertId, action, extraPayload)`: Updates local alert state to `RESOLVED` and, if blacklisting is selected, triggers an update to the blacklist collection.
  - Provides `addToBlacklist` and `removeFromBlacklist` actions.

#### `Dashboard.jsx` (`pages/Dashboard.jsx`)
- **What it does**: The central monitoring dashboard view.
- **UI Components**:
  - **Session Controller**: Allows selecting network adapters (or the Virtual Demo Interface) and starting/stopping capture sessions.
  - **Metric KPI Cards**: Displays active throughput (Packets/sec, KB/sec), total traffic volume, and threat counts.
  - **Chart.js Live Telemetry Graph**: A smoothed line chart displaying packet rates over a rolling 30-second window.
  - **Protocol Distribution**: A doughnut chart visualizing protocol ratios.
  - **Recent Incidents**: Shows real-time threat alerts with quick-action links.

#### `ForensicResolveModal.jsx` (`components/ForensicResolveModal.jsx`)
- **What it does**: An interactive forensic triage modal for detected threats.
- **Features**:
  - Displays threat diagnosis, heuristic confidence scores, and target ports.
  - **Action 1: Remediate & Blacklist**: Adds the offending IP to the database blacklist, resolving the alert and ensuring future packets from that IP are blocked.
  - **Action 2: Mark Genuine / False Positive**: Resolves the alert with analyst notes without restricting the IP address.

---

## Deep Packet Inspection (DPI) & Threat Detection Mechanics

### Shallow Packet Filtering vs. Deep Packet Inspection

| Metric / Aspect | Shallow Packet Filtering (Standard Firewall) | Deep Packet Inspection (Our System) |
| :--- | :--- | :--- |
| **Inspection Layer** | Layer 3 & 4 Headers only (IP, Port, Protocol) | Layer 2, 3, 4, and Application Headers/Payloads |
| **Context Window** | Evaluates packets in isolation (Stateless) | Tracks state across rolling time windows (Stateful) |
| **Detection Ability** | Simple rule matching (IP == X, Port == Y) | Heuristics (Port Probing, Flag Combinations, Rate Spikes) |
| **Performance Strategy** | Simple kernel routing table check | Kernel bypass / Ring buffer micro-batching |

### Anatomy of an Inspected TCP Frame
When our system intercepts a packet on the wire, the raw byte array is decoded into protocol layers:

```
+-----------------------------------------------------------------------------------+
| ETHERNET II FRAME HEADER (14 Bytes)                                               |
| Destination MAC (6B) | Source MAC (6B) | EtherType: 0x0800 (IPv4)                |
+-----------------------------------------------------------------------------------+
| IPv4 HEADER (20 Bytes)                                                            |
| Version | IHL | TOS | Total Length | TTL (Time-To-Live) | Protocol: 6 (TCP)        |
| Source IP: 198.51.100.77  ----->  Destination IP: 192.168.1.10                    |
+-----------------------------------------------------------------------------------+
| TCP HEADER (20 Bytes)                                                             |
| Source Port: 48921  ----->  Destination Port: 22 (SSH)                            |
| Sequence Number | Acknowledgment Number | Data Offset                             |
| Flags: [SYN]  (ACK=0, FIN=0, RST=0, PSH=0, URG=0)                                 |
+-----------------------------------------------------------------------------------+
| PACKET PAYLOAD (Application Data)                                                 |
| (Inspected for protocol anomalies or size thresholds)                             |
+-----------------------------------------------------------------------------------+
```

---

## Operational Commands: Run, Test & Debug

### 1. Running the System Locally

#### Prerequisites
- **Java 21 JDK** installed and configured on `PATH`.
- **Node.js** (v18+ or v20+) and **npm**.
- *(Optional for hardware capture)*: **Npcap** installed on Windows.

#### Launching the Backend (H2 Dev Profile)
```powershell
cd "network-monitor-backend"
# Run with development profile using the Maven wrapper or installed Maven:
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```
- Backend starts at: `http://localhost:8080`
- Swagger UI API Documentation: `http://localhost:8080/swagger-ui.html`
- H2 In-Memory Database Web Console: `http://localhost:8080/h2-console`
  - JDBC URL: `jdbc:h2:file:./data/netmonitor;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;NON_KEYWORDS=VALUE`
  - User: `sa`
  - Password: *(leave blank)*

#### Launching the Frontend
```powershell
cd "network-monitor-frontend"
npm install
npm run dev
```
- Frontend starts at: `http://localhost:5173`

#### One-Click Launch
Run the provided batch script in the root directory:
```powershell
.\start.bat
```

### 2. Running via Docker Compose
To run the entire multi-container production stack (PostgreSQL + Backend + Nginx Frontend):
```bash
docker-compose up --build -d
```
- View system logs: `docker-compose logs -f`
- Stop containers: `docker-compose down`

---

## The Technical Interview Masterclass: How to Defend This Project

### 1. Elevator Pitches

#### The 30-Second Elevator Pitch
> *"I built a Real-Time Deep Packet Inspection and Network Threat Monitoring System using Java 21, Spring Boot 3, and React 18. It captures raw network frames directly from physical or virtual network interfaces using Npcap and Pcap4J, parses protocol headers through a high-performance concurrent producer-consumer pipeline, and detects security threats like port scans and connection floods using sliding-window algorithms. Detected threats and live traffic metrics are pushed in real time over WebSockets to an analyst dashboard with one-click IP blacklisting."*

#### The 2-Minute Architectural Pitch
> *"In production networks, monitoring systems face two major challenges: handling high-throughput packet streams without dropping packets, and detecting stealthy, stateful attacks in real time.*
>
> *To address ingestion throughput, I designed a multi-threaded producer-consumer architecture. The native packet capture thread places packets into a bounded ring buffer, decoupling the kernel capture driver from processing. A pool of worker threads parses protocols and persists packets in micro-batches via Spring JdbcTemplate, bypassing Hibernate's entity overhead to maximize write performance.*
>
> *For threat detection, I implemented an event-driven engine using sliding-window counters. It monitors multi-layer heuristics to detect attacks such as port reconnaissance, TCP SYN floods, and volumetric spikes. When a threat is detected, it is deduplicated and pushed via Spring STOMP WebSockets to a React single-page application, where analysts can inspect forensic indicators and remediate threats instantly."*

---

### 2. High-Frequency Interview Questions & Model Answers

#### Q1: How does your application capture packets in Java when Java has no native raw socket API?
**Model Answer:**
> *"Java standard socket libraries operate at Layer 4 (Transport) or Layer 7 (Application) and can only receive traffic addressed specifically to the host after the OS kernel processes it. To capture raw Layer 2/3 frames in promiscuous mode, I used Pcap4J bound to the Npcap kernel driver on Windows.*
>
> *Pcap4J uses Java Native Access (JNA) to bridge Java to native C libraries (`wpcap.dll`). It invokes functions like `pcap_open_live` and `pcap_loop`, which copy frames directly from the kernel network buffer into user space memory, mapping them into structured Java objects."*

#### Q2: How do you prevent packet drops when network traffic spikes?
**Model Answer:**
> *"I implemented a decoupled producer-consumer architecture with backpressure handling in `PacketCaptureService`:*
>
> 1. *The capture loop thread only places raw packets into a bounded `ArrayBlockingQueue` with a capacity of 50,000 packets using non-blocking `offer()` operations.*
> 2. *A dedicated thread pool of worker threads pulls from this queue, parses headers, and accumulates packets into micro-batches.*
> 3. *Database writes are committed in batches of 2,000 packets or every 500 ms using `JdbcTemplate.batchUpdate()`. This minimizes database round-trips and keeps processing latency low."*

#### Q3: Why did you use Spring JdbcTemplate instead of Hibernate/JPA for packet ingestion?
**Model Answer:**
> *"Hibernate is an Object-Relational Mapping framework that provides entity lifecycle tracking, dirty checking, first-level caching, and proxy generation. For high-volume packet streams—which can reach thousands of packets per second—creating and managing Hibernate entity states would overwhelm the JVM heap and cause frequent Garbage Collection pauses.*
>
> *By using Spring's `JdbcTemplate.batchUpdate()`, we send parameterized SQL arrays directly over the JDBC connection buffer. This reduces heap allocations and provides significantly higher write throughput. We reserve JPA for entities where relationship mapping and lifecycle tracking are valuable, such as `User`, `Alert`, and `CaptureSession`."*

#### Q4: How does your Sliding Window Counter algorithm work for threat detection?
**Model Answer:**
> *"Our `SlidingWindowCounter` provides rolling time-window frequency tracking. It uses a `ConcurrentHashMap` where each key (such as an IP address) maps to a `Deque` of timestamps:*
>
> 1. *When an event occurs, we calculate a cutoff time equal to `now - windowSeconds`.*
> 2. *We evict timestamps older than the cutoff from the front of the deque using `pollFirst()`.*
> 3. *We append the current timestamp to the back of the deque.*
> 4. *The resulting size of the deque represents the exact event count within that rolling window.*
>
> *This structure allows us to track rates—such as distinct port probes within 10 seconds—accurately without requiring periodic batch aggregation jobs."*

#### Q5: How do you handle alert fatigue and deduplication in the Threat Engine?
**Model Answer:**
> *"When a network attack occurs, thousands of packets matching the attack signature may arrive per second. If an alert were generated for every packet, the database and UI would be overwhelmed.*
>
> *To prevent this, `ThreatDetectionEngine` maintains a concurrent cooldown cache using composite keys (`alertType:sourceIp`). When an alert triggers, the engine records the timestamp. Any subsequent detections for the same key within a 5-second window are suppressed. This ensures the dashboard receives an immediate alert without flooding analysts with duplicate notifications."*

#### Q6: How does the WebSocket architecture function, and how is it secured?
**Model Answer:**
> *"We use STOMP over SockJS via Spring's `spring-boot-starter-websocket`. STOMP introduces a publish/subscribe model on top of the bidirectional WebSocket connection.*
>
> *The backend broadcasts live metrics to `/topic/stats` every second and pushes threat events to `/topic/alerts`. On the frontend, `@stomp/stompjs` subscribes to these channels.*
>
> *To secure the connection, we implemented a Spring `ChannelInterceptor` in `WebSocketConfig`. During the STOMP `CONNECT` handshake, it intercepts the frame, extracts the Bearer token from the `Authorization` header, validates the JWT, and sets the authenticated user principal in the WebSocket session context."*

#### Q7: How does your authentication model work, including token refresh?
**Model Answer:**
> *"We use a stateless JWT architecture with dual-token rotation:*
>
> 1. *When a user logs in, the server generates a short-lived Access Token (15-minute validity) signed with HMAC-SHA256, alongside a cryptographically secure random Refresh Token (7-day validity) stored in the database.*
> 2. *The client includes the access token in the `Authorization: Bearer` header of API requests.*
> 3. *If the access token expires, an Axios response interceptor intercepts the 401 response, calls `/api/auth/refresh`, obtains a new access token, updates local storage, and transparently retries the original request."*

#### Q8: How would you scale this system to handle 10 Gbps enterprise traffic?
**Model Answer:**
> *"To scale this architecture to enterprise multi-gigabit traffic rates:*
>
> 1. * **Kernel Bypass Ingestion**: Replace standard Libpcap/Npcap with kernel-bypass frameworks like DPDK (Data Plane Development Kit) or Linux AF_XDP/eBPF to read packets directly from NIC ring buffers into user-space memory.*
> 2. * **Distributed Messaging**: Introduce Apache Kafka between packet capture agents and detection engines, partitioning streams by IP hash for horizontal scalability.*
> 3. * **Time-Series Storage**: Migrate packet storage from standard relational tables to distributed time-series or columnar databases such as ClickHouse or TimescaleDB.*
> 4. * **Distributed Sliding Windows**: Shift sliding window state tracking from in-memory JVM structures to a distributed Redis cluster using sorted sets (ZSET)."*

---
*Document prepared for project defense, architectural review, and technical interview readiness.*
