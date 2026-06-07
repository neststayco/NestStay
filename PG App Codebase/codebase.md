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

**Development stage:** Phase 2 (MVP Build) — backend complete, unified frontend complete for all three roles. SMTP notification wiring and production hardening remain.

---

## 2. Build Status

### ✅ Backend — Complete

#### Authentication & Authorization
- [x] `POST /api/auth/register/initiate` — send OTP to email, store hashed OTP in `OTP` collection (5 min TTL)
- [x] `POST /api/auth/register/verify` — verify OTP, create `User`, issue access + refresh tokens
- [x] `POST /api/auth/login` — credential validation, bcrypt compare, issue access (15 min) + refresh (7 day) tokens
- [x] `POST /api/auth/logout` — clears refresh token cookie + invalidates stored hash on User
- [x] `POST /api/auth/refresh` — validates refresh token cookie, rotates both tokens
- [x] `POST /api/auth/forgot-password/initiate` — sends OTP to registered email
- [x] `POST /api/auth/forgot-password/verify` — verifies OTP, issues short-lived reset token
- [x] `POST /api/auth/reset-password` — validates reset token, updates password hash
- [x] `GET /api/auth/me` — returns current user from `req.user` (requires `protect`)
- [x] `protect` middleware — verifies access JWT, populates `req.user`
- [x] `allowRoles(...roles)` middleware — RBAC enforcement
- [x] `optionalAuth` middleware — graceful guest/user context switching
- [x] Per-route rate limiting: `loginLimiter`, `refreshLimiter`, `registerInitiateLimiter`, `registerVerifyLimiter`, `forgotInitiateLimiter`, `forgotVerifyLimiter`, `resetPasswordLimiter`

#### PG Discovery & Listings
- [x] `GET /api/pgs` — public listing with filters: `search` (MongoDB `$text`), `city`, `area`, `gender`, `minPrice`, `maxPrice`, `amenities` (`$all`), `sortBy` (createdAt / trustScore / complaintCount / price), pagination (`page`, `limit`)
- [x] Trust score computation inline in aggregation pipeline: `max(0, verifiedComplaints × 2 − unverifiedComplaints)`
- [x] `GET /api/pgs/:id` — PG detail with parallel fetch: PG doc + complaint stats + verified resident count
- [x] User context injection on detail endpoint (`isVerifiedResident`, `hasAppliedForVerification`) via `optionalAuth`
- [x] Sensitive field exclusion (`owner.phone`, `owner.email`) at query level
- [x] `POST /api/pgs` — admin PG creation with slug uniqueness check
- [x] `PATCH /api/pgs/:id` — admin PG update
- [x] `DELETE /api/pgs/:id` — admin soft delete (`isActive: false`)
- [x] `PATCH /api/pgs/my/details` — pg_owner updates description, pricing, amenities
- [x] `PATCH /api/pgs/my/images` — pg_owner replaces image URL array
- [x] `PATCH /api/pgs/my/location` — pg_owner updates map coordinates
- [x] `PATCH /api/pgs/my/capacity` — pg_owner updates total capacity
- [x] MongoDB indexes: compound `city+area`, `pricing.rent`, `isActive`, text index on `name + description + amenities + location.area`

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
- [x] `POST /api/admissions` — user submits admission request with optional `moveInNote`; blocked if already has active/pending admission anywhere
- [x] `GET /api/admissions/mine` — user fetches their active admission (pending or admitted), populated with PG details
- [x] `POST /api/admissions/:id/withdraw` — user withdraws their own pending admission
- [x] `POST /api/admissions/owner-add` — pg_owner manually admits a resident directly (bypasses pending flow)
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

#### Testimonial System
- [x] `GET /api/testimonials/featured` — public, top 6 by rating (approved + visible, all PGs) — used by landing page
- [x] `GET /api/testimonials?pgId=` — public, approved + visible testimonials for a specific PG
- [x] `POST /api/testimonials` — user submits testimonial; requires `status: "admitted"` PGResidency; one per user per PG; goes to owner for review
- [x] `GET /api/testimonials/mine` — user sees their own testimonials (any status)
- [x] `GET /api/testimonials/pg` — pg_owner sees all testimonials for their PG, paginated, filterable by status
- [x] `PATCH /api/testimonials/:id` — pg_owner approves/rejects/toggles visibility; auto-hides on reject; admin can also update
- [x] `GET /api/testimonials/admin` — admin sees all testimonials across all PGs, paginated, filterable by pgId + status
- [x] `Testimonial` model: `pgId`, `pgSnapshot`, `createdBy`, `content`, `rating (1–5)`, `status (pending/approved/rejected)`, `isVisible`, `isVerifiedResident`; unique index on `pgId + createdBy`

#### Admin Analytics, Owner & User Management
- [x] `GET /api/admin/users` — paginated list of `user` role accounts; search by name/email; role filter
- [x] `PATCH /api/admin/users/:id/deactivate` — sets `isActive: false`, clears `refreshToken`; prevents self-deactivation
- [x] `GET /api/admin/complaints/stats` — global aggregate: total, verified/unverified, pending/approved/rejected complaint counts + `totalAdmitted`, `totalPendingAdmissions`, `escalatedAdmissions`
- [x] `GET /api/admin/complaints/by-pg` — per-PG complaint breakdown sorted by complaint count
- [x] `POST /api/admin/owners` — create a new `pg_owner` account linked to a PG
- [x] `GET /api/admin/owners` — list all `pg_owner` accounts with PG details
- [x] `PATCH /api/admin/owners/:id` — reassign owner's `pgId`
- [x] `PATCH /api/admin/owners/:id/password` — reset owner's password (bypasses old hash via `pre-save` hook)

#### Infrastructure
- [x] Structured JSON logger (`Logger.info`, `.error`, `.warn`, `.event`) — ISO timestamp, level, spread context
- [x] HTTP request logger middleware — method, URL, status, duration, IP, user-agent; level by status code range
- [x] `GET /health` — returns `{ status, uptime, version, environment, timestamp }`
- [x] Helmet — sets secure HTTP headers
- [x] CORS — `ALLOWED_ORIGINS` env var (comma-separated), no wildcard
- [x] Global rate limiter (`generalLimiter`) on all `/api/*` routes
- [x] Per-endpoint auth rate limiters (`loginLimiter`, `refreshLimiter`, OTP limiters)
- [x] `OTP` model — stores hashed OTPs with 5-min TTL (`expireAt` index)
- [x] `otpUtils.js` — generates and verifies OTPs; bcrypt-hashed storage
- [x] `tokenUtils.js` — access + refresh JWT generation and verification
- [x] ImageKit integration — `imagekit.service.js`, `imagekit.controller.js`, auth-token endpoint for SDK uploads
- [x] Event-driven architecture: singleton `BackendEventEmitter`, `initializeEventHandlers()` called at startup (no active listeners)
- [x] MongoDB connection with `process.exit(1)` on failure
- [x] Global 404 handler, global 500 error handler (stack trace gated on `NODE_ENV === "development"`)

---

### ⚠️ Stubbed — Code Exists but Not Integrated

| Component | File | What's stubbed | What's needed to complete |
|---|---|---|---|
| **Email (OTP)** | `services/notification.service.js` | Logs OTP to console when SMTP not configured | Set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL` env vars |
| **Admission escalation** | Not implemented | No scheduled job exists | Add a cron/job that sets `escalatedAt` on PGResidency records pending for N hours without owner action |

---

### ✅ Frontend — Unified App (`frontend/`, default mode, port 5174)

React 18 + Vite + Tailwind CSS. Single app serving all three roles with role-based routing. Mobile-responsive throughout.
Shared code lives in `frontend/src/shared/` and is accessed via the `@shared` path alias across both platforms.

**Public screens**

| Screen | Route | Status |
|---|---|---|
| Landing page (live PG cards + testimonials from API) | `/` | ✅ Complete |
| Login (role-based redirect after auth) | `/login` | ✅ Complete |
| Register (OTP email verification flow) | `/register` | ✅ Complete |
| Forgot Password (OTP → reset) | `/forgot-password` | ✅ Complete |

**Admin screens** — sidebar layout (`Layout` + `Sidebar`)

| Screen | Route | Status |
|---|---|---|
| Dashboard (stats, attention banner, PG complaint table) | `/admin` | ✅ Complete |
| Complaints (filter tabs, ReviewModal with approve/reject) | `/admin/complaints` | ✅ Complete |
| PG Management (CRUD, slide-over form, deactivate) | `/admin/pgs` | ✅ Complete |
| Admissions (all admissions, escalation filter, admit/reject/revoke) | `/admin/residency` | ✅ Complete |
| PG Owners (create, reset password, reassign PG) | `/admin/owners` | ✅ Complete |
| Testimonials (approve/reject/visibility across all PGs) | `/admin/testimonials` | ✅ Complete |
| Users (list user accounts, deactivate) | `/admin/users` | ✅ Complete |

**User screens** — sticky `UserNavbar`

| Screen | Route | Status |
|---|---|---|
| PG Browse (keyword search + filters + pagination; pending admission banner with withdraw) | `/user` | ✅ Complete |
| PG Detail (gallery, pricing, trust stats, Apply/Complaint CTAs) | `/user/pgs/:id` | ✅ Complete |
| Admission Form | `/user/pgs/:id/apply` | ✅ Complete |
| Complaint Form (type, char counter, anon toggle) | `/user/pgs/:id/complaint` | ✅ Complete |
| My PG (admitted resident dashboard + my complaints list) | `/user/my-pg` | ✅ Complete |

**PG Owner screens** — sidebar layout (`OwnerLayout` + `OwnerSidebar` with pending count badge)

| Screen | Route | Status |
|---|---|---|
| Dashboard (stat cards, PG info) | `/pgowner` | ✅ Complete |
| Admissions (filter tabs, admit/reject/revoke with confirm dialog) | `/pgowner/admissions` | ✅ Complete |
| Residents (current residents, revoke button) | `/pgowner/residents` | ✅ Complete |
| Complaints (read-only view, verified-only filter) | `/pgowner/complaints` | ✅ Complete |
| Testimonials (approve/reject/visibility for own PG) | `/pgowner/testimonials` | ✅ Complete |
| Photos (image gallery management via ImageKit) | `/pgowner/photos` | ✅ Complete |
| Location (map coordinates update) | `/pgowner/location` | ✅ Complete |
| Capacity (total beds update) | `/pgowner/capacity` | ✅ Complete |
| Details (description, pricing, amenities) | `/pgowner/details` | ✅ Complete |

Shared infrastructure: auth context (with admission tracking), axios client with interceptors, Toast notifications, ErrorBoundary, role-based `RequireRole` guard.

---

### ✅ Frontend — Student PWA (`frontend/`, `--mode student`, port 5173)

Built from the same package as the unified app via `npm run dev:student` / `npm run build:student`. Output goes to `dist-student/`. Service worker registered only in student mode. Bundle is ~48% smaller than the unified build because all admin/owner/user-area code is tree-shaken out.

---

### Incomplete / Not Started

#### Production Config
- [ ] Set `JWT_ACCESS_SECRET` + `JWT_REFRESH_SECRET` as real secrets in prod
- [ ] Configure SMTP vars (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`)
- [ ] Set `ALLOWED_ORIGINS` to deployed domain(s)

#### Testing
- [ ] No test runner configured
- [ ] No test files exist anywhere

#### DevOps & Production Readiness
- [ ] No Dockerfile or docker-compose
- [ ] No CI/CD pipeline
- [ ] No staging environment config

#### Security Gaps to Close Before Production
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
  └─ Notification wiring                    ⚠️  SMTP env vars needed in prod (dev: console log)
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
│       │   │   ├── client.js        # axios instance, Bearer interceptor, silent refresh on 401
│       │   │   ├── auth.js          # login, register (OTP), logout, refresh, forgot-password, reset-password
│       │   │   ├── pgs.js           # getPGList, getPGDetails, createPG, updatePG, deletePG, updateMyPGDetails
│       │   │   ├── complaints.js    # createComplaint, getComplaints, updateComplaintStatus
│       │   │   ├── admissions.js    # createAdmissionRequest, getMyAdmission, withdrawAdmission,
│       │   │   │                    # getPGAdmissions, getAllAdmissions, decideAdmission, revokeAdmission
│       │   │   ├── admin.js         # getGlobalStats, getStatsByPG, getAllUsers, deactivateUser
│       │   │   ├── owners.js        # getAllOwners, createOwner, updateOwner, resetOwnerPassword
│       │   │   ├── testimonials.js  # getPublicTestimonials, getFeaturedTestimonials, createTestimonial,
│       │   │   │                    # getMyTestimonials, getOwnerTestimonials, updateTestimonial, getAdminTestimonials
│       │   │   └── imagekit.js      # getImageKitAuth (auth token for SDK uploads)
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
│           │       ├── ForgotPasswordPage.jsx
│           │       ├── DashboardPage.jsx           # admin
│           │       ├── ComplaintsPage.jsx          # admin
│           │       ├── PGManagementPage.jsx        # admin
│           │       ├── AdmissionsPage.jsx          # admin
│           │       ├── OwnersPage.jsx              # admin
│           │       ├── AdminTestimonialsPage.jsx   # admin
│           │       ├── AdminUsersPage.jsx          # admin
│           │       ├── UserDashboardPage.jsx       # user — PG browse
│           │       ├── user/
│           │       │   ├── PGDetailPage.jsx
│           │       │   ├── MyPGPage.jsx
│           │       │   ├── ComplaintFormPage.jsx
│           │       │   └── AdmissionFormPage.jsx
│           │       └── pgowner/
│           │           ├── DashboardPage.jsx
│           │           ├── AdmissionsPage.jsx
│           │           ├── StudentsPage.jsx
│           │           ├── ComplaintsPage.jsx
│           │           ├── TestimonialsPage.jsx
│           │           ├── PhotosPage.jsx
│           │           ├── LocationPage.jsx
│           │           ├── CapacityPage.jsx
│           │           └── DetailsPage.jsx
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
        │   ├── user.js              # role enum: user|admin|student|pg_owner; pgId, refreshToken, isActive
        │   ├── pg.js                # text index on name+description+amenities+location.area
        │   ├── Complaint.js
        │   ├── pgResidency.js       # admissions + verified-resident tracking
        │   ├── Testimonial.js       # unique index on pgId+createdBy
        │   └── OTP.js               # hashed OTPs with expireAt TTL index
        ├── controllers/
        │   ├── auth.controller.js   # OTP register, login, logout, refresh, forgot-password, reset-password, me
        │   ├── pg.controller.js
        │   ├── complaint.controller.js
        │   ├── admission.controller.js
        │   ├── testimonial.controller.js
        │   ├── imagekit.controller.js
        │   ├── pgResidency.controller.js # Legacy residency verification
        │   └── admin.controller.js       # Stats + owner management + user management
        ├── routes/
        │   ├── auth.routes.js
        │   ├── pg.routes.js
        │   ├── complaint.routes.js
        │   ├── admission.routes.js
        │   ├── testimonial.routes.js
        │   ├── imagekit.routes.js
        │   ├── pgResidency.routes.js     # Legacy — /api/verify-residency
        │   └── admin.routes.js
        ├── middleware/
        │   ├── auth.middleware.js
        │   └── requestLogger.middleware.js
        ├── services/
        │   ├── logger.service.js
        │   ├── notification.service.js   # SMTP via nodemailer; logs OTP to console when unconfigured
        │   └── imagekit.service.js
        ├── events/
        │   ├── eventEmitter.js
        │   └── listeners.js              # initializeEventHandlers() — no active listeners
        ├── jobs/
        │   └── escalation.job.js         # Placeholder — auto-escalation not yet active
        └── utils/
            ├── otpUtils.js               # OTP generation, bcrypt hash/verify
            └── tokenUtils.js             # JWT access + refresh token generation/verification
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

**Authentication:** Access + refresh token pair.

- Access token: `Authorization: Bearer <token>` header; payload `{ id, role }`; **15 min expiry** (`JWT_ACCESS_SECRET`)
- Refresh token: HttpOnly cookie (`refreshToken`); **7 day expiry** (`JWT_REFRESH_SECRET`); stored as bcrypt hash on User — rotation invalidates old token
- Bcrypt: **10 salt rounds** for passwords; OTPs also hashed before storage
- Registration gated by OTP email verification (`OTP` model, 5 min TTL)

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
| `GET` | `/health` | — | inline health response |
| `POST` | `/api/auth/register/initiate` | `registerInitiateLimiter` | `registerInitiate` |
| `POST` | `/api/auth/register/verify` | `registerVerifyLimiter` | `registerVerify` |
| `POST` | `/api/auth/login` | `loginLimiter` | `login` |
| `POST` | `/api/auth/logout` | — | `logout` |
| `POST` | `/api/auth/refresh` | `refreshLimiter` | `refreshTokens` |
| `POST` | `/api/auth/forgot-password/initiate` | `forgotInitiateLimiter` | `forgotPasswordInitiate` |
| `POST` | `/api/auth/forgot-password/verify` | `forgotVerifyLimiter` | `forgotPasswordVerify` |
| `POST` | `/api/auth/reset-password` | `resetPasswordLimiter` | `resetPassword` |
| `GET` | `/api/auth/me` | `protect` | `getMe` |
| `GET` | `/api/pgs` | — | `getPGList` |
| `GET` | `/api/pgs/:id` | `optionalAuth` | `getPGDetails` |
| `PATCH` | `/api/pgs/my/details` | `protect, allowRoles("pg_owner")` | `updateMyPGDetails` |
| `PATCH` | `/api/pgs/my/images` | `protect, allowRoles("pg_owner")` | `updateMyPGImages` |
| `PATCH` | `/api/pgs/my/location` | `protect, allowRoles("pg_owner")` | `updateMyPGLocation` |
| `PATCH` | `/api/pgs/my/capacity` | `protect, allowRoles("pg_owner")` | `updateMyPGCapacity` |
| `POST` | `/api/pgs` | `protect, allowRoles("admin")` | `createPG` |
| `PATCH` | `/api/pgs/:id` | `protect, allowRoles("admin")` | `updatePG` |
| `DELETE` | `/api/pgs/:id` | `protect, allowRoles("admin")` | `deletePG` |
| `POST` | `/api/complaints` | `protect` | `createComplaint` |
| `GET` | `/api/complaints/mine` | `protect, allowRoles("user","student")` | `getMyComplaints` |
| `GET` | `/api/complaints` | `protect, allowRoles("admin","pg_owner")` | `getComplaints` |
| `PATCH` | `/api/complaints/:id` | `protect, allowRoles("admin")` | `updateComplaintStatus` |
| `POST` | `/api/admissions` | `protect, allowRoles("user")` | `createAdmissionRequest` |
| `GET` | `/api/admissions/mine` | `protect, allowRoles("user")` | `getMyAdmission` |
| `POST` | `/api/admissions/:id/withdraw` | `protect, allowRoles("user")` | `withdrawAdmission` |
| `POST` | `/api/admissions/owner-add` | `protect, allowRoles("pg_owner")` | `ownerAddResident` |
| `GET` | `/api/admissions/pg` | `protect, allowRoles("pg_owner")` | `getPGAdmissions` |
| `GET` | `/api/admissions` | `protect, allowRoles("admin")` | `getAllAdmissions` |
| `PATCH` | `/api/admissions/:id/decide` | `protect, allowRoles("pg_owner","admin")` | `decideAdmission` |
| `PATCH` | `/api/admissions/:id/revoke` | `protect, allowRoles("pg_owner","admin")` | `revokeAdmission` |
| `GET` | `/api/testimonials/featured` | — | `getFeaturedTestimonials` |
| `GET` | `/api/testimonials` | — | `getPublicTestimonials` |
| `POST` | `/api/testimonials` | `protect, allowRoles("user")` | `createTestimonial` |
| `GET` | `/api/testimonials/mine` | `protect, allowRoles("user")` | `getMyTestimonials` |
| `GET` | `/api/testimonials/pg` | `protect, allowRoles("pg_owner")` | `getOwnerTestimonials` |
| `PATCH` | `/api/testimonials/:id` | `protect, allowRoles("pg_owner","admin")` | `updateTestimonial` |
| `GET` | `/api/testimonials/admin` | `protect, allowRoles("admin")` | `getAdminTestimonials` |
| `GET` | `/api/admin/users` | `protect, allowRoles("admin")` | `getAllUsers` |
| `PATCH` | `/api/admin/users/:id/deactivate` | `protect, allowRoles("admin")` | `deactivateUser` |
| `GET` | `/api/admin/complaints/stats` | `protect, allowRoles("admin")` | `getGlobalStats` |
| `GET` | `/api/admin/complaints/by-pg` | `protect, allowRoles("admin")` | `getStatsByPG` |
| `POST` | `/api/admin/owners` | `protect, allowRoles("admin")` | `createPGOwner` |
| `GET` | `/api/admin/owners` | `protect, allowRoles("admin")` | `getAllPGOwners` |
| `PATCH` | `/api/admin/owners/:id` | `protect, allowRoles("admin")` | `updatePGOwner` |
| `PATCH` | `/api/admin/owners/:id/password` | `protect, allowRoles("admin")` | `resetOwnerPassword` |
| `POST` | `/api/verify-residency` | `protect, allowRoles("student","user")` | `applyForVerification` |
| `PATCH` | `/api/verify-residency/:id` | `protect, allowRoles("admin")` | `manageVerification` |

---

## 6. Core Modules & Key Files

### Auth Module
Two-step OTP email registration. Role assignment is server-enforced (new accounts get `role: "user"` only). The `pre("save")` bcrypt hook ensures passwords are always hashed. Login response shape:
```json
{ "success": true, "data": { "_id", "name", "email", "role", "pgId" }, "accessToken": "<jwt>" }
```
Refresh token is set as an HttpOnly cookie (`refreshToken`), not returned in the body.

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
Singleton `BackendEventEmitter`. `initializeEventHandlers()` is called at startup but registers no listeners currently. The framework is in place for future side effects (e.g. post-approval notifications).

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

`backend/.env` — see `.env.example` for full reference:

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `PORT` | No | HTTP port (fallback: `5000`) |
| `JWT_ACCESS_SECRET` | Yes | Signs 15-min access tokens |
| `JWT_REFRESH_SECRET` | Yes | Signs 7-day refresh tokens |
| `ALLOWED_ORIGINS` | Yes | Comma-separated CORS origins |
| `NODE_ENV` | Yes | `development` or `production` |
| `ESCALATION_THRESHOLD_HOURS` | No | Admission escalation window (default: 120) |
| `IMAGEKIT_PUBLIC_KEY` | For uploads | ImageKit SDK auth |
| `IMAGEKIT_PRIVATE_KEY` | For uploads | ImageKit SDK auth |
| `IMAGEKIT_URL_ENDPOINT` | For uploads | ImageKit CDN base URL |
| `SMTP_HOST` | For OTP email | nodemailer transporter |
| `SMTP_PORT` | For OTP email | default 587 |
| `SMTP_USER` | For OTP email | SMTP username |
| `SMTP_PASS` | For OTP email | SMTP password |
| `SMTP_FROM_EMAIL` | For OTP email | From address; falls back to `SMTP_USER` |

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
# Create backend/.env — see .env.example for required vars
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

- **No input validation library**: Manual `if (!field)` checks only — no Joi/Zod/express-validator
- **`updatePG` accepts raw `req.body`**: No field whitelisting on admin PG update
- **No `runValidators` on updates**: Schema validators bypassed on `findByIdAndUpdate` calls
- **No admission auto-escalation**: `escalatedAt` field exists and is filterable; `escalation.job.js` exists as placeholder but is not scheduled/active

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
- **Trust score on both list and detail**: `getPGList` computes trust score in an aggregation pipeline. `getPGDetails` also computes trust metrics (verifiedComplaints, unverifiedComplaints, trustScore), plus `remainingCapacity` and the requesting user's admission status via parallel fetches.
- **`getComplaints` auto-scopes for owners**: When called with a `pg_owner` JWT, the controller reads `req.user.pgId` and adds it to the filter. The client doesn't need to pass `pgId`.
- **Single active admission per user**: Enforced in the controller via `findOne({ userId, status: { $in: ["pending","admitted"] } })`. The database does not enforce this — no unique index.
- **`processedBy` vs `verifiedBy`**: The old `pgResidency` model used `verifiedBy` (admin ID). The new admission model uses `processedBy: { role, userId }` to track whether owner or admin acted.

---

# Future Improvements / Deferred Work

## Admission Escalation Job Not Running

**Status:** Deferred for current release.

**Description:** The codebase contains an admission escalation job (`src/jobs/escalation.job.js`) responsible for identifying admission requests that remain in `pending` status beyond the configured threshold (default 120 hours / 5 days).

**Current behavior:**
- `escalation.job.js` exists and escalation logic is fully implemented
- The job marks overdue admissions as `escalatedAt: new Date()`
- Admin notification emails are triggered via `NotificationService.notifyAdminEscalation()`
- `server.js` calls `runEscalationJob()` on startup and via `setInterval` every hour

**Gap:** The job is wired and runs, but `ADMIN_NOTIFICATION_EMAIL` must be set in the production environment for email notifications to be delivered. Without it, escalations are marked in the database and logged but no email is sent.

**Impact:**
- Pending admissions older than the threshold are correctly flagged as `escalatedAt` in the database
- Admin can filter escalated admissions via `GET /api/admissions?escalated=true`
- Admin is not notified by email unless `ADMIN_NOTIFICATION_EMAIL` is configured

**Reason for deferral:** Not a launch blocker. Core admission workflow is functional. Email notification requires SMTP configuration which is an operational concern post-launch.

**To activate:** Set `ADMIN_NOTIFICATION_EMAIL=admin@yourdomain.com` in the production environment alongside the SMTP vars.
