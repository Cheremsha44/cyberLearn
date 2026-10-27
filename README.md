# CyberLearn

CyberLearn is a full-featured, interactive cybersecurity education platform designed for practical application security training. It combines a structured theoretical knowledge base, a robust user progress tracking system, an administrative control panel, and an automated orchestration engine that deploys isolated vulnerable laboratory environments via Docker.

---

## Key Features

- **Isolated Containerized Labs**: Every practical exercise runs inside an isolated Docker container (Node.js or PHP) with its own tailored vulnerability and configuration.
- **Dynamic Orchestration (`labController`)**: The backend automatically manages the container lifecycle—handling startup, port mapping, status monitoring, and resource cleanup.
- **Dynamic Flag System (Anti-Cheat)**: Upon initiating a lab session, a unique flag is generated, recorded in the central database for the specific user and exercise, and injected into the target container environment or database instance.
- **Visual Admin Panel & Dashboard**: A comprehensive management interface to control users, curate training materials, configure exercises, and monitor real-time platform activity.
- **Vulnerability Knowledge Base**: A structured reference catalog detailing critical web security vectors, real-world examples, and remediation strategies.

---

## Tech Stack

### Frontend
- **Core:** React 18, Vite
- **Routing:** React Router with protected route wrappers (`PrivateRoute`, `AdminRoute`)
- **Styling:** Modular CSS, PostCSS, and a custom component-based UI kit
- **API Communication:** Centralized HTTP service architecture (`api.js`, `adminApi.js`, `activityApi.js`)

### Backend
- **Server:** Node.js, Express.js
- **Databases:** 
  - **MySQL:** Primary persistent data storage (users, session history, progress tracking, dynamic flags).
  - **SQLite:** Lightweight template databases (`active_dbs/templates/`) cloned for individual SQL injection labs.
- **Authentication & Security:** JSON Web Tokens (JWT), password hashing, automated password recovery service (`mailService`)
- **File Management:** User avatar uploads and profile asset storage (`uploads/avatars/`)

### Infrastructure & Labs
- **Containerization:** Docker, Docker Compose, Docker API integration
- **Target Runtimes:** Node.js (Express) and PHP micro-services

---

## Architecture & Project Structure

The project follows a clean monorepo layout separating the backend server, client-side application, and containerized lab templates:

```text
cyberLearn/
├── backend/                  # Node.js / Express API server
│   ├── src/
│   │   ├── active_dbs/       # Active and template SQLite databases for labs
│   │   ├── config/           # Database setup, JWT configs, schema migration
│   │   ├── controllers/      # Request handlers (labController, adminController, authController)
│   │   ├── middleware/       # JWT authentication and authorization middleware
│   │   ├── models/           # MySQL database models
│   │   ├── routes/           # REST API route definitions
│   │   └── services/         # Business logic and mail services
│   ├── uploads/avatars/      # User avatar storage
│   └── index.js              # Application entry point
│
├── frontend/                 # React single-page application
│   ├── src/
│   │   ├── components/       # Reusable UI elements, layout components, route guards
│   │   ├── pages/            # View components (Dashboard, Admin, Exercises, Auth)
│   │   └── services/         # API integration modules
│   └── vite.config.js        # Vite bundler configuration
│
└── labs/                     # Isolated container environments
    ├── src/
    │   ├── RCE/              # Remote Code Execution challenge modules
    │   ├── SQL-INJECTION/    # SQL Injection challenge modules
    │   ├── path/             # Path Traversal challenge modules
    │   └── ssti/             # Server-Side Template Injection challenge modules
    ├── docker-compose.yml    # Lab orchestration configurations
    └── init.sql              # Database initialization scripts
```

---

## Lab Orchestration & Flag Workflow

The core integration point between the platform and the execution environment is **`labController.js`**. It coordinates container deployment and secure validation of user achievements.

### Lifecycle & Validation Sequence:

```text
[User Client] --(1. Start Exercise Request)--> [Backend: labController]
                                                     │
     ┌───────────────────────────────────────────────┴──────────────────────────────────────────────┐
     ▼                                                                                              ▼
[MySQL Database]                                                                             [Docker Engine]
(2. Record session metadata &                                                       (3. Spawn isolated container instance,
    generate unique dynamic flag)                                                       inject flag into app/database file)
     │                                                                                              │
     └───────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                                     ▼
[User Client] <--(4. Return target URL & port)───────┘
     │
     ├──(5. Exploit vulnerability & retrieve flag)──> [Isolated Lab Container]
     │
     └──(6. Submit flag for validation)─────────────> [Backend: Compare with stored flag] --> [Success / Progress Updated]
```

1. **Initialization:** The user selects an exercise from the catalog and triggers the lab startup action.
2. **Generation & Persistence:** The backend generates a cryptographically secure unique flag for the session and commits it to MySQL, mapped to the user and exercise IDs.
3. **Deployment & Injection:**
   - For **SQL Injection labs**, a clean SQLite database template from `src/active_dbs/templates/` is copied, with the unique flag written directly into the appropriate table cell.
   - For **RCE, SSTI, and Path Traversal labs**, the flag is injected into the container environment or designated target file during container instantiation.
4. **Interaction:** The user accesses the provisioned container endpoint, analyzes the web application, discovers the vulnerability, and extracts the flag.
5. **Validation:** The user inputs the recovered flag into the platform interface. The backend validates the submission against the record created during initialization. Upon a successful match, user progress is marked complete, and container cleanup routines are executed.

---

## Lab Catalog & Vulnerability Breakdown

The platform includes 14 pre-configured vulnerable laboratory modules across 4 key security domains:

| Category | Lab Module Identifier | Underlying Stack | Vulnerability Description |
| :--- | :--- | :--- | :--- |
| **SQL Injection (SQLi)** | `hidden-data` | PHP + SQLite | Exposing hidden records by manipulating conditional `WHERE` clauses. |
| | `sqli-auth-bypass` | PHP + SQLite | Circumventing authentication mechanisms through SQL injection payloads. |
| | `sqli-blind` | PHP + SQLite | Extracting data via boolean- and conditional-based blind SQL injection. |
| | `union-select` | PHP + SQLite | Leveraging `UNION SELECT` statements to query auxiliary database tables. |
| | `union-select-2` | PHP + SQLite | Advanced multi-column and type-matching `UNION` extraction attack. |
| **Remote Code Execution (RCE)** | `command-injection-simple` | Node.js + Shell | Basic OS command injection vector within a product stock lookup script (`stock_checker.sh`). |
| | `rce-output-redirection` | Node.js + Shell | Blind command execution writing output directly to public web directories. |
| | `rce-time-delays` | Node.js + Shell | Blind RCE detected and exploited through time-based inference (`sleep` commands). |
| **Path Traversal** | `path-traversal-simple` | Node.js | Traversing directory trees using dot-dot-slash (`../`) sequences to read system files. |
| | `path-traversal-absolute` | Node.js | Bypassing relative path restrictions using absolute file paths. |
| | `path-traversal-bypass` | Node.js | Bypassing input sanitization filters via nested or encoded path traversal sequences. |
| **Server-Side Template Injection (SSTI)** | `ssti-simple` | Node.js | Evaluating user input inside server-side template engines. |
| | `ssti-rce` | Node.js | Escalating template injection vulnerabilities to full remote code execution. |
| | `ssti-bypass` | Node.js | Evading template sandbox filters and security restrictions. |

---

## Admin Panel & Visual Management

The administrative interface provides comprehensive oversight capabilities:
- **Student Dashboard (`DashboardPage`):** Provides metrics on completed modules, activity heatmaps (`activityController`), and quick resumption points.
- **Exercise Workspace (`ExerciseTaskPage` / `AssignmentPage`):** Integrates theoretical background, lab container management (Start/Stop controls), and flag submission inputs.
- **Administration Suite (`AdminPage`):** Secured behind dedicated `AdminRoute` guards, allowing management of theory articles, exercise parameters, user privileges, and active container sessions.

---

## Getting Started & Installation

### Prerequisites
Ensure the following tools are installed and available on your system:
- **Node.js** (v18.0.0 or higher)
- **Docker** & **Docker Compose** (with the Docker daemon running)
- **MySQL Server** (local instance or containerized)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cyberLearn
```

### 2. Configure and Run the Backend
```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory with your environment configuration:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=cyberlearn
JWT_SECRET=your_super_secret_jwt_key
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=email_password
```

Start the backend development server (database tables and schemas will initialize automatically):
```bash
npm run dev
```

### 3. Build Lab Docker Images
Navigate to the labs directory and build the container images so the orchestrator can instantiate them on demand:
```bash
cd ../labs
docker-compose build
```

### 4. Configure and Run the Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## Security Notice

> **Important:** The modules located in the `labs/` directory contain **intentionally vulnerable code** (RCE, SQLi, SSTI, LFI). Do not expose this platform to public networks without robust container isolation, network segregation, and proper firewall configurations.