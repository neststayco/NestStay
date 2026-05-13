# PG Owner API Reference

> **Auth mechanism:** `Authorization: Bearer <JWT>` on all protected routes. Token expires in 7 days.
> PG owner accounts are created by the platform admin via `POST /api/admin/owners` — self-registration is not possible.
>
> **Critical prerequisite:** Every PG owner endpoint reads `req.user.pgId` from the JWT user record. If a PG owner account has no `pgId` assigned (not yet linked to a PG), all owner-scoped endpoints return `400 Bad Request`. The `pgId` is set at account creation time by admin and can be updated via `PATCH /api/admin/owners/:id`.

---

## Table of Contents

1. [Authentication](#authentication)
2. [PG Property Management](#pg-property-management)
3. [Complaints](#complaints)
4. [Admissions (Residents)](#admissions-residents)
5. [Testimonials](#testimonials)
6. [ImageKit Upload Auth](#imagekit-upload-auth)
7. [Read-Only Access (Public / Optional Auth)](#read-only-access-public--optional-auth)
8. [Flags & Issues](#flags--issues)

---

## Authentication

> Route file: `backend/src/routes/auth.routes.js`
> Controller: `backend/src/controllers/auth.controller.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | None | Login with email + password; returns user object and signed JWT |

**Rate limit:** 20 requests / 15 min window on all `/api/auth/*` routes.

**Request:**
```json
{ "email": "string", "password": "string" }
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "name": "string",
    "email": "string",
    "role": "pg_owner",
    "pgId": "ObjectId"
  },
  "token": "<jwt>"
}
```

> Note: `pgId` is returned in the login response and should be stored client-side — it identifies which PG this owner manages throughout all subsequent requests.

---

## PG Property Management

> Route file: `backend/src/routes/pg.routes.js`
> Controller: `backend/src/controllers/pg.controller.js`

PG owners **cannot create, fully update, or delete** their PG listing — those actions are admin-only. Owners have three targeted self-service patch endpoints scoped to `req.user.pgId`.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PATCH | `/api/pgs/my/images` | JWT + pg_owner | Replace the PG's images array |
| PATCH | `/api/pgs/my/location` | JWT + pg_owner | Update the PG's map coordinates |
| PATCH | `/api/pgs/my/capacity` | JWT + pg_owner | Update the PG's total bed capacity |

> All three routes resolve the target PG from `req.user.pgId` — no `:id` param is accepted. An owner cannot update another PG's data.

---

### PATCH `/api/pgs/my/images`

> `backend/src/controllers/pg.controller.js` — line 302

Replace the PG's entire images array with a new list of URLs (e.g., after uploading via ImageKit).

**Request body:**
```json
{ "images": ["url1", "url2"] }
```

- `images` must be an array (empty array is accepted to clear all images).

**Response `200`:**
```json
{
  "success": true,
  "message": "Images updated",
  "data": { "...fullPGDocument": "..." }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| `400` | `req.user.pgId` is not set on the owner account |
| `400` | `images` is not an array |
| `404` | PG document not found |

---

### PATCH `/api/pgs/my/location`

> `backend/src/controllers/pg.controller.js` — line 327

Update the latitude/longitude coordinates for map display.

**Request body:**
```json
{ "lat": 18.5204, "lng": 73.8567 }
```

- Both `lat` and `lng` are required and must be valid numbers.

**Response `200`:**
```json
{
  "success": true,
  "message": "Location updated",
  "data": { "...fullPGDocument": "..." }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| `400` | `req.user.pgId` is not set |
| `400` | `lat` or `lng` missing or not a number |
| `404` | PG document not found |

---

### PATCH `/api/pgs/my/capacity`

> `backend/src/controllers/pg.controller.js` — line 354

Update the total bed capacity, which feeds the `remainingCapacity` calculation shown to guests browsing PG details.

**Request body:**
```json
{ "totalCapacity": 20 }
```

- Must be a non-negative number. Updates `accommodation.totalCapacity`.

**Response `200`:**
```json
{
  "success": true,
  "message": "Capacity updated",
  "data": { "...fullPGDocument": "..." }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| `400` | `req.user.pgId` is not set |
| `400` | `totalCapacity` is missing, not a number, or negative |
| `404` | PG document not found |

---

## Complaints

> Route file: `backend/src/routes/complaint.routes.js`
> Controller: `backend/src/controllers/complaint.controller.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/complaints` | JWT + pg_owner (or admin) | List complaints for the owner's PG — always scoped to `req.user.pgId` |
| PATCH | `/api/complaints/:id` | JWT + **pg_owner only** | Update a complaint's status |

> pg_owner cannot view complaints for any PG other than their own. Even if `?pgId=` is passed in the query, it is ignored and overridden with `req.user.pgId`.

---

### GET `/api/complaints`

> `backend/src/controllers/complaint.controller.js` — line 109

Returns paginated complaints for the owner's PG. The `pgId` filter is always forcibly set to `req.user.pgId` regardless of query params.

**Query params:**

| Param | Type | Notes |
|-------|------|-------|
| `status` | string | `pending \| approved \| rejected` — omit to get all |
| `verifiedOnly` | `"true"` | Only show complaints from verified (admitted) residents |
| `page` | number | Default: `1` |
| `limit` | number | Default: `10` |

**Response `200`:**
```json
{
  "success": true,
  "message": "Complaints fetched",
  "data": [
    {
      "_id": "ObjectId",
      "pgId": { "name": "string", "location": { "address": "string" }, "owner": {} },
      "createdBy": { "name": "string", "email": "string" },
      "type": "food | cleanliness | security | management | other",
      "description": "string",
      "image": "url | null",
      "isAnonymous": false,
      "isVerifiedResident": true,
      "status": "pending | approved | rejected",
      "pgSnapshot": { "name": "string", "city": "string", "area": "string", "ownerName": "string" },
      "adminRemark": null,
      "createdAt": "Date",
      "updatedAt": "Date"
    }
  ],
  "pagination": {
    "totalItems": 0,
    "currentPage": 1,
    "totalPages": 0,
    "limit": 10
  }
}
```

> Note: `createdBy.name` and `createdBy.email` are always returned even for anonymous complaints — `isAnonymous: true` is a flag for display purposes only. The client UI should decide whether to show the author's name based on this flag.

---

### PATCH `/api/complaints/:id`

> `backend/src/controllers/complaint.controller.js` — line 165

Update the status of a complaint. The controller enforces that the complaint belongs to the owner's PG.

**Request body:**
```json
{ "status": "approved | rejected | pending" }
```

Valid status values (from model enum): `pending`, `approved`, `rejected`

**Response `200`:**
```json
{
  "success": true,
  "message": "Complaint updated",
  "data": { "...fullComplaintDocument": "..." }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| `400` | Invalid complaint ID format |
| `400` | `status` is not one of the valid enum values |
| `403` | Complaint belongs to a different PG than `req.user.pgId` |
| `404` | Complaint not found |

> ⚠️ `adminRemark` field exists on the Complaint model but **this endpoint does not write to it**. There is currently no API route for setting `adminRemark`. See [Flags & Issues](#flags--issues).

---

## Admissions (Residents)

> Route file: `backend/src/routes/admission.routes.js`
> Controller: `backend/src/controllers/admission.controller.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admissions/pg` | JWT + pg_owner | List all admission requests for the owner's PG |
| POST | `/api/admissions/owner-add` | JWT + pg_owner | Directly admit a registered guest by email (bypasses request flow) |
| PATCH | `/api/admissions/:id/decide` | JWT + pg_owner (or admin) | Approve or reject a `pending` admission |
| PATCH | `/api/admissions/:id/revoke` | JWT + pg_owner (or admin) | Revoke (remove) an `admitted` guest |

---

### GET `/api/admissions/pg`

> `backend/src/controllers/admission.controller.js` — line 75

Returns paginated admissions for the owner's PG. Always scoped to `req.user.pgId`.

**Query params:**

| Param | Type | Notes |
|-------|------|-------|
| `status` | string | `pending \| admitted \| rejected` — omit to get all |
| `page` | number | Default: `1` |
| `limit` | number | Default: `15` |

Sorted by: `createdAt desc`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "userId": { "name": "string", "email": "string" },
      "pgId": "ObjectId",
      "status": "pending | admitted | rejected",
      "moveInNote": "string",
      "escalatedAt": "Date | null",
      "revokedAt": "Date | null",
      "revokedBy": "ObjectId | null",
      "processedBy": { "role": "owner | admin", "userId": "ObjectId" },
      "createdAt": "Date",
      "updatedAt": "Date"
    }
  ],
  "pagination": { "totalItems": 0, "currentPage": 1, "totalPages": 0, "limit": 15 }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| `400` | `req.user.pgId` is not set on the owner account |

---

### POST `/api/admissions/owner-add`

> `backend/src/controllers/admission.controller.js` — line 210

Allows the owner to directly admit a registered guest without requiring them to submit a request first. Creates a `PGResidency` record with `status: "admitted"` immediately.

**Request body:**
```json
{ "email": "string (required)" }
```

The guest must already have an account with `role: "user"`. The lookup is case-insensitive and trimmed.

**Response `201`:**
```json
{
  "success": true,
  "message": "Guest added successfully",
  "data": {
    "_id": "ObjectId",
    "userId": { "name": "string", "email": "string" },
    "pgId": "ObjectId",
    "status": "admitted",
    "processedBy": { "role": "owner", "userId": "ObjectId" },
    "moveInNote": "",
    "createdAt": "Date"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| `400` | `email` field is missing |
| `400` | `req.user.pgId` is not set |
| `400` | The guest already has an active (`pending` or `admitted`) admission anywhere on the platform |
| `404` | No `user` account found with that email |

---

### PATCH `/api/admissions/:id/decide`

> `backend/src/controllers/admission.controller.js` — line 158

Approve or reject a guest's pending admission request. The owner can only decide on admissions for their own PG — this is enforced inside the controller, not at the route middleware level.

**Request body:**
```json
{ "decision": "admitted | rejected" }
```

**Constraints:**
- Only works when `admission.status === "pending"`.
- The resolved admission will have `processedBy: { role: "owner", userId: <ownerId> }`.

**Response `200`:**
```json
{
  "success": true,
  "message": "Admission admitted",
  "data": {
    "_id": "ObjectId",
    "status": "admitted | rejected",
    "processedBy": { "role": "owner", "userId": "ObjectId" }
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| `400` | Invalid admission ID format |
| `400` | `decision` is not `"admitted"` or `"rejected"` |
| `400` | Admission is not in `pending` status |
| `403` | Admission belongs to a different PG than `req.user.pgId` |
| `404` | Admission not found |

---

### PATCH `/api/admissions/:id/revoke`

> `backend/src/controllers/admission.controller.js` — line 272

Remove a guest from the PG. The owner can only revoke guests from their own PG.

**Request body:** _(none required)_

Sets `status: "rejected"`, `revokedAt: <now>`, `revokedBy: <ownerId>`.

**Constraints:**
- Only works when `admission.status === "admitted"`.
- Revoked guests are free to apply to another PG after this.

**Response `200`:**
```json
{
  "success": true,
  "message": "Admission revoked",
  "data": {
    "_id": "ObjectId",
    "status": "rejected",
    "revokedAt": "Date",
    "revokedBy": "ObjectId"
  }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| `400` | Invalid admission ID format |
| `400` | Admission status is not `admitted` |
| `403` | Admission belongs to a different PG than `req.user.pgId` |
| `404` | Admission not found |

---

## Testimonials

> Route file: `backend/src/routes/testimonial.routes.js`
> Controller: `backend/src/controllers/testimonial.controller.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/testimonials/pg` | JWT + pg_owner | All testimonials for the owner's PG (all statuses) |
| PATCH | `/api/testimonials/:id` | JWT + pg_owner (or admin) | Approve, reject, or toggle visibility of a testimonial |

---

### GET `/api/testimonials/pg`

> `backend/src/controllers/testimonial.controller.js` — line 110

Returns all testimonials submitted for the owner's PG, including `pending` and `rejected` ones (unlike the public endpoint which returns only `approved + visible`).

**Query params:**

| Param | Type | Notes |
|-------|------|-------|
| `status` | string | `pending \| approved \| rejected` — omit to get all |
| `page` | number | Default: `1` |
| `limit` | number | Default: `20` |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "pgId": "ObjectId",
      "pgSnapshot": { "name": "string", "city": "string", "area": "string" },
      "createdBy": { "name": "string", "email": "string" },
      "content": "string",
      "rating": 5,
      "isVerifiedResident": true,
      "status": "pending | approved | rejected",
      "isVisible": true,
      "createdAt": "Date"
    }
  ],
  "pagination": { "totalItems": 0, "currentPage": 1, "totalPages": 0 }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| `400` | `req.user.pgId` is not set |

---

### PATCH `/api/testimonials/:id`

> `backend/src/controllers/testimonial.controller.js` — line 147

Moderate a testimonial — approve, reject, or toggle public visibility. The owner is scoped to testimonials belonging to their own PG (enforced in controller).

**Request body:**
```json
{ "status": "pending | approved | rejected", "isVisible": true }
```

Both fields are optional — send only what you want to change.

**Business rules enforced in controller:**
- Rejecting (`status: "rejected"`) automatically sets `isVisible: false`.
- Setting `isVisible: true` is rejected unless `testimonial.status === "approved"`.
- pg_owner can only act on testimonials for their own PG.

**Response `200`:**
```json
{
  "success": true,
  "message": "Testimonial updated",
  "data": { "...fullTestimonialDocument": "..." }
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| `400` | Invalid testimonial ID format |
| `400` | `status` is not one of `pending`, `approved`, `rejected` |
| `400` | Attempting to set `isVisible: true` on a non-approved testimonial |
| `403` | Testimonial belongs to a different PG than `req.user.pgId` |
| `404` | Testimonial not found |

---

## ImageKit Upload Auth

> Route file: `backend/src/routes/imagekit.routes.js`
> Controller: `backend/src/controllers/imagekit.controller.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/imagekit/auth` | JWT + pg_owner (or admin) | Get signed credentials for client-side ImageKit upload |

**No request body or query params.**

Used by the frontend before uploading images. Returns a short-lived signed token, expire timestamp, and signature that the ImageKit JS SDK requires to upload files directly from the browser.

After upload, pass the returned CDN URLs to `PATCH /api/pgs/my/images`.

---

## Read-Only Access (Public / Optional Auth)

These endpoints are not pg_owner-specific but are regularly used by the owner dashboard to read PG and listing data.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/pgs` | None (public) | Browse all active PGs with filters |
| GET | `/api/pgs/:id` | Optional JWT | Full PG details with trust metrics |
| GET | `/api/testimonials?pgId=` | None (public) | Approved + visible testimonials for a PG |

See the [Platform Admin API Reference](./platform_Admin_apis.md) for full query param documentation on these shared endpoints.

---

## Flags & Issues

| Severity | Issue | File | Line |
|----------|-------|------|------|
| **High** | `adminRemark` field exists on the `Complaint` model but **no API writes to it** — `PATCH /api/complaints/:id` only updates `status`. Owners cannot add resolution notes to complaints. | `Complaint.js` | 64 |
| **High** | Ownership enforcement on `PATCH /api/admissions/:id/decide` and `/revoke` is done **inside the controller**, not at route middleware. A pg_owner with no `pgId` set will hit the controller and get a generic `403`. Route-level `allowRoles` does not protect against PG mismatch. | `admission.controller.js` | 178, 286 |
| **Medium** | `req.user.pgId` is not set → **all owner endpoints return `400`** with no clear indication to the user that the account is misconfigured. No self-service way for an owner to check or know their `pgId`. | Multiple controllers | — |
| **Medium** | `POST /api/admissions/owner-add` bypasses the standard admission request flow entirely. A guest can be admitted **without their knowledge or consent** before they even apply. No notification is sent (notification service is a stub). | `admission.controller.js` | 210 |
| **Medium** | PG owners **cannot view or update their own account profile** (name, email, password) via any API. The only way to update their account is through admin — `PATCH /api/admin/owners/:id` (only updates `pgId`) and `PATCH /api/admin/owners/:id/password`. | — | — |
| **Low** | `GET /api/complaints` returns `createdBy.name` and `createdBy.email` **even when `isAnonymous: true`**. Anonymity is a display-only flag — the backend always exposes the author's identity to the pg_owner. | `complaint.controller.js` | 139 |
| **Low** | Escalation job (`src/jobs/escalation.job.js`) sets `escalatedAt` on overdue pending admissions, but the job is **not wired into server startup**. Owners will never see escalated admissions surface through the system automatically. | `escalation.job.js` | — |
| **Low** | `PATCH /api/complaints/:id` validates `status` against `Complaint.schema.path("status").enumValues` — meaning valid values are derived at runtime from the Mongoose schema. If the schema enum changes, the validation updates automatically but the API contract is implicit and undocumented in the route. | `complaint.controller.js` | 175 |
| **Info** | `GET /api/admissions/pg` has no `escalated` filter (unlike the admin `GET /api/admissions` which supports `?escalated=true`). Owners cannot easily surface overdue pending requests without client-side filtering. | `admission.routes.js` | 20 |
