# SynPay Dashboard

> **HR–Payroll Integration Dashboard** — a multi-layer system that unifies
> authentication, employee/HR data, and payroll into a single web dashboard.

This repository is a monorepo containing all three layers of the SynPay
Dashboard system. The architectural contract for the project is defined in
[`Agent.md`](./Agent.md) and **must** be followed when contributing.

---

## Architecture

```
[ Next.js Frontend ]
        │
    REST / HTTPS
        │
[ Python FastAPI – Public API Gateway ]
        │
   Internal HTTP
        │
[ Spring Boot – Integration Core Backend ]
        │
┌───────────────┬───────────────┬───────────────┐
│ Auth & Audit  │  SQL Server   │    MySQL      │
│   (MySQL)     │   (HR DB)     │ (Payroll DB)  │
└───────────────┴───────────────┴───────────────┘
```

| Layer | Technology | Directory |
|---|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, Recharts | [`synpay-dashboard-frontend/`](./synpay-dashboard-frontend) |
| Public API Gateway | Python 3, FastAPI, httpx, PyJWT | [`synpay-dashboard-python-api/`](./synpay-dashboard-python-api) |
| Integration Core Backend | Spring Boot 3.4 (Java 17), Spring Security, Spring Data JPA | [`synpay-dashboard-backend/`](./synpay-dashboard-backend) |
| Databases | Auth & Audit (MySQL), HR (SQL Server), Payroll (MySQL) | Managed by Spring Boot only |

Key boundaries (see [`Agent.md`](./Agent.md) for the full contract):

- All business logic, RBAC, JWT issuance, and database access live **exclusively** in Spring Boot.
- The FastAPI gateway is a thin pass-through: schema validation and request forwarding only.
- The Next.js frontend never talks to Spring Boot directly — it calls FastAPI under `/api/**`.

---

## Repository Layout

```
synpay-dashboard/
├── Agent.md                          # System architecture contract (read first)
├── synpay-dashboard-frontend/        # Next.js dashboard UI
│   ├── app/                          # App Router pages (dashboard, employee, payroll, ...)
│   ├── components/                   # Reusable UI components (ui, layout, providers)
│   ├── views/                        # Feature-scoped view modules
│   ├── api/                          # Frontend API client modules per resource
│   ├── hooks/                        # React hooks (data fetching, caching, auth)
│   └── lib/                          # Shared utilities (api-service, auth, utils)
├── synpay-dashboard-python-api/      # FastAPI gateway
│   ├── main.py                       # App entrypoint, middleware, router wiring
│   ├── routes/                       # Route modules per resource
│   ├── spring_client.py              # httpx client for Spring Boot internal APIs
│   ├── security.py                   # Auth helpers (JWT forwarded as opaque token)
│   └── config.py                     # Env-based configuration
└── synpay-dashboard-backend/         # Spring Boot integration core
    ├── pom.xml
    └── src/main/
        ├── java/com/companyx/synpay_dashboard/
        │   ├── controller/           # Internal REST controllers (/internal/**)
        │   ├── service/              # Business logic
        │   ├── repository/           # JPA repositories
        │   ├── entity/, dto/         # Domain and transfer objects
        │   ├── security/             # JWT, auth filters, RBAC
        │   └── config/, exceptions/, utils/
        └── resources/
            ├── application.yaml      # Server, datasource, JPA, JWT config
            └── db/migration/         # SQL schema and seed scripts per database
```

---

## Prerequisites

Before running the stack locally, install the following tools:

- **Node.js** 20+ and npm (for the frontend)
- **Python** 3.10+ and `pip` (for the FastAPI gateway)
- **Java** 17 and Maven Wrapper (bundled — use `./mvnw`)
- **MySQL** 8+ (for the Auth and Payroll databases)
- **Microsoft SQL Server** 2019+ and the ODBC Driver 17 for SQL Server (for the HR database)

---

## Quick Start

The three services are designed to run side-by-side. Start them in this order:
**Spring Boot → FastAPI → Next.js**.

### 1. Prepare the databases

Apply the SQL files in [`synpay-dashboard-backend/src/main/resources/db/migration/`](./synpay-dashboard-backend/src/main/resources/db/migration)
to the matching database:

| File | Target database |
|---|---|
| `DATABASE_SETUP.sql`, `auth_db.sql` | Auth & Audit DB (MySQL) |
| `HUMAN.sql` | HR DB (SQL Server) |
| `payroll.sql` | Payroll DB (MySQL) |
| `V2__*.sql`, `V3__*.sql`, `V4__*.sql` | Applied in order against the relevant DB |

### 2. Spring Boot — Integration Core (`:8080`)

```bash
cd synpay-dashboard-backend
./mvnw spring-boot:run
```

Configuration lives in
[`src/main/resources/application.yaml`](./synpay-dashboard-backend/src/main/resources/application.yaml).
For local development, override the datasource URLs, credentials, and the
`app.jwt.secret` / `app.internal.api-key` values via environment variables or
an external `application-local.yaml` rather than editing the committed file.

### 3. FastAPI — Public API Gateway (`:8000`)

```bash
cd synpay-dashboard-python-api
python -m venv .venv && source .venv/bin/activate
pip install -r requirement.txt

cp .env.example .env   # then fill in real values
uvicorn main:app --reload --port 8000
```

Required environment variables (see
[`.env.example`](./synpay-dashboard-python-api/.env.example) and
[`config.py`](./synpay-dashboard-python-api/config.py)):

| Variable | Purpose |
|---|---|
| `SPRING_BOOT_BASE_URL` | Base URL of the Spring Boot core (default `http://localhost:8080`) |
| `JWT_SECRET` | Shared secret used to read JWT claims for cosmetic purposes |
| `JWT_ALGORITHM` | JWT algorithm (default `HS256`) |
| `JWT_EXPIRATION_MINUTES` | Access token lifetime in minutes |
| `HR_DB_*`, `PAYROLL_DB_*`, `AUTH_DB_*` | Reserved for tooling/diagnostics; the gateway itself does not query DBs |

### 4. Next.js — Frontend (`:3000`)

```bash
cd synpay-dashboard-frontend
npm install
npm run dev
```

Then open <http://localhost:3000>.

The frontend talks to the FastAPI gateway at `/api/**`. If the gateway is not
on the default origin, configure the API base URL where the frontend API
client is initialized (see [`lib/api-service.ts`](./synpay-dashboard-frontend/lib/api-service.ts)).

---

## Common Scripts

### Frontend (`synpay-dashboard-frontend/`)

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |

### Backend (`synpay-dashboard-backend/`)

| Command | Description |
|---|---|
| `./mvnw spring-boot:run` | Run the Spring Boot app |
| `./mvnw clean package` | Build a runnable JAR under `target/` |
| `./mvnw test` | Run unit tests |

### API Gateway (`synpay-dashboard-python-api/`)

| Command | Description |
|---|---|
| `uvicorn main:app --reload --port 8000` | Run the FastAPI app in dev mode |
| `python test_db.py` | Quick connectivity check for configured datasources |

---

## API Conventions

| Direction | Prefix | Example |
|---|---|---|
| Frontend → FastAPI | `/api/**` | `GET /api/employees` |
| FastAPI → Spring Boot | `/internal/**` | `GET /internal/employees` |

- All authenticated endpoints require an `Authorization: Bearer <token>` header.
- FastAPI forwards the JWT unchanged; **only Spring Boot validates it and enforces RBAC**.
- Error responses use consistent HTTP status codes and JSON bodies across both layers.

---

## Authentication Flow

1. The user submits credentials via the frontend.
2. The frontend sends them to FastAPI: `POST /api/auth/login`.
3. FastAPI forwards the request to Spring Boot: `POST /internal/auth/login`.
4. Spring Boot validates credentials against the Auth DB and returns a JWT
   (with `account_id`, `role_code`, `employee_id`, `permission_keys`).
5. FastAPI returns the JWT to the frontend unchanged.
6. The frontend stores the JWT and attaches it to subsequent requests.

The frontend may read `permission_keys` from the JWT solely to toggle UI
visibility — this is **cosmetic only** and never a substitute for the
server-side checks performed by Spring Boot.

---

## Contributing

Before opening a PR, please:

1. Read [`Agent.md`](./Agent.md) and respect the layer boundaries it defines.
2. Place business logic, RBAC, JWT handling, and DB access in Spring Boot only.
3. Keep FastAPI as a thin gateway (schema validation + forwarding).
4. Run `npm run lint` in the frontend and `./mvnw test` in the backend before
   pushing.
5. Follow the existing `/api/**` (public) and `/internal/**` (internal) route
   conventions for any new endpoints.

---

## License

See repository settings for licensing information.
