# Platform Admin API Reference

> **Auth mechanism:** `Authorization: Bearer <JWT>` on all protected routes. Token expires in 7 days. Admin accounts cannot be self-registered — they must be seeded directly in the database (see flags below).

---

## Table of Contents

1. [Authentication](#authentication)
2. [Admin Dashboard & Stats](#admin-dashboard--stats)
3. [PG Management](#pg-management)
4. [Complaints](#complaints)
5. [Admissions (PGResidency)](#admissions-pgresidency)
6. [Testimonials](#testimonials)
7. [ImageKit Upload Auth](#imagekit-upload-auth)
8. [Deprecated — Legacy Residency](#deprecated--legacy-residency)
9. [Flags & Issues](#flags--issues)

---

## Authentication

> Route file: `backend/src/routes/auth.routes.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register a new user — **hardcodes `role: "user"`**; admin accounts cannot be created via API |
| POST | `/api/auth/login` | None | Login; returns user object and signed JWT |

**Rate limit:** 20 requests / 15 min window on all `/api/auth/*` routes.

**Request — POST `/api/auth/login`:**
```json
{ "email": "string", "password": "string" }
```

**Response — POST `/api/auth/login`:**
```json
{
  "success": true,
  "data": { "_id": "ObjectId", "name": "string", "email": "string", "role": "string", "pgId": "ObjectId | null" },
  "token": "<jwt>"
}
```

---

## Admin Dashboard & Stats

> Route file: `backend/src/routes/admin.routes.js`
> Controller: `backend/src/controllers/admin.controller.js`
>
> **All routes under `/api/admin` require `JWT + role=admin`.**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/complaints/stats` | JWT + admin | Global platform-wide complaint aggregates + admission counts |
| GET | `/api/admin/complaints/by-pg` | JWT + admin | Per-PG complaint breakdown, sorted by count descending |
| POST | `/api/admin/owners` | JWT + admin | Create a new PG owner account linked to a PG |
| GET | `/api/admin/owners` | JWT + admin | List all `pg_owner` accounts (password excluded) |
| PATCH | `/api/admin/owners/:id` | JWT + admin | Reassign or unlink a PG owner's `pgId` |
| PATCH | `/api/admin/owners/:id/password` | JWT + admin | Reset a PG owner's password |

---

### GET `/api/admin/complaints/stats`

No query params.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalComplaints": 0,
    "verifiedComplaints": 0,
    "unverifiedComplaints": 0,
    "pendingComplaints": 0,
    "approvedComplaints": 0,
    "rejectedComplaints": 0,
    "totalAdmitted": 0,
    "totalPendingAdmissions": 0,
    "escalatedAdmissions": 0
  }
}
```

---

### GET `/api/admin/complaints/by-pg`

No query params.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "pgName": "string",
      "complaintCount": 0,
      "verifiedComplaints": 0,
      "unverifiedComplaints": 0
    }
  ]
}
```

---

### POST `/api/admin/owners`

**Request body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required)",
  "pgId": "ObjectId (required)"
}
```

Validates that `pgId` exists and the email is not already in use. Creates user with `role: "pg_owner"`.

**Response `201`:**
```json
{
  "success": true,
  "message": "PG owner account created",
  "data": { "_id", "name", "email", "role": "pg_owner", "pgId" }
}
```

---

### GET `/api/admin/owners`

No query params. Returns all users with `role: "pg_owner"`, `password` excluded, `pgId` populated with PG `name` and `location.city`.

---

### PATCH `/api/admin/owners/:id`

**Request body:**
```json
{ "pgId": "ObjectId | null" }
```

Only updates the `pgId` field. Pass `null` to unlink the owner from their PG.

---

### PATCH `/api/admin/owners/:id/password`

**Request body:**
```json
{ "password": "string (min 6 chars)" }
```

---

## PG Management

> Route file: `backend/src/routes/pg.routes.js`
> Controller: `backend/src/controllers/pg.controller.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/pgs` | None (public) | List active PGs with filters, pagination, and computed trust score |
| GET | `/api/pgs/:id` | Optional JWT | PG detail with trust metrics and caller admission context |
| POST | `/api/pgs` | JWT + admin | Create a new PG listing |
| PATCH | `/api/pgs/:id` | JWT + admin | Full update of a PG document |
| DELETE | `/api/pgs/:id` | JWT + admin | **Soft delete only** — sets `isActive: false`, never removes the document |

> Note: `PATCH /api/pgs/my/images`, `PATCH /api/pgs/my/location`, and `PATCH /api/pgs/my/capacity` are `pg_owner` only and not accessible to admin.

---

### GET `/api/pgs`

**Query params:**

| Param | Type | Notes |
|-------|------|-------|
| `city` | string | Filter by `location.city` |
| `area` | string | Filter by `location.area` |
| `gender` | string | Filter by `accommodation.gender` |
| `foodType` | string | `veg \| non-veg \| both` |
| `minPrice` | number | `pricing.rent >= minPrice` |
| `maxPrice` | number | `pricing.rent <= maxPrice` |
| `amenities` | string | Comma-separated list; requires all to match (`$all`) |
| `sortBy` | string | `trustScore \| complaints \| price` (default: `createdAt desc`) |
| `page` | number | Default: `1` |
| `limit` | number | Default: `10` |

Trust score is computed per-document in the aggregation pipeline:
`trustScore = max(0, verifiedComplaints × 2 − unverifiedComplaints)`

**Response:**
```json
{
  "success": true,
  "data": [{ "...pgFields": "...", "meta": { "trustScore": 0, "complaintCount": 0 }, "remainingCapacity": 0 }],
  "pagination": { "totalItems", "currentPage", "totalPages", "limit" }
}
```

---

### GET `/api/pgs/:id`

Caller context is injected when a valid JWT is present (`optionalAuth`).

**Response:**
```json
{
  "success": true,
  "pg": { "...pgFields": "...", "owner.phone": "EXCLUDED", "owner.email": "EXCLUDED" },
  "trust": {
    "verifiedResidentsCount": 0,
    "totalComplaints": 0,
    "verifiedComplaints": 0,
    "unverifiedComplaints": 0
  },
  "remainingCapacity": "number | null",
  "userContext": {
    "isAdmitted": false,
    "admissionStatus": "pending | admitted | null",
    "hasActiveAdmissionElsewhere": false
  }
}
```

---

### POST `/api/pgs`

**Request body:**
```json
{
  "name": "string (required)",
  "slug": "string (required, unique)",
  "description": "string (required)",
  "location": {
    "country": "string",
    "state": "string",
    "city": "string",
    "area": "string",
    "address": "string",
    "coordinates": { "lat": 0.0, "lng": 0.0 }
  },
  "pricing": { "rent": 0, "deposit": 0, "maintenance": 0 },
  "accommodation": {
    "gender": "string",
    "roomTypes": ["string"],
    "totalCapacity": 0
  },
  "foodType": "veg | non-veg | both",
  "amenities": ["string"],
  "images": ["url"],
  "owner": { "name": "string", "phone": "string", "email": "string", "isVerified": false },
  "isVerified": false
}
```

---

### PATCH `/api/pgs/:id`

Accepts the same fields as `POST /api/pgs`. Replaces all provided fields using `runValidators: true`.

---

### DELETE `/api/pgs/:id`

No request body. Sets `isActive: false`. The document is never removed from the database.

---

## Complaints

> Route file: `backend/src/routes/complaint.routes.js`
> Controller: `backend/src/controllers/complaint.controller.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/complaints` | JWT + **admin or pg_owner** | List complaints — admin sees all PGs; pg_owner sees only their PG |
| POST | `/api/complaints` | JWT + user/student | File a complaint (must be an admitted resident; 15-min anti-spam per user+PG) |
| GET | `/api/complaints/mine` | JWT + user/student | Caller's own complaints |
| PATCH | `/api/complaints/:id` | JWT + **pg_owner only** | Update complaint status |

> ⚠️ **Gap:** `PATCH /api/complaints/:id` is restricted to `pg_owner` only — **admin has no API to update complaint status**. Admin access to this route is read-only. See [Flags & Issues](#flags--issues).

---

### GET `/api/complaints`

**Query params (admin):**

| Param | Type | Notes |
|-------|------|-------|
| `status` | string | `pending \| approved \| rejected` |
| `pgId` | ObjectId | Filter by specific PG (pg_owner cannot override — always scoped to their own PG) |
| `verifiedOnly` | `"true"` | Only show complaints from verified residents |
| `page` | number | Default: `1` |
| `limit` | number | Default: `10` |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "pgId": { "name": "string", "location": { "address": "string" }, "owner": {} },
      "createdBy": { "name": "string", "email": "string" },
      "type": "food | cleanliness | security | management | other",
      "description": "string",
      "image": "url | null",
      "isAnonymous": false,
      "isVerifiedResident": true,
      "status": "pending | approved | rejected",
      "pgSnapshot": { "name": "string", "city": "string", "area": "string", "ownerName": "string" },
      "adminRemark": "string | null"
    }
  ],
  "pagination": { "totalItems", "currentPage", "totalPages", "limit" }
}
```

---

## Admissions (PGResidency)

> Route file: `backend/src/routes/admission.routes.js`
> Controller: `backend/src/controllers/admission.controller.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admissions` | JWT + **admin** | All admissions platform-wide, with filters |
| PATCH | `/api/admissions/:id/decide` | JWT + admin or pg_owner | Approve or reject a `pending` admission |
| PATCH | `/api/admissions/:id/revoke` | JWT + admin or pg_owner | Revoke an `admitted` guest (status → `rejected`) |
| POST | `/api/admissions` | JWT + user/student | Submit an admission request |
| GET | `/api/admissions/mine` | JWT + user/student | Caller's active admission (pending or admitted) |
| GET | `/api/admissions/pg` | JWT + pg_owner | Admissions for the owner's PG |
| POST | `/api/admissions/owner-add` | JWT + pg_owner | Directly admit a guest by email, bypassing the request flow |

---

### GET `/api/admissions`

**Query params (admin):**

| Param | Type | Notes |
|-------|------|-------|
| `status` | string | `pending \| admitted \| rejected` |
| `pgId` | ObjectId | Filter by PG |
| `escalated` | `"true"` | Returns pending admissions where `escalatedAt != null` |
| `page` | number | Default: `1` |
| `limit` | number | Default: `15` |

Sorted by: `escalatedAt desc, createdAt desc`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": { "name": "string", "email": "string" },
      "pgId": { "name": "string", "location": { "city": "string", "area": "string" } },
      "status": "pending | admitted | rejected",
      "moveInNote": "string",
      "escalatedAt": "Date | null",
      "revokedAt": "Date | null",
      "revokedBy": "ObjectId | null",
      "processedBy": { "role": "owner | admin", "userId": "ObjectId" }
    }
  ],
  "pagination": { "totalItems", "currentPage", "totalPages", "limit" }
}
```

---

### PATCH `/api/admissions/:id/decide`

**Request body:**
```json
{ "decision": "admitted | rejected" }
```

- Only `pending` admissions can be decided.
- pg_owner is scoped to their own `pgId` (enforced in controller, not at route level).
- Admin has no PG restriction.
- Sets `processedBy: { role: "owner" | "admin", userId }`.

---

### PATCH `/api/admissions/:id/revoke`

No request body required.

- Only `admitted` records can be revoked.
- Sets `status: "rejected"`, `revokedAt: Date`, `revokedBy: userId`.
- pg_owner scoped to their own PG; admin unrestricted.

---

## Testimonials

> Route file: `backend/src/routes/testimonial.routes.js`
> Controller: `backend/src/controllers/testimonial.controller.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/testimonials/admin` | JWT + **admin** | All testimonials across all PGs, filterable |
| PATCH | `/api/testimonials/:id` | JWT + **admin or pg_owner** | Update `status` and/or `isVisible` |
| GET | `/api/testimonials` | None (public) | Approved + visible testimonials for a PG (requires `?pgId=`) |
| POST | `/api/testimonials` | JWT + user/student | Submit testimonial (admitted residents only; one per user per PG) |
| GET | `/api/testimonials/mine` | JWT + user/student | Caller's own testimonials |
| GET | `/api/testimonials/pg` | JWT + pg_owner | All testimonials for the owner's PG |

---

### GET `/api/testimonials/admin`

**Query params:**

| Param | Type | Notes |
|-------|------|-------|
| `pgId` | ObjectId | Filter by PG |
| `status` | string | `pending \| approved \| rejected` |
| `page` | number | Default: `1` |
| `limit` | number | Default: `20` |

---

### PATCH `/api/testimonials/:id`

**Request body:**
```json
{ "status": "pending | approved | rejected", "isVisible": true }
```

**Business rules enforced in controller:**
- Rejecting a testimonial auto-sets `isVisible: false`
- Cannot set `isVisible: true` unless `status === "approved"`
- pg_owner is scoped to their own PG; admin has no such restriction

---

## ImageKit Upload Auth

> Route file: `backend/src/routes/imagekit.routes.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/imagekit/auth` | JWT + **admin or pg_owner** | Returns ImageKit signed auth params for client-side file upload |

No request body or query params. Response contains the signed token, expire timestamp, and signature required by the ImageKit JS SDK to upload directly from the client.

---

## Deprecated — Legacy Residency

> Route file: `backend/src/routes/pgResidency.routes.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| ALL | `/api/verify-residency/*` | — | **410 Gone** — replaced by `/api/admissions` as of `2025-01-01` |

All requests to any path under `/api/verify-residency` return:
```json
{
  "status": "gone",
  "message": "This endpoint has been deprecated and is no longer available.",
  "deprecatedAt": "2025-01-01"
}
```

---

## Flags & Issues

| Severity | Issue | File | Line |
|----------|-------|------|------|
| **High** | `PATCH /api/complaints/:id` allows `pg_owner` only — admin cannot update complaint status via any API endpoint | `complaint.routes.js` | 15 |
| **High** | `POST /api/auth/register` hardcodes `role: "user"` — no API exists to create admin accounts; must be seeded directly in MongoDB | `auth.controller.js` | 20 |
| **Medium** | CORS set to `origin: true` (allows all origins) — must be restricted before production deployment | `app.js` | 25 |
| **Medium** | `DELETE /api/pgs/:id` is soft delete only (`isActive: false`) — no hard-delete or restore endpoint exists; deactivated PGs are invisible to the public list but remain in the database | `pg.controller.js` | 77 |
| **Medium** | `GET /api/pgs` has no admin variant — admin uses the same unauthenticated public endpoint and cannot see `isActive: false` PGs through the API | `pg.routes.js` | 17 |
| **Low** | Escalation job (`src/jobs/escalation.job.js`) writes `escalatedAt` but is **not wired into server startup** — the `GET /api/admissions?escalated=true` filter will always return empty results | `server.js`, `escalation.job.js` | — |
| **Low** | `adminRemark` field exists on the `Complaint` model but **no API writes to it** — the field is always `null` | `Complaint.js` | 64 |
| **Info** | `PATCH /api/admissions/:id/decide` and `/revoke` are dual-actor (pg_owner + admin). Ownership enforcement for pg_owner is done inside the controller, not at the route middleware level | `admission.controller.js` | 178, 286 |
