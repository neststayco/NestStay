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
cd frontend && npm run build          # → dist-unified/  (script: "build")
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
- `backend/app.js` — CORS (`ALLOWED_ORIGINS` env var), Helmet, cookie parser, JSON parsing, request logger, rate limiter, route mounting, health + root endpoints, 404/500 handlers

### Domain Model

| Model | Key fields | Notes |
|---|---|---|
| `User` | name, email, password (bcrypt), role, pgId | Roles: `user`, `admin`, `student`, `pg_owner`; `pgId` only set for `pg_owner` accounts |
| `PG` | name, slug, location, pricing, amenities, owner | Slug unique; owner.phone/email excluded from public API |
| `Complaint` | createdBy (User), pgId (PG), description, status | Status: `pending → approved/rejected`; pgSnapshot denormalized at creation |
| `PGResidency` | userId, pgId, status, moveInNote, processedBy, escalatedAt | Status: `pending → admitted/rejected`; used for both admission flow and verified-resident tracking |

### Backend Request Flow

```
HTTP → Helmet → CORS → cookieParser → requestLogger → generalLimiter
     → auth middleware (protect / allowRoles / optionalAuth)
     → Route → Controller → Mongoose Model → MongoDB
                          → Logger service
                          → EventEmitter (no active listeners)
```

### Route Map

| Prefix | Auth | Handlers |
|---|---|---|
| `/api/auth` | public | register/initiate, register/verify (OTP), login, logout, refresh, forgot-password/initiate, forgot-password/verify, reset-password, GET /me |
| `/api/pgs` | optional/admin/pg_owner | list (public, supports `search` text query), detail (optionalAuth), CRUD (admin), owner self-service: PATCH /my/details, /my/images, /my/location, /my/capacity |
| `/api/complaints` | auth | create (user), list (admin + pg_owner), update-status (admin), GET /mine (user) |
| `/api/admissions` | varies | POST (user), GET /mine (user), POST /:id/withdraw (user), POST /owner-add (pg_owner), GET /pg (pg_owner), GET / (admin), PATCH /:id/decide (pg_owner + admin), PATCH /:id/revoke (pg_owner + admin) |
| `/api/testimonials` | varies | GET /featured (public), GET / (public, ?pgId=), POST / (user), GET /mine (user), GET /pg (pg_owner), PATCH /:id (pg_owner + admin), GET /admin (admin) |
| `/api/admin` | admin | users list + deactivate, global stats, per-PG stats, PG owner CRUD |
| `/api/imagekit` | pg_owner | auth token for ImageKit SDK uploads |
| `/api/verify-residency` | auth/admin | legacy (still mounted, not used by UI) |
| `GET /health` | public | uptime, version, env, timestamp |

### Frontend — Unified App (`frontend/`, default mode, port 5174)

Single Vite app serving all roles. After login, users are redirected to their role-specific area.
Entry: `src/platforms/unified/App.jsx` — loaded by `src/main.jsx` when `MODE !== 'student'`.

**PWA:** Enabled for user and owner areas. Admin routes excluded via `navigateFallbackDenylist: [/^\/admin/]` in `vite.config.js`. Service worker registered explicitly in `main.jsx` via `virtual:pwa-register` (production only). Install prompt available in `UserDashboardPage` and `OwnerLayout` via `usePWAInstall` hook — never rendered on admin routes.

**Public routes**

| Route | Component |
|---|---|
| `/` | `LandingPage` |
| `/login` | `LoginPage` (redirects by role after auth) |
| `/register` | `RegisterPage` |
| `/owner/register` | `OwnerRegisterPage` |
| `/forgot-password` | `ForgotPasswordPage` |
| `/properties` | `PropertiesPage` (public PG browse) |
| `/properties/:id` | `PropertyDetailPage` |

**Admin area** — `RequireRole role="admin"` → `Layout` (sidebar) — **no PWA, no install prompt**

| Route | Component |
|---|---|
| `/admin` | `DashboardPage` |
| `/admin/complaints` | `ComplaintsPage` |
| `/admin/pgs` | `PGManagementPage` |
| `/admin/residency` | `AdmissionsPage` |
| `/admin/owners` | `OwnersPage` |
| `/admin/testimonials` | `AdminTestimonialsPage` |
| `/admin/users` | `AdminUsersPage` |
| `/admin/onboarding-review` | `AdminOnboardingReviewPage` |

**User area** — `RequireRole roles={["user"]}` — **PWA-enabled**

| Route | Component |
|---|---|
| `/user` | `UserDashboardPage` (PG browse + keyword search; auto-redirects admitted users to /user/my-pg; shows pending admission banner with withdraw; shows install prompt when PWA installable) |
| `/user/saved` | `user/SavedPGsPage` |
| `/user/my-pg` | `user/MyPGPage` |
| `/user/pgs/:id` | `user/PGDetailPage` |
| `/user/pgs/:id/complaint` | `user/ComplaintFormPage` |
| `/user/pgs/:id/apply` | `user/AdmissionFormPage` |

**PG Owner area** — `RequireRole role="pg_owner"` → `OwnerLayout` (sidebar with pending badge) — **PWA-enabled**

Onboarding status gates the dashboard. All `pg_owner` accounts hit onboarding/status routes first; only `approved` or `legacy` owners reach the main dashboard via `RequireOwnerApproved`.

| Route | Component | Auth |
|---|---|---|
| `/pgowner/onboarding` | `pgowner/OnboardingPage` | `RequireRole` only |
| `/pgowner/waiting-approval` | `pgowner/WaitingApprovalPage` | `RequireRole` only |
| `/pgowner/rejected` | `pgowner/RejectedPage` | `RequireRole` only |
| `/pgowner` | `pgowner/DashboardPage` | `RequireOwnerApproved` |
| `/pgowner/admissions` | `pgowner/AdmissionsPage` | `RequireOwnerApproved` |
| `/pgowner/residents` | `pgowner/StudentsPage` | `RequireOwnerApproved` |
| `/pgowner/complaints` | `pgowner/ComplaintsPage` (read-only) | `RequireOwnerApproved` |
| `/pgowner/testimonials` | `pgowner/TestimonialsPage` | `RequireOwnerApproved` |
| `/pgowner/photos` | `pgowner/PhotosPage` | `RequireOwnerApproved` |
| `/pgowner/location` | `pgowner/LocationPage` | `RequireOwnerApproved` |
| `/pgowner/details` | `pgowner/DetailsPage` | `RequireOwnerApproved` |
| `/pgowner/visits` | `pgowner/VisitsPage` | `RequireOwnerApproved` |
| `/pgowner/leads` | `pgowner/LeadsPage` | `RequireOwnerApproved` |
| `/pgowner/capacity` | redirects → `/pgowner/details` | — |

**Auth guard:** `RequireRole` checks token presence AND `user.role` is in allowed roles. `RequireOwnerApproved` additionally checks `user.onboardingStatus` — redirects `profile_incomplete` → `/pgowner/onboarding`, `pending_review` → `/pgowner/waiting-approval`, `rejected` → `/pgowner/rejected`. Role values must use the exact backend enum values: `user`, `admin`, `pg_owner` (underscore — not `pgowner`).

### Frontend — Student PWA (`frontend/`, `--mode student`, port 5173)

Built from the same package as the unified app using `npm run dev:student` / `npm run build:student`.
Entry: `src/platforms/student-pwa/App.jsx` — loaded by `src/main.jsx` when `MODE === 'student'`.
Service worker auto-registered by VitePWA injection. Bundle is ~48% smaller than unified (tree-shaking removes all admin/owner/user-area code).

### Shared Code (`frontend/src/shared/`)

All code shared between both platforms. Imported via the `@shared` alias.

- **Auth**: Access token in `localStorage` (`pg_token`); refresh token in HttpOnly cookie. Axios interceptor attaches `Bearer` header; 401 response interceptor attempts silent refresh via `POST /api/auth/refresh`, then falls back to logout + redirect.
- **API layer**: `@shared/api/client.js` (axios instance) + domain files: `auth.js`, `pgs.js`, `admissions.js`, `complaints.js`, `admin.js`, `owners.js`, `testimonials.js`, `imagekit.js`, `leads.js`, `visits.js`, `terms.js`, `onboarding.js`, `user.js`
- **Auth context**: `@shared/context/AuthContext.jsx` — `{ user, token, login, logout, updateUser, currentAdmission, setCurrentAdmission, isAdmitted, admissionLoaded, savedPGIds, toggleSave }`. On mount, fetches `GET /admissions/mine` (admission state) and `GET /api/user/interactions` (saved PG IDs). `savedPGIds` is a `Set<string>` for O(1) lookup. `toggleSave` handles optimistic UI + atomic `$addToSet`/`$pull` via `POST /api/user/pgs/:id/save`.
- **Toast**: `@shared/components/Toast.jsx` — `ToastProvider` wraps app root; `useToast()` returns `toast(msg, type)` function; types: `success | error | info`
- **PGCard**: `@shared/components/PGCard.jsx` — props: `{ pg, basePath, isSaved, onSave }`. `basePath` defaults to `/pgs` (student PWA) or `/user/pgs` (unified). Save button only renders when `onSave` provided. Amenity pills include Material Symbols icons via `AMENITY_ICONS` map. Hover applies `card-lift` class (defined in `index.css`).
- **Error boundary**: `@shared/components/ErrorBoundary.jsx` — class component, wraps app root, shows "Try again" on render crash
- **PWA install hook**: `@shared/hooks/usePWAInstall.js` — captures `beforeinstallprompt` event, exposes `{ canInstall, promptInstall }`. Clears on `appinstalled`. Only used in user and owner layouts — never in admin `Layout`.
- **Tailwind**: `frontend/tailwind.config.js` — custom animations: `slide-in`, `fade-up`, `scale-in`, `pulse-dot`. Custom shadows: `card`, `card-hover`, `ambient`, `warm`, `float`, `glow`, `subtle`, `inner`. `index.css` adds elevation classes `.e1`/`.e2`/`.e3`, `.card-lift`, `.btn-glow`, surface layer helpers.

### Key Backend Patterns

- **ES Modules** throughout (`"type": "module"` — use `import/export`, not `require`)
- **RBAC** via `protect` + `allowRoles(...roles)` in `src/middleware/auth.middleware.js`
- **Event-driven notifications**: EventEmitter framework kept; event handlers emptied (no active listeners)
- **Anti-spam**: 15-min cooldown per `userId+pgId` before new complaint
- **PG list/detail**: `getPGList` supports filters `city`, `area`, `gender`, `foodType`, `minPrice`, `maxPrice`, `amenities` (comma-separated, case-insensitive), `sortBy` (`price` only — no trust/complaint sort), pagination. `getPGDetails` returns `{ pg, remainingCapacity, userContext }` — no trust metrics.
- **Save PG**: atomic `$addToSet`/`$pull` via `findByIdAndUpdate` — avoids triggering pre-save bcrypt hook. `getSavedPGs` uses aggregation with pgresidencies lookup for `remainingCapacity`.
- **Lean queries**: `.lean()` on all read-only queries
- **Structured logging**: `src/services/logger.service.js` — use instead of `console.log`
- **Soft delete**: `deletePG` sets `isActive: false`, never physically removes
- **Dual-actor admissions**: `decideAdmission` and `revokeAdmission` are shared between `pg_owner` and `admin`; the controller enforces ownership (`admission.pgId.equals(req.user.pgId)`) for owners

### Environment

`backend/.env`:
```
MONGO_URI=mongodb://127.0.0.1:27017/pg-app
PORT=3000
JWT_ACCESS_SECRET=...   # access tokens, 15 min expiry
JWT_REFRESH_SECRET=...  # refresh tokens, 7 day expiry
SMTP_HOST=              # leave blank in dev — OTPs log to console
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=
```

See `.env.example` for all required vars. No fallback secrets — missing `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` will crash token signing in production.

### Production Checklist (not done yet)

- [x] CORS — uses `ALLOWED_ORIGINS` env var, no wildcard
- [x] Helmet active
- [x] Role self-assignment restricted on register
- [x] JWT rotated access+refresh with HttpOnly cookie
- [x] PWA enabled for user + owner; admin excluded via `navigateFallbackDenylist`
- [x] Auth endpoints (`/api/auth/*`) set to `NetworkOnly` in both SW configs — never cached
- [ ] Set real `JWT_ACCESS_SECRET` + `JWT_REFRESH_SECRET` in prod environment
- [ ] Configure SMTP vars in prod (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`)
- [ ] Generate PWA icons — `public/icon-192.png` and `public/icon-512.png` missing (install criteria fail without them). Use `logo.png` or `logo2.png` as source.
- [ ] Set `Cache-Control: no-store` on `sw.js` and `manifest.json` at the hosting layer (Vercel/nginx)

## Product Context

See `base_app.md` at the repo root for full product decisions, user personas, and MVP scope.
