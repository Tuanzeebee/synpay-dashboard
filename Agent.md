# Agent.md — System Architecture Contract

> **This file is the single source of truth for AI agents working on this project.**
> All code generation, refactoring, and feature implementation **must** conform to the architecture defined here.
> Violations of layer boundaries or responsibility assignments are considered defects.

---

## System Overview

This is a **System Integration** project composed of multiple cooperating layers:

| Layer | Technology | Directory |
|---|---|---|
| Frontend | Next.js (React) | `synpay-dashboard-frontend/` |
| Public API Gateway | Python FastAPI | `synpay-dashboard-python-api/` |
| Integration Core Backend | Spring Boot (Java) | `synpay-dashboard-backend/` |
| Databases | Auth DB · SQL Server (HR) · MySQL (Payroll) | Managed by Spring Boot only |

---

## High-Level Architecture

```
[ Next.js Frontend ]
        │
    REST / HTTPS
        │
[ Python FastAPI – Public API Layer ]
        │
   Internal HTTP
        │
[ Spring Boot – Integration Core Backend ]
        │
┌───────────────┬───────────────┬───────────────┐
│ Auth & Audit  │  SQL Server   │    MySQL      │
│     DB        │   (HR DB)     │ (Payroll DB)  │
└───────────────┴───────────────┴───────────────┘
```

---

## Key Principles

- **Clear separation of concerns** — each layer has a strict, non-overlapping responsibility.
- **No business logic leakage** — business rules live exclusively in Spring Boot.
- **RBAC enforcement happens only in the Integration Core** (Spring Boot).
- **The API Gateway (FastAPI) never makes authorization decisions.**
- **Databases are accessed only by Spring Boot** — no other layer may open a direct DB connection.

---

## Layer Responsibilities

### 1. Frontend — Next.js

**Role:** Presentation layer.

**Allowed:**

- Render UI components and pages.
- Collect and validate user input (client-side form validation only).
- Store the JWT token (e.g., in cookies or `localStorage`).
- Conditionally render UI elements based on permissions **provided by the backend** (e.g., hide a button if the permission key is absent from the token payload or API response).
- Call **only** the FastAPI public endpoints (`/api/**`).

**Forbidden:**

- NEVER enforce RBAC or security rules.
- NEVER call Spring Boot internal APIs directly.
- NEVER contain business logic (calculations, rule evaluation, authorization decisions).
- NEVER access any database.

---

### 2. Python FastAPI — Public API Gateway

**Role:** Thin gateway that exposes public REST APIs to the frontend and delegates all logic to Spring Boot.

**Allowed:**

- Expose public REST API endpoints under `/api/**`.
- Validate **request format and schema** (field types, required fields, payload shape).
- Forward incoming requests to Spring Boot internal APIs (`/internal/**`).
- Forward JWT tokens **without modification** (pass-through in `Authorization` header).
- Aggregate, reshape, or format Spring Boot responses before returning them to the frontend.
- Return appropriate HTTP error codes when Spring Boot is unreachable or returns errors.

**Forbidden:**

- MUST NOT implement RBAC checks or authorization logic.
- MUST NOT generate, decode, or validate JWT tokens (treat them as opaque strings).
- MUST NOT apply business rules or domain logic.
- MUST NOT access any database directly.
- MUST NOT store state beyond what is needed for a single request lifecycle.

---

### 3. Spring Boot — Integration Core Backend

**Role:** Central authority for authentication, authorization, business logic, and data integration.

**Allowed:**

- Authenticate users and generate JWT tokens.
- Enforce RBAC (role-based and permission-based access control).
- Apply all business rules and domain logic.
- Control database transactions.
- Integrate and correlate data across multiple database systems.
- Write audit logs to the Auth & Audit DB.
- Access all databases directly (Auth DB, HR DB, Payroll DB).
- Expose **internal** APIs under `/internal/**`.

**Forbidden:**

- Internal APIs MUST NOT be exposed directly to the frontend.
- MUST NOT serve static assets or render UI.

---

## Authentication & RBAC

### Authentication Flow

1. The user submits credentials via the frontend.
2. The frontend sends a login request to **FastAPI** (`/api/auth/login`).
3. FastAPI forwards the request to **Spring Boot** (`/internal/auth/login`).
4. Spring Boot validates credentials against the Auth DB, generates a **JWT token**, and returns it.
5. FastAPI passes the JWT back to the frontend without modification.
6. The frontend stores the JWT and attaches it to all subsequent requests.

### JWT Token Payload

The JWT token contains (at minimum):

| Claim | Description |
|---|---|
| `account_id` | Unique identifier of the login account |
| `role_code` | Code of the assigned role |
| `employee_id` | Link to the Employee record in HR DB |
| `permission_keys` | List of granted permission identifiers |

### RBAC Rules

- **Only Spring Boot** evaluates role and permission claims.
- FastAPI treats the JWT as an **opaque bearer token** — it forwards it, never inspects it for authorization.
- The frontend may **read** permission keys from the JWT (or from an API response) solely to adjust UI visibility — this is cosmetic, not security enforcement.

---

## User Identity Model

```
┌──────────┐        ┌────────────┐
│ Account  │───────>│  Employee   │
│ (Auth DB)│  FK    │  (HR DB)   │
└──────────┘        └────────────┘
     │
     │ has
     ▼
┌──────────┐       ┌──────────────┐
│   Role   │──────>│  Permission  │
│ (Auth DB)│  M:N  │  (Auth DB)   │
└──────────┘       └──────────────┘
```

- **Account** — represents a login identity (username, password hash, status).
- **Employee** — represents a real person in the HR/Payroll systems.
- **`account.employee_id`** — foreign key linking an Account to an Employee.
- **Role** and **Permission** — part of the Auth DB and logically independent from HR/Payroll data.

---

## Database Responsibilities

### Auth & Audit DB

| Entity | Purpose |
|---|---|
| `Account` | Login credentials and account metadata |
| `Role` | Named roles (e.g., Admin, HR Manager) |
| `Permission` | Granular permission keys (e.g., `payroll.view`) |
| `RolePermission` | Many-to-many mapping of roles to permissions |
| `AuditLog` | Immutable log of security-relevant actions |

### HR DB (SQL Server)

| Entity | Purpose |
|---|---|
| `Employee` | Employee personal and employment data |
| `Department` | Organizational units |
| `Position` | Job titles and position metadata |

### Payroll DB (MySQL)

| Entity | Purpose |
|---|---|
| `Attendance` | Clock-in/out and attendance records |
| `Salary` | Salary structures and compensation data |
| Other | Payroll-related transactional data |

---

## API Design Rules

### Route Conventions

| Direction | Prefix | Example |
|---|---|---|
| Frontend → FastAPI | `/api/**` | `GET /api/employees` |
| FastAPI → Spring Boot | `/internal/**` | `GET /internal/employees` |

### Contract Rules

- **FastAPI public endpoints** mirror the structure of Spring Boot internal endpoints where possible.
- **Spring Boot internal endpoints** must assume the request has already passed through FastAPI but **must still enforce RBAC** on every request.
- All authenticated endpoints require a valid `Authorization: Bearer <token>` header.
- Error responses must use consistent HTTP status codes and JSON error bodies across both layers.

---

## Development Rules for AI Agents

### Before Writing Any Code

1. **Ask: "Which layer am I coding for?"** — Identify whether the change belongs in the frontend, FastAPI, or Spring Boot.
2. **Never mix responsibilities across layers.** If a feature requires logic in multiple layers, implement each part in its correct layer.
3. **If unsure where logic belongs, default to Spring Boot.** Business logic must never leak into FastAPI or the frontend.

### Feature Implementation Checklist

One feature typically requires **two or more** implementations:

| Step | Layer | What to implement |
|---|---|---|
| 1 | **Spring Boot** | Core business logic, RBAC enforcement, database access, internal API endpoint (`/internal/**`) |
| 2 | **FastAPI** | Gateway route (`/api/**`) that forwards to Spring Boot and formats the response |
| 3 | **Frontend** | UI components, API calls to FastAPI, conditional rendering based on permissions |

### Code Review Checklist for Agents

- [ ] No database access outside Spring Boot.
- [ ] No RBAC or authorization logic in FastAPI or the frontend.
- [ ] No JWT generation or validation outside Spring Boot.
- [ ] No direct calls from the frontend to Spring Boot internal APIs.
- [ ] No business rule evaluation in FastAPI.
- [ ] Audit logging is performed in Spring Boot for security-relevant actions.
- [ ] All new endpoints follow the `/api/**` (public) and `/internal/**` (internal) conventions.

---

## Summary of Boundaries

| Concern | Frontend | FastAPI | Spring Boot |
|---|---|---|---|
| Render UI | **Yes** | No | No |
| Schema validation | Client-side only | **Yes** | Yes |
| Forward requests | No | **Yes** | No |
| RBAC enforcement | No | No | **Yes** |
| JWT generation | No | No | **Yes** |
| Business logic | No | No | **Yes** |
| Database access | No | No | **Yes** |
| Audit logging | No | No | **Yes** |
| Transaction control | No | No | **Yes** |

---

> **This document is a strict contract.** Any AI agent generating code for this project must treat these rules as inviolable constraints. When in doubt, re-read this file before proceeding.
