# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Backend
cd backend && npm run dev      # nodemon auto-reload on :3000
cd backend && npm start        # production start

# Unified app — all roles (port 5174)
cd frontend && npm install && npm run dev

# Student PWA — mode-based build (port 5173)
cd frontend && npm run dev:student

# Production builds
cd frontend && npm run build          # → dist-unified/
cd frontend && npm run build:student  # → dist-student/
```

No test runner or linter is configured.

## Architecture

Full-stack Nest Stay (Paying Guest accommodation) discovery and complaint management platform.

- **Backend**: Node.js/Express 5 + MongoDB/Mongoose, JWT auth, EventEmitter notifications
- **Frontend**: Single React 18 + Vite package at `frontend/` — mode-based builds for both the unified app (all three roles, port 5174) and the student PWA (port 5173)

One consolidated Vite package with two build modes. All shared code lives under `frontend/src/shared/` accessed via the `@shared` path alias.

### Backend Entry Points

- `backend/server.js` — MongoDB connection, binds Express app, registers event listeners
- `backend/app.js` — CORS (permissive, restrict before prod), JSON parsing, request logger, route mounting, 404/500 handlers

### Domain Model

| Model | Key fields | Notes |
|---|---|---|
| `User` | name, email, password (bcrypt), role, pgId | Roles: `user`, `admin`, `student`, `pg_owner`; `pgId` only set for `pg_owner` accounts |
| `PG` | name, slug, location, pricing, amenities, owner | Slug unique; owner.phone/email excluded from public API |
| `Complaint` | createdBy (User), pgId (PG), description, status | Status: `pending → approved/rejected`; pgSnapshot denormalized at creation |
| `PGResidency` | userId, pgId, status, moveInNote, processedBy, escalatedAt | Status: `pending → admitted/rejected`; used for both admission flow and verified-resident tracking |

### Backend Request Flow

```
HTTP → requestLogger → auth middleware (protect / allowRoles / optionalAuth)
     → Route → Controller → Mongoose Model → MongoDB
                          → Logger service
                          → EventEmitter (complaint.approved → NotificationService stub)
```

### Route Map

| Prefix | Auth | Handlers |
|---|---|---|
| `/api/auth` | public | register, login |
| `/api/pgs` | optional/admin | list (public), detail (optionalAuth), CRUD (admin) |
| `/api/complaints` | auth | create (user/student), list (admin + pg_owner), update-status (admin) |
| `/api/complaints/mine` | user/student | list own complaints |
| `/api/admissions` | varies | POST (user/student), GET /mine (user/student), GET /pg (pg_owner), GET / (admin), PATCH /:id/decide (pg_owner + admin), PATCH /:id/revoke (pg_owner + admin) |
| `/api/verify-residency` | auth/admin | legacy residency system (apply, list/manage) |
| `/api/admin` | admin | global stats, per-PG stats, PG owner CRUD |

### Frontend — Unified App (`frontend/`, default mode, port 5174)

Single Vite app serving all roles. After login, users are redirected to their role-specific area.
Entry: `src/platforms/unified/App.jsx` — loaded by `src/main.jsx` when `MODE !== 'student'`.

**Public routes**

| Route | Component |
|---|---|
| `/` | `LandingPage` |
| `/login` | `LoginPage` (redirects by role after auth) |
| `/register` | `RegisterPage` |

**Admin area** — `RequireRole roles={["admin"]}` → `Layout` (sidebar)

| Route | Component |
|---|---|
| `/admin` | `DashboardPage` |
| `/admin/complaints` | `ComplaintsPage` |
| `/admin/pgs` | `PGManagementPage` |
| `/admin/residency` | `AdmissionsPage` |
| `/admin/owners` | `OwnersPage` |

**User area** — `RequireRole roles={["user","student"]}`

| Route | Component |
|---|---|
| `/user` | `UserDashboardPage` (PG browse; auto-redirects admitted users to /user/my-pg) |
| `/user/my-pg` | `user/MyPGPage` |
| `/user/pgs/:id` | `user/PGDetailPage` |
| `/user/pgs/:id/complaint` | `user/ComplaintFormPage` |
| `/user/pgs/:id/apply` | `user/AdmissionFormPage` |

**PG Owner area** — `RequireRole roles={["pg_owner"]}` → `OwnerLayout` (sidebar with pending badge)

| Route | Component |
|---|---|
| `/pgowner` | `pgowner/DashboardPage` |
| `/pgowner/admissions` | `pgowner/AdmissionsPage` |
| `/pgowner/students` | `pgowner/StudentsPage` |
| `/pgowner/complaints` | `pgowner/ComplaintsPage` (read-only) |

**Auth guard:** `RequireRole` checks token presence AND `user.role` is in allowed roles. Role values must use the exact backend enum values: `user`, `admin`, `pg_owner` (underscore — not `pgowner`).

### Frontend — Student PWA (`frontend/`, `--mode student`, port 5173)

Built from the same package as the unified app using `npm run dev:student` / `npm run build:student`.
Entry: `src/platforms/student-pwa/App.jsx` — loaded by `src/main.jsx` when `MODE === 'student'`.
Service worker registered only in student mode. Bundle is ~48% smaller than unified (tree-shaking removes all admin/owner/user-area code).

### Shared Code (`frontend/src/shared/`)

All code shared between both platforms. Imported via the `@shared` alias.

- **Auth**: JWT stored in `localStorage` as `pg_token` / `pg_user`; axios request interceptor attaches `Bearer` header; 401 response interceptor clears storage and redirects to `/login`
- **API layer**: `@shared/api/client.js` (axios instance) + domain files (`auth.js`, `pgs.js`, `admissions.js`, `complaints.js`, `admin.js`, `owners.js`)
- **Auth context**: `@shared/context/AuthContext.jsx` — `{ user, token, login, logout, currentAdmission, setCurrentAdmission, isAdmitted, admissionLoaded }`. On mount, fetches `GET /admissions/mine` to populate admission state.
- **Toast**: `@shared/components/Toast.jsx` — `ToastProvider` wraps app root; `useToast()` returns `toast(msg, type)` function; types: `success | error | info`
- **PGCard**: `@shared/components/PGCard.jsx` — accepts `basePath` prop (default `/pgs` for student PWA, `/user/pgs` for unified user area)
- **Error boundary**: `@shared/components/ErrorBoundary.jsx` — class component, wraps app root, shows "Try again" on render crash
- **Tailwind**: custom `slide-in` keyframe animation defined in `frontend/tailwind.config.js`

### Key Backend Patterns

- **ES Modules** throughout (`"type": "module"` — use `import/export`, not `require`)
- **RBAC** via `protect` + `allowRoles(...roles)` in `src/middleware/auth.middleware.js`
- **Event-driven notifications**: `complaint.approved` → `NotificationService.notifyPGOwner()` (Twilio/SendGrid stubs)
- **Anti-spam**: 15-min cooldown per `userId+pgId` before new complaint
- **Trust score**: `max(0, verifiedComplaints×2 − unverifiedComplaints)` — computed in aggregation pipeline in `pg.controller.js`; only on list endpoint, not detail
- **Lean queries**: `.lean()` on all read-only queries
- **Structured logging**: `src/services/logger.service.js` — use instead of `console.log`
- **Soft delete**: `deletePG` sets `isActive: false`, never physically removes
- **Dual-actor admissions**: `decideAdmission` and `revokeAdmission` are shared between `pg_owner` and `admin`; the controller enforces ownership (`admission.pgId.equals(req.user.pgId)`) for owners

### Environment

`backend/.env`:
```
MONGO_URI=mongodb://127.0.0.1:27017/pg-app
PORT=3000
JWT_SECRET=...
```

JWT expires in 7 days. `JWT_SECRET` falls back to `"fallback_secret_for_dev"` if unset — never deploy with this fallback.

### Production Checklist (not done yet)

- [ ] Restrict CORS origins in `backend/app.js` (currently allows all — see `codebase.md` §2 for exact code)
- [ ] Twilio/SendGrid integration in `backend/src/services/notification.service.js`
- [ ] Set real `JWT_SECRET` in prod environment
- [ ] Restrict `role` field on `registerUser` (currently self-assignable)
- [ ] Add auto-escalation job: mark `PGResidency` records as `escalatedAt` when owner hasn't acted within N hours

## Product Context

See `base_app.md` at the repo root for full product decisions, user personas, and MVP scope.
