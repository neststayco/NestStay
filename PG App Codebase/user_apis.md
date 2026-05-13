# User API Reference

> **Role:** `user`
>
> **Auth mechanism:** `Authorization: Bearer <JWT>` on all protected routes. Token expires in 7 days.
> Users self-register via `POST /api/auth/register`, which creates a `role: "user"` account automatically.
>
> **Note on the `student` role:** The `student` role has been removed from the platform. All residents — whether working professionals, students, or general public — use the `user` role. The `allowRoles` middleware, the User model enum, and all frontend route guards have been updated accordingly. The Student PWA build mode (`npm run dev:student`) continues to work as a lightweight frontend variant but its users are registered and authenticated as `role: "user"`.
>
> **Key constraint:** Filing a complaint and posting a testimonial both require the caller to be an **admitted resident** of the target PG — a `PGResidency` record with `status: "admitted"` for that `pgId` must exist. Non-residents receive `403 NOT_VERIFIED_RESIDENT`.

---

## Table of Contents

1. [Authentication](#authentication)
2. [PG Discovery (Browse & Detail)](#pg-discovery-browse--detail)
3. [Admissions](#admissions)
4. [Complaints](#complaints)
5. [Testimonials](#testimonials)
6. [Deprecated — Legacy Residency](#deprecated--legacy-residency)
7. [Flags & Issues](#flags--issues)

---

## Authentication

> Route file: `backend/src/routes/auth.routes.js`
> Controller: `backend/src/controllers/auth.controller.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Create a new user account; role is hardcoded to `"user"` |
| POST | `/api/auth/login` | None | Login with email + password; returns user object and signed JWT |

**Rate limit:** 20 requests / 15 min window on all `/api/auth/*` routes.

---

### POST `/api/auth/register`

> `backend/src/controllers/auth.controller.js` — line 5

**Request body:**
```json
{ "name": "string (required)", "email": "string (required)", "password": "string (required)" }
```

- `role` is **not accepted** in the request body — always set to `"user"` server-side.
- Duplicate email returns `400`.
- A JWT is returned immediately — no email verification step exists.

**Response `201`:**
```json
{
  "success": true,
  "data": { "_id": "ObjectId", "name": "string", "email": "string", "role": "user" },
  "token": "<jwt>"
}
```

---

### POST `/api/auth/login`

> `backend/src/controllers/auth.controller.js` — line 46

**Request body:**
```json
{ "email": "string (required)", "password": "string (required)" }
```

**Response `200`:**
```json
{
  "success": true,
  "data": { "_id": "ObjectId", "name": "string", "email": "string", "role": "user", "pgId": null },
  "token": "<jwt>"
}
```

> `pgId` is always `null` for `user` accounts — it is only set on `pg_owner` accounts.

---

## PG Discovery (Browse & Detail)

> Route file: `backend/src/routes/pg.routes.js`
> Controller: `backend/src/controllers/pg.controller.js`

These endpoints require no authentication. Users can browse and view PG details before logging in.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/pgs` | None (public) | List all active PGs with filters, pagination, and computed trust score |
| GET | `/api/pgs/:id` | Optional JWT | Full PG detail with trust metrics; injects admission context when JWT provided |

---

### GET `/api/pgs`

> `backend/src/controllers/pg.controller.js` — line 90

**Query params:**

| Param | Type | Notes |
|-------|------|-------|
| `city` | string | Filter by `location.city` |
| `area` | string | Filter by `location.area` |
| `gender` | string | Filter by `accommodation.gender` |
| `foodType` | string | `veg \| non-veg \| both` |
| `minPrice` | number | `pricing.rent >= minPrice` |
| `maxPrice` | number | `pricing.rent <= maxPrice` |
| `amenities` | string | Comma-separated list; all must match (`$all`) |
| `sortBy` | string | `trustScore \| complaints \| price` (default: `createdAt desc`) |
| `page` | number | Default: `1` |
| `limit` | number | Default: `10` |

**Trust score** computed per-PG in the aggregation pipeline:
`trustScore = max(0, verifiedComplaints × 2 − unverifiedComplaints)`

**Response `200`:**
```json
{
  "success": true,
  "message": "PGs fetched successfully",
  "data": [
    {
      "_id": "ObjectId",
      "name": "string",
      "slug": "string",
      "description": "string",
      "location": { "city": "string", "area": "string", "address": "string", "coordinates": { "lat": 0.0, "lng": 0.0 } },
      "pricing": { "rent": 0, "deposit": 0, "maintenance": 0 },
      "accommodation": { "gender": "string", "roomTypes": ["string"], "totalCapacity": 0 },
      "foodType": "veg | non-veg | both",
      "amenities": ["string"],
      "images": ["url"],
      "isVerified": false,
      "meta": { "trustScore": 0, "complaintCount": 0 },
      "remainingCapacity": 0
    }
  ],
  "pagination": { "totalItems": 0, "currentPage": 1, "totalPages": 0, "limit": 10 }
}
```

> `owner.phone` and `owner.email` are not present in the list response — the `owner` object is projected out entirely.

---

### GET `/api/pgs/:id`

> `backend/src/controllers/pg.controller.js` — line 216

Send the JWT to receive a `userContext` block showing the caller's current relationship with this PG.

**Response `200`:**
```json
{
  "success": true,
  "pg": {
    "_id": "ObjectId",
    "name": "string",
    "slug": "string",
    "description": "string",
    "location": { "city": "string", "area": "string", "address": "string", "coordinates": { "lat": 0.0, "lng": 0.0 } },
    "pricing": { "rent": 0, "deposit": 0, "maintenance": 0 },
    "accommodation": { "gender": "string", "roomTypes": ["string"], "totalCapacity": 0 },
    "foodType": "veg | non-veg | both",
    "amenities": ["string"],
    "images": ["url"],
    "isVerified": false,
    "owner": { "name": "string" }
  },
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

> `owner.phone` and `owner.email` are always excluded via `.select("-owner.phone -owner.email")`.
>
> `userContext` is only populated when a valid JWT is provided. Without a token all three fields default to `false / null`.
>
> `hasActiveAdmissionElsewhere: true` means the caller has an active admission at a different PG — used by the frontend to disable the Apply button.

**Errors:**
| Status | Condition |
|--------|-----------|
| `400` | Invalid PG ID format |
| `404` | PG not found or `isActive: false` |

---

## Admissions

> Route file: `backend/src/routes/admission.routes.js`
> Controller: `backend/src/controllers/admission.controller.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admissions` | JWT + user | Submit an admission request to a PG |
| GET | `/api/admissions/mine` | JWT + user | Get the caller's current active admission |

---

### POST `/api/admissions`

> `backend/src/controllers/admission.controller.js` — line 8

Apply to live at a PG. A user can only have **one active admission at a time** — either `pending` or `admitted` — across the entire platform.

**Request body:**
```json
{ "pgId": "ObjectId (required)", "moveInNote": "string (optional)" }
```

`moveInNote` is free text shown to the pg_owner when reviewing the request (expected move-in date, context, etc.).

**Constraints:**
- `pgId` must reference an active (`isActive: true`) PG.
- If the user already has any `pending` or `admitted` record anywhere on the platform, the request is rejected.
- There is **no cancel/withdraw endpoint** — once submitted, only the owner or admin can decide it.

**Response `201`:**
```json
{
  "success": true,
  "message": "Admission request submitted",
  "data": {
    "_id": "ObjectId",
    "userId": "ObjectId",
    "pgId": "ObjectId",
    "status": "pending",
    "moveInNote": "string",
    "escalatedAt": null,
    "processedBy": { "role": null, "userId": null },
    "createdAt": "Date"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| `400` | `pgId` is missing |
| `400` | Invalid `pgId` format |
| `400` | User already has a `pending` or `admitted` admission anywhere on the platform |
| `404` | PG not found or inactive |

---

### GET `/api/admissions/mine`

> `backend/src/controllers/admission.controller.js` — line 55

Returns the user's **current** active admission — the record with `status: "pending"` or `"admitted"`. Returns `null` when no active admission exists.

**No query params.**

> **No history:** Past rejected or revoked admissions are not returned. Once an admission ends (rejected, or admitted then revoked), it vanishes from this endpoint. There is no history endpoint.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "userId": "ObjectId",
    "pgId": {
      "_id": "ObjectId",
      "name": "string",
      "location": "object",
      "images": ["url"],
      "slug": "string"
    },
    "status": "pending | admitted",
    "moveInNote": "string",
    "escalatedAt": "Date | null",
    "processedBy": { "role": "owner | admin | null", "userId": "ObjectId | null" },
    "createdAt": "Date"
  }
}
```

Returns `{ "success": true, "data": null }` when no active admission exists.

`pgId` is populated with `name`, `location`, `images`, and `slug`.

---

## Complaints

> Route file: `backend/src/routes/complaint.routes.js`
> Controller: `backend/src/controllers/complaint.controller.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/complaints` | JWT + user | File a complaint against a PG (admitted residents only) |
| GET | `/api/complaints/mine` | JWT + user | List all complaints ever filed by the caller |

---

### POST `/api/complaints`

> `backend/src/controllers/complaint.controller.js` — line 9

File a complaint against a PG. **Two hard prerequisites:**
1. The caller must have an `admitted` PGResidency record for that `pgId`.
2. The caller must not have submitted another complaint for the same PG within the last 15 minutes (anti-spam cooldown per user+PG pair).

**Request body:**
```json
{
  "pgId": "ObjectId (required)",
  "type": "food | cleanliness | security | management | other (required)",
  "description": "string (required, min 5 chars)",
  "image": "url (optional)",
  "isAnonymous": false
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Complaint created successfully",
  "data": {
    "_id": "ObjectId",
    "pgId": "ObjectId",
    "pgSnapshot": { "name": "string", "city": "string", "area": "string", "ownerName": "string" },
    "type": "string",
    "description": "string",
    "image": "url | null",
    "isAnonymous": false,
    "isVerifiedResident": true,
    "status": "pending",
    "adminRemark": null,
    "createdBy": "ObjectId",
    "createdAt": "Date"
  }
}
```

> `pgSnapshot` is denormalized PG metadata captured at creation time — it will not update if the PG's details change later.
>
> `isAnonymous: true` is a display hint only. `createdBy` is still stored in the database and **exposed to pg_owners** via `GET /api/complaints`. See [Flags & Issues](#flags--issues).

**Errors:**
| Status | Condition |
|--------|-----------|
| `400` | `pgId`, `type`, or `description` is missing |
| `400` | Invalid `pgId` format |
| `400` | `description` shorter than 5 characters |
| `400` | `type` not one of the valid enum values |
| `403` | Caller is not an admitted resident of that PG (`NOT_VERIFIED_RESIDENT`) |
| `404` | PG not found or inactive |
| `429` | Another complaint for the same PG was submitted within the last 15 minutes |

---

### GET `/api/complaints/mine`

> `backend/src/controllers/complaint.controller.js` — line 95

Returns **all** complaints ever filed by the caller across all PGs, sorted newest first. Unlike `GET /api/admissions/mine`, this includes historical records — `approved` and `rejected` ones are returned.

**No query params. No pagination.**

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "pgId": "ObjectId",
      "pgSnapshot": { "name": "string", "city": "string", "area": "string", "ownerName": "string" },
      "type": "food | cleanliness | security | management | other",
      "description": "string",
      "image": "url | null",
      "isAnonymous": false,
      "isVerifiedResident": true,
      "status": "pending | approved | rejected",
      "adminRemark": null,
      "createdAt": "Date"
    }
  ]
}
```

> No pagination — returns the full history in one response. Can grow large for active users.

---

## Testimonials

> Route file: `backend/src/routes/testimonial.routes.js`
> Controller: `backend/src/controllers/testimonial.controller.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/testimonials` | None (public) | Approved and visible testimonials for a PG |
| POST | `/api/testimonials` | JWT + user | Submit a testimonial (admitted residents only; one per user per PG) |
| GET | `/api/testimonials/mine` | JWT + user | All testimonials submitted by the caller |

---

### GET `/api/testimonials`

> `backend/src/controllers/testimonial.controller.js` — line 75

**Query params:**

| Param | Type | Notes |
|-------|------|-------|
| `pgId` | ObjectId | **Required.** Returns `400` if missing or invalid. |

Returns only testimonials where `status === "approved"` and `isVisible === true`.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "pgId": "ObjectId",
      "pgSnapshot": { "name": "string", "city": "string", "area": "string" },
      "createdBy": { "name": "string" },
      "content": "string",
      "rating": 5,
      "isVerifiedResident": true,
      "status": "approved",
      "isVisible": true,
      "createdAt": "Date"
    }
  ]
}
```

---

### POST `/api/testimonials`

> `backend/src/controllers/testimonial.controller.js` — line 8

Submit a testimonial for a PG the caller is currently admitted to. **One testimonial per user per PG** — enforced both in the controller and by a MongoDB unique index.

**Request body:**
```json
{
  "pgId": "ObjectId (required)",
  "content": "string (required)",
  "rating": "number 1–5 (required)"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Testimonial submitted for owner review",
  "data": {
    "_id": "ObjectId",
    "pgId": "ObjectId",
    "pgSnapshot": { "name": "string", "city": "string", "area": "string" },
    "createdBy": "ObjectId",
    "content": "string",
    "rating": 5,
    "isVerifiedResident": true,
    "status": "pending",
    "isVisible": false,
    "createdAt": "Date"
  }
}
```

> Testimonials start as `status: "pending"` and `isVisible: false`. The pg_owner must approve and set `isVisible: true` before the testimonial appears on the public endpoint. Users can track their testimonial's moderation status via `GET /api/testimonials/mine`.

**Errors:**
| Status | Condition |
|--------|-----------|
| `400` | `pgId`, `content`, or `rating` is missing |
| `400` | Invalid `pgId` format |
| `400` | `rating` is not between 1 and 5 |
| `403` | Caller is not an admitted resident of that PG |
| `404` | PG not found |
| `409` | Caller has already submitted a testimonial for this PG |

---

### GET `/api/testimonials/mine`

> `backend/src/controllers/testimonial.controller.js` — line 96

Returns all testimonials ever submitted by the caller across all PGs, including `pending` and `rejected` ones.

**No query params. No pagination.**

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "pgId": "ObjectId",
      "pgSnapshot": { "name": "string", "city": "string", "area": "string" },
      "content": "string",
      "rating": 5,
      "isVerifiedResident": true,
      "status": "pending | approved | rejected",
      "isVisible": true,
      "createdAt": "Date"
    }
  ]
}
```

---

## Deprecated — Legacy Residency

> Route file: `backend/src/routes/pgResidency.routes.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| ALL | `/api/verify-residency/*` | — | **410 Gone** — replaced by `/api/admissions` as of `2025-01-01` |

All requests return:
```json
{
  "status": "gone",
  "message": "This endpoint has been deprecated and is no longer available.",
  "deprecatedAt": "2025-01-01"
}
```

> If the Student PWA was built before this deprecation and cached via its service worker, stale clients may still call it. The service worker cache strategy should be verified for this status code.

---

## Flags & Issues

| Severity | Issue | File | Line |
|----------|-------|------|------|
| **High** | No account management API exists — users cannot update their name, email, or password through any endpoint after registration. | — | — |
| **High** | No way to **withdraw or cancel a pending admission request**. Once submitted, only the owner or admin can act on it. A user stuck in `pending` at one PG cannot apply elsewhere until it is decided. There is no timeout or auto-expiry (escalation job not wired into server startup). | `admission.routes.js` | 16 |
| **Medium** | `GET /api/admissions/mine` returns only the **current active** admission — there is no history endpoint. Past rejected or revoked admissions are invisible to the user. | `admission.controller.js` | 55 |
| **Medium** | `isAnonymous: true` on a complaint is a **display-only flag**. `createdBy` is always stored and always returned to pg_owners via `GET /api/complaints`. Anonymity is not enforced at the data layer. | `complaint.controller.js` | 139 |
| **Medium** | `GET /api/complaints/mine` and `GET /api/testimonials/mine` have **no pagination** — both return the full dataset in a single unbounded response. | `complaint.controller.js`, `testimonial.controller.js` | 95, 96 |
| **Medium** | A user who is admitted and then **revoked** by the owner has their status set to `"rejected"` — identical to a declined application. There is no distinction between "rejected application" and "evicted resident" in the model or any API response. | `pgResidency.js` | 10 |
| **Low** | `POST /api/auth/register` silently ignores any `role` field in the body — always sets `role: "user"`. No validation error or warning is returned if an unrecognised field is sent. | `auth.controller.js` | 20 |
| **Low** | `POST /api/complaints` anti-spam (15-min cooldown) runs a `countDocuments` query on MongoDB on every submission — no caching or token-bucket middleware is used. | `complaint.controller.js` | 30 |
| **Low** | No endpoint to check email availability before registration. A duplicate email is only discoverable by attempting `POST /api/auth/register` and receiving a `400`. | `auth.controller.js` | 12 |
| **Info** | The Student PWA (`frontend/src/platforms/student-pwa/`) is a separate Vite build (`npm run dev:student`, port 5173) with a service worker. It produces a ~48% smaller bundle by tree-shaking admin/owner code. Users of the PWA authenticate with `role: "user"` — the `student` role no longer exists. | `frontend/src/main.jsx` | 6 |
