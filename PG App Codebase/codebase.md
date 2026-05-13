# codebase.md — Full Codebase Intelligence Report

---

## 1. Project Overview

**What is it?**
A backend API for a **PG (Paying Guest accommodation) discovery and complaint management platform** targeting the Indian student housing market. Students can discover PGs, apply for admission, raise complaints, and track their residency. PG owners manage their own admission queue. Admins manage the full platform — complaints, PG listings, owners, and escalated admissions.

**Problem it solves:** Students living in PGs have no structured accountability mechanism to report issues (food, hygiene, security, management). This platform creates a verified complaint trail that builds a trust score for each PG, helping future students make informed decisions.

**Intended users:**
- **Users / Students** (`role: "user"`) — Browse PGs, apply for admission, raise complaints, track their PG
- **PG Owners** (`role: "pg_owner"`) — Admit/reject applicants, manage their resident list, view complaints about their property
- **Admin** (`role: "admin"`) — Manage PG listings, review complaints, manage escalated admissions, create PG owner accounts

**Architecture type:** Monolithic REST API (Node.js/Express + MongoDB) + one consolidated React/Vite frontend package with mode-based builds (unified app and student PWA).

**Development stage:** Phase 2 (MVP Build) — backend complete, unified frontend complete for all three roles. Notification integrations (Twilio/SendGrid) and production hardening remain.

---

## 2. Build Status

### ✅ Backend — Complete

#### Authentication & Authorization
- [x] `POST /api/auth/register` — email/password registration with bcrypt hashing, role assignment
- [x] `POST /api/auth/login` — credential validation, JWT issuance
- [x] `protect` middleware — JWT verification, `req.user` population
- [x] `allowRoles(...roles)` middleware — RBAC enforcement
- [x] `optionalAuth` middleware — graceful guest/user context switching
- [x] `generateToken(id, role)` utility — 7-day JWT with `{ id, role }` payload

#### PG Discovery & Listings
- [x] `GET /api/pgs` — public listing with filters: `city`, `area`, `gender`, `minPrice`, `maxPrice`, `amenities` (`$all`), `sortBy` (createdAt / trustScore / complaintCount / price), pagination (`page`, `limit`)
- [x] Trust score computation inline in aggregation pipeline: `max(0, verifiedComplaints × 2 − unverifiedComplaints)`
- [x] `GET /api/pgs/:id` — PG detail with parallel fetch: PG doc + complaint stats + verified resident count
- [x] User context injection on detail endpoint (`isVerifiedResident`, `hasAppliedForVerification`) via `optionalAuth`
- [x] Sensitive field exclusion (`owner.phone`, `owner.email`) at query level
- [x] `POST /api/pgs` — admin PG creation with slug uniqueness check
- [x] `PATCH /api/pgs/:id` — admin PG update
- [x] `DELETE /api/pgs/:id` — admin soft delete (`isActive: false`)
- [x] MongoDB indexes: compound `city+area`, `pricing.rent`, `isActive`

#### Complaint System
- [x] `POST /api/complaints` — authenticated complaint creation
- [x] Anti-spam: 15-minute cooldown per `userId + pgId` (HTTP 429 on violation)
- [x] `isVerifiedResident` flag stamped at complaint creation time
- [x] `pgSnapshot` denormalization (`name`, `city`, `area`, `ownerName`) at creation time
- [x] `GET /api/complaints` — admin + pg_owner list with filters: `status`, `pgId`, `verifiedOnly`, pagination; populates `pgId` and `createdBy`. pg_owner endpoint auto-scopes to their `req.user.pgId`.
- [x] `GET /api/complaints/mine` — user/student sees only their own complaints
- [x] `PATCH /api/complaints/:id` — admin status update (pending → approved / rejected) with `adminRemark`
- [x] Event emission on approval: `eventEmitter.emit("complaint.approved", complaint)`
- [x] MongoDB indexes: `{ pgId, createdBy, createdAt }` for anti-spam, `{ pgId, status }` for filter performance

#### Admission System (replaces old residency verification)
- [x] `POST /api/admissions` — user/student submits admission request with optional `moveInNote`; blocked if already has active/pending admission anywhere
- [x] `GET /api/admissions/mine` — user/student fetches their active admission (pending or admitted), populated with PG details
- [x] `GET /api/admissions/pg` — pg_owner fetches admissions for their PG (scoped to `req.user.pgId`), with status filter and pagination
- [x] `GET /api/admissions` — admin fetches all admissions with filters: `status`, `pgId`, `escalated=true`, pagination; sorted by escalatedAt then createdAt
- [x] `PATCH /api/admissions/:id/decide` — pg_owner or admin sets status to `admitted` or `rejected`; owner scoped to their PG
- [x] `PATCH /api/admissions/:id/revoke` — pg_owner or admin revokes an admitted student; sets `revokedAt`/`revokedBy`
- [x] `processedBy` field tracks whether owner or admin made the decision
- [x] `escalatedAt` field marks requests that have been escalated to platform admin (auto-escalation job not yet implemented)

#### Legacy Residency Verification
- [x] `POST /api/verify-residency` — student application (old system, still mounted)
- [x] `PATCH /api/verify-residency/:id` — admin approve/reject
- Note: The active admission flow uses `/api/admissions`. The `/api/verify-residency` routes remain mounted but are not used by the unified frontend.

#### Admin Analytics & Owner Management
- [x] `GET /api/admin/complaints/stats` — global aggregate: total, verified/unverified, pending/approved/rejected complaint counts + `totalAdmitted`, `totalPendingAdmissions`, `escalatedAdmissions`
- [x] `GET /api/admin/complaints/by-pg` — per-PG complaint breakdown sorted by complaint count
- [x] `POST /api/admin/owners` — create a new `pg_owner` account linked to a PG
- [x] `GET /api/admin/owners` — list all `pg_owner` accounts with PG details
- [x] `PATCH /api/admin/owners/:id` — reassign owner's `pgId`
- [x] `PATCH /api/admin/owners/:id/password` — reset owner's password (bypasses old hash via `pre-save` hook)

#### Infrastructure
- [x] Structured JSON logger (`Logger.info`, `.error`, `.warn`, `.event`) — ISO timestamp, level, spread context
- [x] HTTP request logger middleware — method, URL, status, duration, IP, user-agent; level by status code range
- [x] Event-driven architecture: singleton `BackendEventEmitter`, `initializeEventHandlers()` called at startup
- [x] MongoDB connection with `process.exit(1)` on failure
- [x] Global 404 handler, global 500 error handler (stack trace gated on `NODE_ENV === "development"`)

---

### ⚠️ Stubbed — Code Exists but Not Integrated

| Component | File | What's stubbed | What's needed to complete |
|---|---|---|---|
| **Email notifications** | `services/notification.service.js` | `console.log("[EMAIL sent to ...]")` | Replace with SendGrid `sgMail.send(...)` call using `SENDGRID_API_KEY` |
| **WhatsApp notifications** | `services/notification.service.js` | `console.log("[WHATSAPP sent to ...]")` | Replace with Twilio `client.messages.create(...)` call using `TWILIO_*` env vars |
| **Admission escalation** | Not implemented | No scheduled job exists | Add a cron/job that sets `escalatedAt` on PGResidency records that have been pending for N hours without owner action |

---

### ✅ Frontend — Unified App (`frontend/`, default mode, port 5174)

React 18 + Vite + Tailwind CSS. Single app serving all three roles with role-based routing. Mobile-responsive throughout.
Shared code lives in `frontend/src/shared/` and is accessed via the `@shared` path alias across both platforms.

**Public screens**

| Screen | Route | Status |
|---|---|---|
| Landing page (role cards, stats, CTA) | `/` | ✅ Complete |
| Login (role-based redirect after auth) | `/login` | ✅ Complete |
| Register | `/register` | ✅ Complete |

**Admin screens** — sidebar layout (`Layout` + `Sidebar`)

| Screen | Route | Status |
|---|---|---|
| Dashboard (stats, attention banner, PG complaint table) | `/admin` | ✅ Complete |
| Complaints (filter tabs, ReviewModal with approve/reject) | `/admin/complaints` | ✅ Complete |
| PG Management (CRUD, slide-over form, deactivate) | `/admin/pgs` | ✅ Complete |
| Admissions (all admissions, escalation filter, admit/reject/revoke) | `/admin/residency` | ✅ Complete |
| PG Owners (create, reset password, reassign PG) | `/admin/owners` | ✅ Complete |

**User/Student screens** — sticky `UserNavbar`

| Screen | Route | Status |
|---|---|---|
| PG Browse (search, filters, pagination; auto-redirects admitted users) | `/user` | ✅ Complete |
| PG Detail (gallery, pricing, trust stats, Apply/Complaint CTAs) | `/user/pgs/:id` | ✅ Complete |
| Admission Form | `/user/pgs/:id/apply` | ✅ Complete |
| Complaint Form (type, char counter, anon toggle) | `/user/pgs/:id/complaint` | ✅ Complete |
| My PG (admitted resident dashboard + my complaints list) | `/user/my-pg` | ✅ Complete |

**PG Owner screens** — sidebar layout (`OwnerLayout` + `OwnerSidebar` with pending count badge)

| Screen | Route | Status |
|---|---|---|
| Dashboard (stat cards, PG info) | `/pgowner` | ✅ Complete |
| Admissions (filter tabs, admit/reject/revoke with confirm dialog) | `/pgowner/admissions` | ✅ Complete |
| Students (current residents, revoke button) | `/pgowner/students` | ✅ Complete |
| Complaints (read-only view, verified-only filter) | `/pgowner/complaints` | ✅ Complete |

Shared infrastructure: auth context (with admission tracking), axios client with interceptors, Toast notifications, ErrorBoundary, role-based `RequireRole` guard.

---

### ✅ Frontend — Student PWA (`frontend/`, `--mode student`, port 5173)

Built from the same package as the unified app via `npm run dev:student` / `npm run build:student`. Output goes to `dist-student/`. Service worker registered only in student mode. Bundle is ~48% smaller than the unified build because all admin/owner/user-area code is tree-shaken out.

---

### Incomplete / Not Started

#### Notification Integrations
- [ ] SendGrid SDK installation and `sgMail.send()` in `NotificationService`
- [ ] Twilio SDK and `client.messages.create()` in `NotificationService`
- [ ] `SENDGRID_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` env vars

#### CORS Restriction — ⚠️ Required Before Production

Currently `app.js` uses `app.use(cors())` with no options, which allows **all origins**. Before deploying:

```js
app.use(cors({
  origin: [
    'http://localhost:5174',
    'https://your-domain.com',
  ],
  credentials: true,
}))
```

#### Testing
- [ ] No test runner configured
- [ ] No test files exist anywhere

#### DevOps & Production Readiness
- [ ] No Dockerfile or docker-compose
- [ ] No CI/CD pipeline
- [ ] No staging environment config
- [ ] `JWT_SECRET` must be set as a real secret

#### Security Gaps to Close Before Production
- [ ] Restrict `role` field on `registerUser` — prevent self-assignment of `admin` or `pg_owner`
- [ ] Add `{ runValidators: true }` to all `findByIdAndUpdate` calls
- [ ] Whitelist allowed fields in `updatePG` (currently passes raw `req.body`)
- [ ] Add input validation library (Joi, Zod, or express-validator) across all endpoints

---

### Phase Roadmap

```
Phase 1: Prototype                          ✅ DONE
Phase 2: MVP Build
  ├─ Backend APIs                           ✅ COMPLETE
  ├─ Unified Frontend (all three roles)     ✅ COMPLETE
  ├─ Frontend consolidation (shared code)   ✅ COMPLETE (single package, @shared alias)
  ├─ Polish — toasts, mobile, responsive    ✅ COMPLETE
  └─ Notification wiring                    ⚠️  STUBBED (Twilio/SendGrid pending)
Phase 3: Testing                            ❌ NOT STARTED
Phase 4: Launch / Production hardening      ❌ NOT STARTED (CORS, security gaps, DevOps)
```

---

## 3. Tech Stack & Dependencies

### Languages

| Language | Scope |
|---|---|
| **JavaScript (ES2020+)** | Entire codebase — backend uses ES Modules (`import`/`export`), frontend uses JSX (`.jsx`/`.js`, no TypeScript) |

### Backend Frameworks & Libraries

| Package | Version | Usage |
|---|---|---|
| `express` | `^5.2.1` | HTTP server, routing, middleware pipeline |
| `mongoose` | `^9.4.1` | MongoDB ODM — schema definition, validation, aggregation pipeline, population |
| `jsonwebtoken` | `^9.0.3` | JWT generation and verification for stateless auth |
| `bcryptjs` | `^3.0.3` | Password hashing (genSalt, hash, compare) — 10 salt rounds |
| `cors` | `^2.8.6` | Cross-Origin Resource Sharing headers (currently permissive — restrict before prod) |
| `dotenv` | `^17.4.2` | Loads `.env` into `process.env` at startup |
| `nodemon` | `^3.1.14` | Dev auto-reload (`npm run dev`) |

### Frontend Frameworks & Libraries (both apps share same stack)

| Package | Usage |
|---|---|
| `react` + `react-dom` | UI rendering |
| `react-router-dom` v6 | Client-side routing with `<Outlet />` nested routes |
| `axios` | HTTP client; request interceptor (Bearer token), response interceptor (401 → logout) |
| `vite` + `@vitejs/plugin-react` | Build tool and dev server |
| `tailwindcss` + `autoprefixer` + `postcss` | Utility-first CSS; custom `slide-in` animation in both configs |

No TypeScript, no state management libraries (plain useState/useEffect), no component libraries.

### Database & Storage

| Technology | Role |
|---|---|
| **MongoDB** | Primary database (local instance: `127.0.0.1:27017`, db name `pg-app`) |
| **Mongoose** | Schema definition, validation, indexes, aggregation pipelines, `.lean()` optimization |

No Redis, caching layer, migration tooling, or file storage (S3, etc.) is present.

---

## 4. Project Structure

```
PG App Codebase/
├── CLAUDE.md                        # Claude Code guidance file
├── codebase.md                      # This document
├── base_app.md                      # Product context: personas, MVP scope, architecture decisions
├── frontend/                        # Single consolidated Vite package (both platforms)
│   ├── package.json                 # scripts: dev (5174), dev:student (5173), build, build:student
│   ├── vite.config.js               # mode-based outDir + port + @shared alias (target: esnext)
│   ├── tailwind.config.js           # brand orange #FF5A1F, Poppins, slide-in animation
│   ├── .env                         # VITE_API_URL=http://localhost:3000/api
│   ├── index.html                   # single entry point for both modes
│   ├── public/
│   │   ├── manifest.json            # PWA manifest (student mode only)
│   │   └── sw.js                    # Service worker — network-first, never caches /api/
│   └── src/
│       ├── main.jsx                 # Entry: gates SW registration + dynamic platform import
│       ├── index.css                # Poppins import + Tailwind directives
│       ├── shared/                  # @shared alias — code shared by both platforms
│       │   ├── api/
│       │   │   ├── client.js        # axios instance, Bearer interceptor, 401 redirect
│       │   │   ├── auth.js          # login, register
│       │   │   ├── pgs.js           # getPGList, getPGDetails, createPG, updatePG, deletePG
│       │   │   ├── complaints.js    # createComplaint, getComplaints, updateComplaintStatus
│       │   │   ├── admissions.js    # createAdmissionRequest, getMyAdmission, getPGAdmissions,
│       │   │   │                    # getAllAdmissions, decideAdmission, revokeAdmission
│       │   │   ├── admin.js         # getGlobalStats, getStatsByPG
│       │   │   └── owners.js        # getAllOwners, createOwner, updateOwner, resetOwnerPassword
│       │   ├── components/
│       │   │   ├── PGCard.jsx       # basePath prop: '/pgs' (student) or '/user/pgs' (unified)
│       │   │   ├── Toast.jsx        # ToastProvider + useToast()
│       │   │   └── ErrorBoundary.jsx
│       │   └── context/
│       │       └── AuthContext.jsx  # JWT + admission state (isAdmitted, admissionLoaded)
│       └── platforms/
│           ├── unified/             # Loaded when MODE !== 'student'
│           │   ├── App.jsx
│           │   ├── components/
│           │   │   ├── ProtectedRoute.jsx  # RequireRole — checks user.role
│           │   │   ├── Layout.jsx          # Admin sidebar layout
│           │   │   ├── Sidebar.jsx
│           │   │   ├── OwnerLayout.jsx     # Owner sidebar layout (pending badge)
│           │   │   ├── OwnerSidebar.jsx
│           │   │   └── UserNavbar.jsx
│           │   └── pages/
│           │       ├── LandingPage.jsx
│           │       ├── LoginPage.jsx
│           │       ├── RegisterPage.jsx
│           │       ├── DashboardPage.jsx       # admin
│           │       ├── ComplaintsPage.jsx      # admin
│           │       ├── PGManagementPage.jsx    # admin
│           │       ├── AdmissionsPage.jsx      # admin
│           │       ├── OwnersPage.jsx          # admin
│           │       ├── UserDashboardPage.jsx   # user — PG browse
│           │       ├── user/
│           │       │   ├── PGDetailPage.jsx
│           │       │   ├── MyPGPage.jsx
│           │       │   ├── ComplaintFormPage.jsx
│           │       │   └── AdmissionFormPage.jsx
│           │       └── pgowner/
│           │           ├── DashboardPage.jsx
│           │           ├── AdmissionsPage.jsx
│           │           ├── StudentsPage.jsx
│           │           └── ComplaintsPage.jsx
│           └── student-pwa/         # Loaded when MODE === 'student'
│               ├── App.jsx
│               ├── components/
│               │   ├── Navbar.jsx           # ?next= redirect support
│               │   └── ProtectedRoute.jsx   # RequireAuth
│               └── pages/
│                   ├── LoginPage.jsx        # ?next= search param support
│                   ├── RegisterPage.jsx
│                   ├── PGListPage.jsx
│                   ├── PGDetailPage.jsx
│                   ├── MyPGPage.jsx
│                   ├── ComplaintFormPage.jsx
│                   └── AdmissionFormPage.jsx
└── backend/
    ├── package.json
    ├── .env
    ├── server.js
    ├── app.js
    └── src/
        ├── config/
        │   └── db.js
        ├── models/
        │   ├── user.js              # role enum: user|admin|student|pg_owner; pgId for owners
        │   ├── pg.js
        │   ├── Complaint.js
        │   └── pgResidency.js       # Used for both admissions and verified-resident tracking
        ├── controllers/
        │   ├── auth.controller.js
        │   ├── pg.controller.js
        │   ├── complaint.controller.js
        │   ├── admission.controller.js   # New — handles full admission lifecycle
        │   ├── pgResidency.controller.js # Legacy residency verification
        │   └── admin.controller.js       # Stats + PG owner management
        ├── routes/
        │   ├── auth.routes.js
        │   ├── pg.routes.js
        │   ├── complaint.routes.js
        │   ├── admission.routes.js       # New — /api/admissions
        │   ├── pgResidency.routes.js     # Legacy — /api/verify-residency
        │   └── admin.routes.js
        ├── middleware/
        │   ├── auth.middleware.js
        │   └── requestLogger.middleware.js
        ├── services/
        │   ├── logger.service.js
        │   └── notification.service.js
        ├── events/
        │   ├── eventEmitter.js
        │   └── listeners.js
        └── utils/
            └── generateToken.js
```

---

## 5. Architecture & System Design

### High-Level Architecture

The project follows the **MVC pattern** layered with a **Service Layer** and an **Event-Driven decoupling layer** for side effects.

```
┌────────────────────────────────────────────────────────────────────────┐
│                       HTTP CLIENT                                       │
│  Unified App (admin/user/pgowner) port 5174  │  Student PWA port 5173  │
│  frontend/src/platforms/unified/             │  frontend/src/platforms/ │
│                                              │  student-pwa/            │
│              shared: frontend/src/shared/ (@shared alias)               │
└─────────────────────────────┬──────────────────────────────────────────┘
                              │ HTTP Requests
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        EXPRESS APP (app.js)                            │
│                                                                        │
│  cors()  │  express.json()  │  requestLogger                          │
│                                                                        │
│  /api/auth  /api/pgs  /api/complaints  /api/admissions                │
│  /api/verify-residency  /api/admin                                    │
│                                                                        │
│  protect()  allowRoles(...roles)  optionalAuth()                      │
│                                                                        │
│  auth │ pg │ complaint │ admission │ pgResidency │ admin              │
│                                                                        │
│  Mongoose Models  │  Logger  │  EventEmitter → NotificationService    │
└─────────────────────────────┬──────────────────────────────────────────┘
                              ▼
                         MONGODB (27017)
```

### Authentication & Authorization

**Authentication:** Stateless JWT via `Authorization: Bearer <token>` header.

- JWT payload: `{ id: <userId>, role: <role> }`
- Expiration: **7 days**
- Bcrypt: **10 salt rounds**

**Roles and their access:**

| Role | Can do |
|---|---|
| `user` | Browse PGs, submit admission request, submit complaints, view own admission/complaints |
| `student` | Same as `user` (treated identically in current code) |
| `pg_owner` | View/decide/revoke admissions for their PG, view complaints for their PG |
| `admin` | Everything — manage PGs, approve/reject complaints, view all admissions, manage owner accounts |

**`pg_owner` scoping:** Owner accounts have a `pgId` field on the User model. The `getPGAdmissions` controller reads `req.user.pgId` directly — no `pgId` query param needed or trusted from clients. `decideAdmission` and `revokeAdmission` enforce `admission.pgId.equals(req.user.pgId)` for owners.

### API Design

**Style:** REST over HTTP. All responses use a consistent envelope:
```json
{ "success": true|false, "message": "...", "data": {...} }
```

**Pagination envelope** (list endpoints):
```json
{
  "success": true,
  "data": [...],
  "pagination": { "totalItems": N, "currentPage": N, "totalPages": N, "limit": N }
}
```

**Full endpoint table:**

| Method | Path | Middleware | Controller Function |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | `registerUser` |
| `POST` | `/api/auth/login` | — | `loginUser` |
| `GET` | `/api/pgs` | — | `getPGList` |
| `GET` | `/api/pgs/:id` | `optionalAuth` | `getPGDetails` |
| `POST` | `/api/pgs` | `protect, allowRoles("admin")` | `createPG` |
| `PATCH` | `/api/pgs/:id` | `protect, allowRoles("admin")` | `updatePG` |
| `DELETE` | `/api/pgs/:id` | `protect, allowRoles("admin")` | `deletePG` |
| `POST` | `/api/complaints` | `protect` | `createComplaint` |
| `GET` | `/api/complaints/mine` | `protect, allowRoles("user","student")` | `getMyComplaints` |
| `GET` | `/api/complaints` | `protect, allowRoles("admin","pg_owner")` | `getComplaints` |
| `PATCH` | `/api/complaints/:id` | `protect, allowRoles("admin")` | `updateComplaintStatus` |
| `POST` | `/api/admissions` | `protect, allowRoles("user","student")` | `createAdmissionRequest` |
| `GET` | `/api/admissions/mine` | `protect, allowRoles("user","student")` | `getMyAdmission` |
| `GET` | `/api/admissions/pg` | `protect, allowRoles("pg_owner")` | `getPGAdmissions` |
| `GET` | `/api/admissions` | `protect, allowRoles("admin")` | `getAllAdmissions` |
| `PATCH` | `/api/admissions/:id/decide` | `protect, allowRoles("pg_owner","admin")` | `decideAdmission` |
| `PATCH` | `/api/admissions/:id/revoke` | `protect, allowRoles("pg_owner","admin")` | `revokeAdmission` |
| `POST` | `/api/verify-residency` | `protect, allowRoles("student","user")` | `applyForVerification` |
| `PATCH` | `/api/verify-residency/:id` | `protect, allowRoles("admin")` | `manageVerification` |
| `GET` | `/api/admin/complaints/stats` | `protect, allowRoles("admin")` | `getGlobalStats` |
| `GET` | `/api/admin/complaints/by-pg` | `protect, allowRoles("admin")` | `getStatsByPG` |
| `POST` | `/api/admin/owners` | `protect, allowRoles("admin")` | `createPGOwner` |
| `GET` | `/api/admin/owners` | `protect, allowRoles("admin")` | `getAllPGOwners` |
| `PATCH` | `/api/admin/owners/:id` | `protect, allowRoles("admin")` | `updatePGOwner` |
| `PATCH` | `/api/admin/owners/:id/password` | `protect, allowRoles("admin")` | `resetOwnerPassword` |
| `GET` | `/` | — | Health check |

---

## 6. Core Modules & Key Files

### Auth Module
Handles registration and login. `role` can be passed in the request body — there is no server-side restriction preventing self-registration as any role (known security gap). The `pre("save")` bcrypt hook ensures passwords are always hashed. Response shape:
```json
{ "success": true, "data": { "_id", "name", "email", "role", "pgId" }, "token": "<jwt>" }
```

### PG Module
Most complex controller. Key: trust score aggregation, soft delete, sensitive field exclusion, parallel fetch on detail, `optionalAuth` user context injection.

### Complaint Module
Anti-spam cooldown per `userId+pgId` (15 min). `isVerifiedResident` stamped at creation time. `pgSnapshot` denormalizes PG details. Event emitted on approval. `getComplaints` is shared between admin and pg_owner — when called by a pg_owner, the controller reads `req.user.pgId` to scope results automatically.

### Admission Module (`admission.controller.js`, `admission.routes.js`)
The active admission/residency system backed by the `PGResidency` model. Key behaviors:
- A user can only have one active admission at a time (checked across all PGs at creation)
- `decideAdmission` records `processedBy: { role: "owner"|"admin", userId }` for audit
- `revokeAdmission` sets `revokedAt` and `revokedBy` — admission status becomes `"rejected"`
- `getPGAdmissions` (owner route) reads `req.user.pgId` — clients cannot spoof which PG they see
- `getAllAdmissions` (admin route) supports `escalated=true` filter to show only escalated-pending records

### Admin Module
Two analytics endpoints (aggregation pipelines). `getGlobalStats` now returns admission counts: `totalAdmitted`, `totalPendingAdmissions`, `escalatedAdmissions`. Owner management: create, list, reassign PG, reset password. Router-level `protect` + `allowRoles("admin")` covers all routes.

### Event System
Singleton `BackendEventEmitter`. One event registered: `"complaint.approved"` → `NotificationService.notifyPGOwner(complaint)`.

### Frontend — Auth Context (`frontend/src/shared/context/AuthContext.jsx`)
Extended beyond basic JWT storage. On mount (when token is present), fetches `GET /api/admissions/mine` and stores the result in `currentAdmission`. Exposes `isAdmitted` (boolean shorthand) and `admissionLoaded` (prevents flicker while fetching). Non-user roles get `null` admission silently. Used by user-area pages to determine PG admission state without a separate fetch.

---

## 7. Database & Data Models

### User

```
Collection: users
Fields:
  _id          ObjectId (auto)
  name         String (required)
  email        String (required, unique)
  password     String (required, bcrypt-hashed, 10 rounds)
  role         String (enum: ["user","admin","student","pg_owner"], default: "user")
  pgId         ObjectId → PG (default: null — only set for pg_owner accounts)
  createdAt    Date (auto)
  updatedAt    Date (auto)

Instance Method: matchPassword(enteredPassword) → Boolean
Pre-save Hook: hashes password if modified
```

### PG

```
Collection: pgs
Fields:
  _id                          ObjectId (auto)
  name                         String (required)
  slug                         String (required, unique)
  description                  String (required)
  location.city                String (indexed)
  location.area                String (indexed)
  location.state               String
  location.address             String
  location.coordinates.lat/lng Number
  pricing.rent                 Number
  pricing.deposit              Number
  pricing.maintenance          Number
  accommodation.gender         String
  accommodation.roomTypes      [String]
  accommodation.totalCapacity  Number
  amenities                    [String]
  images                       [String] (URLs)
  owner.name                   String
  owner.phone                  String (excluded from public API)
  owner.email                  String (excluded from public API)
  owner.isVerified             Boolean
  createdBy                    ObjectId → User
  isActive                     Boolean (default: true)
  isVerified                   Boolean (default: false)
  createdAt/updatedAt          Date (auto)

Indexes: compound city+area, pricing.rent, isActive
```

### Complaint

```
Collection: complaints
Fields:
  _id                  ObjectId (auto)
  pgId                 ObjectId → PG (required)
  pgSnapshot.name/city/area/ownerName   String (denormalized at creation)
  isVerifiedResident   Boolean (default: false — stamped from PGResidency at creation)
  createdBy            ObjectId → User (required)
  type                 String (enum: food|cleanliness|security|management|other)
  description          String (required, min 5 chars)
  image                String (optional URL, default: null)
  isAnonymous          Boolean (default: false)
  status               String (enum: pending|approved|rejected, default: pending)
  adminRemark          String (default: null)
  createdAt/updatedAt  Date (auto)

Indexes: { pgId, createdBy, createdAt } for anti-spam; { pgId, status } for filters
```

### PGResidency

Used for both the admission workflow and verified-resident tracking (the `isVerifiedResident` flag on complaints is set by checking this collection).

```
Collection: pgresidencies
Fields:
  _id              ObjectId (auto)
  userId           ObjectId → User (required)
  pgId             ObjectId → PG (required)
  status           String (enum: pending|admitted|rejected, default: pending)
  moveInNote       String (optional note from student at application time)
  processedBy.role   String (enum: owner|admin — who admitted/rejected)
  processedBy.userId ObjectId → User
  escalatedAt      Date (null until escalated to platform admin)
  revokedAt        Date (null until revoked)
  revokedBy        ObjectId → User (null until revoked)
  createdAt/updatedAt Date (auto)

Indexes: { userId, pgId }, { pgId, status }, { userId, status }
Note: No unique constraint on userId+pgId — a user can have multiple historical records
      (previous rejections) but only one active (pending/admitted) at a time (enforced in controller)
```

---

## 8. Configuration & Environment

`backend/.env`:

| Variable | Example | Required | Purpose |
|---|---|---|---|
| `MONGO_URI` | `mongodb://127.0.0.1:27017/pg-app` | Yes | MongoDB connection string |
| `PORT` | `3000` | No | HTTP port (fallback: `5000`) |
| `JWT_SECRET` | `<strong-secret>` | Strongly recommended | JWT signing secret (fallback: `"fallback_secret_for_dev"`) |

---

## 9. Testing Strategy

**No tests exist.** No test runner, no test files, no `test` script in `package.json`.

---

## 10. How to Run & Develop Locally

### Prerequisites
- Node.js 18+ (ES Module support required)
- MongoDB running locally on port 27017

### Running the Backend

```bash
cd backend
npm install
# Create backend/.env with MONGO_URI, PORT, JWT_SECRET
npm run dev       # nodemon — auto-restart on changes
```

### Running the Frontend

```bash
cd frontend
npm install
npm run dev           # unified app → http://localhost:5174
npm run dev:student   # student PWA → http://localhost:5173

# Production builds
npm run build         # → dist-unified/
npm run build:student # → dist-student/
```

---

## 11. Known Patterns, Conventions & Rules

### Consistent Patterns

- **Lean queries on read**: `.lean()` on all read-only queries
- **`mongoose.isValidObjectId(id)` guard**: Every controller validates ID path params before querying
- **`Promise.all` for parallel fetches**: Used wherever independent queries can run concurrently
- **Aggregation for computed fields**: Trust scores and stats computed in MongoDB, not JS
- **Consistent response envelope**: `{ success, message, data }` + `pagination` for lists
- **Soft delete**: PGs deactivated (`isActive: false`), never physically removed
- **pgSnapshot pattern**: Complaints snapshot PG details at creation time
- **Owner scoping via `req.user.pgId`**: pg_owner routes never trust client-provided pgId

### Technical Debt & Known Gaps

- **Self-assignable roles**: `registerUser` accepts `role` from request body; no server-side restriction
- **No input validation library**: Manual `if (!field)` checks only
- **`updatePG` accepts raw `req.body`**: No field whitelisting
- **No `runValidators` on updates**: Schema validators bypassed on `findByIdAndUpdate`
- **CORS is fully permissive**: `app.use(cors())` — restrict before production
- **Fallback JWT secret**: `"fallback_secret_for_dev"` hardcoded as fallback in two files
- **No admission auto-escalation**: `escalatedAt` field exists in the schema and is filterable, but no job or trigger sets it automatically

---

## 12. How to Approach This Codebase

### Mental Model

Three user rings, each with their own area:
1. **User ring** (`/user/*`) — browse PGs, apply for admission, raise complaints
2. **Owner ring** (`/pgowner/*`) — decide on admission requests, manage their resident list, read complaints
3. **Admin ring** (`/admin/*`) — platform-level control: PG listings, complaint moderation, owner management, escalated admissions

The unified frontend handles all three via role-based routing in a single React app. After login, `roleRedirect(role)` sends each user to their home path.

### Gotchas & Non-Obvious Behaviors

- **`pg_owner` role uses underscore**: The backend enum is `"pg_owner"` — never `"pgowner"`. The frontend `RequireRole` prop, `LoginPage` redirect, and `RegisterPage` redirect all must use the exact string `"pg_owner"`.
- **Admission and verified-resident are the same model**: `PGResidency` with `status: "admitted"` is what makes a user a "verified resident" for complaint weighting. There is no separate verification step.
- **Trust score only on list endpoint**: `getPGList` computes trust score in aggregation. `getPGDetails` does not — it returns raw counts.
- **`getComplaints` auto-scopes for owners**: When called with a `pg_owner` JWT, the controller reads `req.user.pgId` and adds it to the filter. The client doesn't need to pass `pgId`.
- **Single active admission per user**: Enforced in the controller via `findOne({ userId, status: { $in: ["pending","admitted"] } })`. The database does not enforce this — no unique index.
- **`processedBy` vs `verifiedBy`**: The old `pgResidency` model used `verifiedBy` (admin ID). The new admission model uses `processedBy: { role, userId }` to track whether owner or admin acted.
