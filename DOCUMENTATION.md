# VulnScan Pro Technical Documentation

## 1. Overview
VulnScan Pro is an enterprise-grade Vulnerability Management web application. It operates as the primary user interface and orchestration layer for the **Agentless Windows Vulnerability Scanner**. It is designed to consume, process, and display vulnerability scans, provide AI-powered false positive reduction, and construct dynamic network topologies without requiring agent installations on target endpoints.

---

## 2. System Architecture

The project follows a decoupled, classic Client-Server architecture:

### 2.1 Backend (Node.js & Express)
- **Role:** REST API server acting as an intermediary between the React Frontend and the underlying Python Scanning Engine.
- **Port:** 3001
- **Storage:** Ephemeral data is logged in memory (`memoryStore.js`), which is synchronously committed to physical disk storage at `data/db.json`. 
- **Core Responsibilities:**
  - Launching and halting Python sub-processes (`scannerService.js`).
  - Analyzing findings and scoring them with an AI signal layer (`fpEngine.js`).
  - Serving data payload routes (`/api/scans`, `/api/vulns`, `/api/dashboard`).
  - Spawning Python PDF generation pipelines (`generate_pdf.py`).

### 2.2 Frontend (React & Vite)
- **Role:** Single Page Application (SPA) providing a dark-theme, high-fidelity UI.
- **Port:** 5173
- **Styling:** Custom vanilla CSS (`variables.css`, `components.css`) avoiding utility frameworks to preserve bespoke cybersecurity aesthetics.
- **Core Responsibilities:**
  - Interfacing with the API using Axios (`api.js`).
  - Rendering force-directed graphs using `react-force-graph-2d` for Topologies.
  - Interactive tables and real-time dashboard visualization via `recharts`.

### 2.3 Scanning Engine (Python)
- **Role:** Core logical engine executing SMB/WMI remote enumeration checks, pulling from CVE databases, and returning raw scan findings.
- **Invocation:** Orchestrated via `cross-spawn` from the Node backend passing CLI string arguments to `Vulnerabilty_Scanner/scanner_cli.py`.

---

## 3. Core Features & Engines

### 3.1 AI False Positive (FP) Engine
The FP Engine reduces alert fatigue by autonomously analyzing discovered CVEs.
- **Location:** `backend/src/services/fpEngine.js`
- **Methodology:** It utilizes a multi-variable point system. Signals include:
  - Exploit availability (e.g., CISA KEV presence).
  - Remediation availability (Patch released = higher FP likelihood if automatic updating is on).
  - Target environment context (e.g., Dev vs. Prod).
- **Thresholds:** Anomalies scoring >70% are suppressed. Analysts can use the *Needs Review (31-69%)* tab to confirm or Override (Mark as Real).

### 3.2 Dynamic Network Topology
The system maps discovered assets dynamically based on their respective collision domains.
- **Location:** `frontend/src/pages/Topology.jsx`
- **Mechanism:** As scans populate `db.json`, the frontend reads the `/api/assets` route. It parses the IP schemas string natively (e.g. `/24` subnets) and automatically instantiates visual "Switch" nodes that bridge the Internet Router Node to individual endpoint Asset Nodes.

### 3.3 Report Generation
VulnScan Pro provides exportable, management-ready audit trails.
- **Location:** `frontend/src/pages/Reports.jsx` & `backend/src/services/generate_pdf.py`
- **Mechanism:**
  - **CSV Exports:** The backend manually flattens the NoSQL `db.json` document store into rigid comma-separated fields.
  - **PDF Exports:** The Node server spawns a child process passing the JSON payload to the `report_generator.py` Python `reportlab` script. Deep parameter mappings match Javascript API nomenclature (`cveId`, `cvss`) into Python's expected `kwargs` (`id`, `cvss_score`).

---

## 4. REST API Overview

Below are the primary HTTP endpoints served by the application:

| Endpoint | Method | Description |
|---|---|---|
| `/api/dashboard` | `GET` | Returns aggregated metrics, total assets, top CVEs, and the global CVSS Risk Score. |
| `/api/scans/start` | `POST` | Dispatches the Python scanner script against a specified CIDR range. |
| `/api/scans/:id/status` | `GET` | Real-time polling endpoint returning scan percentage matching state. |
| `/api/vulns` | `GET` | Returns a serialized list of all ingested vulnerabilities. |
| `/api/fp/:cveId/decide` | `POST` | Modifies the FP engine tracking dict and commits a `false_positive` flag. |
| `/api/assets` | `GET` | Returns an array of target machines enumerating exact OS and Open Ports. |
| `/api/reports/download?type=PDF` | `GET` | Returns a readable data stream initiating a browser file download. |

---

## 5. Directory Structure Overview

```text
web/
├── backend/
│   ├── data/                 # db.json physical persistence
│   ├── src/
│   │   ├── controllers/      # Express route logic definitions
│   │   ├── middleware/       # Error handling and color-coded morgan logging
│   │   ├── routes/           # Express router configuration
│   │   ├── services/         # scannerService, fpEngine, generate_pdf
│   │   └── store/            # memoryStore.js (JSON State bridge)
│   └── server.js             # Main Node entrypoint
└── frontend/
    ├── src/
    │   ├── components/       # Reusable UI (Cards, Badges)
    │   ├── layouts/          # TopBar, SideBar navigations
    │   ├── pages/            # View components (Dashboard, Topology, Settings)
    │   ├── services/         # Global API Axios instance
    │   └── styles/           # CSS design token variables
    ├── index.html            # Vite HTML Root
    └── vite.config.js
```
