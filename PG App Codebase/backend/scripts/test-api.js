/**
 * Full API test suite — Nest Stay
 * Run: node scripts/test-api.js
 * Requires: backend running on localhost:3000, DB seeded
 */

const BASE = 'http://localhost:3000'

// ── Credentials from seed ────────────────────────────────────
const ADMIN    = { email: 'admin@pgapp.com',              password: 'Admin@123' }
const OWNER    = { email: 'owner1@pgapp.com',             password: 'Owner@123' }
const USER     = { email: 'rahul.sharma@student.com',     password: 'Student@123' }   // admitted PG0, has complaint
const USER2    = { email: 'priya.patel@student.com',      password: 'Student@123' }   // admitted PG1
const USER3    = { email: 'amit.kumar@student.com',       password: 'Student@123' }   // admitted PG2
const USER4    = { email: 'sneha.joshi@student.com',      password: 'Student@123' }   // no residency — use for admission/complaint/testimonial flow

// ── State ────────────────────────────────────────────────────
const state = {
  adminToken: null,
  ownerToken: null,
  userToken: null,
  user2Token: null,
  user3Token: null,
  user4Token: null,
  ownerPgId: null,
  adminCookie: null,
  ownerCookie: null,
  userCookie: null,
  pgId: null,
  pgSlug: null,
  admissionId: null,
  complaintId: null,
  testimonialId: null,
  ownerId: null,
  userId: null,
  createdPgId: null,
}

// ── Counters ─────────────────────────────────────────────────
let passed = 0
let failed = 0
let skipped = 0
const failures = []

// ── Helpers ──────────────────────────────────────────────────
function color(code, str) { return `\x1b[${code}m${str}\x1b[0m` }
const green  = s => color(32, s)
const red    = s => color(31, s)
const yellow = s => color(33, s)
const cyan   = s => color(36, s)
const bold   = s => color(1, s)

function section(name) {
  console.log(`\n${bold(cyan(`── ${name} ${'─'.repeat(Math.max(0, 50 - name.length))}`))}`)
}

function pass(name) {
  passed++
  console.log(`  ${green('✓')} ${name}`)
}

function fail(name, reason) {
  failed++
  failures.push({ name, reason })
  console.log(`  ${red('✗')} ${name}`)
  console.log(`    ${red(reason)}`)
}

function skip(name, reason) {
  skipped++
  console.log(`  ${yellow('○')} ${name} ${yellow(`(skip: ${reason})`)}`)
}

async function req(method, path, { body, token, cookie, expectStatus = 200, label } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token)  headers['Authorization'] = `Bearer ${token}`
  if (cookie) headers['Cookie'] = cookie

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    })

    const text = await res.text()
    let json
    try { json = JSON.parse(text) } catch { json = { raw: text } }

    const ok = Array.isArray(expectStatus)
      ? expectStatus.includes(res.status)
      : res.status === expectStatus

    // Extract Set-Cookie if present
    const setCookie = res.headers.get('set-cookie')

    return { status: res.status, json, ok, setCookie, headers: res.headers }
  } catch (err) {
    return { status: 0, json: {}, ok: false, error: err.message }
  }
}

async function test(name, fn) {
  try {
    await fn()
  } catch (err) {
    fail(name, err.message)
  }
}

// ════════════════════════════════════════════════════════════════
// TESTS
// ════════════════════════════════════════════════════════════════

async function testHealth() {
  section('HEALTH')
  await test('GET /health → 200', async () => {
    const r = await req('GET', '/health')
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}`)
    if (r.json.status !== 'ok') throw new Error(`status not "ok": ${JSON.stringify(r.json)}`)
    pass('GET /health → 200, status=ok')
  })
}

async function testLogin() {
  section('AUTH — LOGIN')

  await test('POST /api/auth/login — admin', async () => {
    const r = await req('POST', '/api/auth/login', { body: ADMIN })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    if (!r.json.accessToken) throw new Error('No accessToken in response')
    state.adminToken = r.json.accessToken
    if (r.setCookie) state.adminCookie = r.setCookie
    pass('POST /api/auth/login — admin → 200 + token')
  })

  await test('POST /api/auth/login — pg_owner', async () => {
    const r = await req('POST', '/api/auth/login', { body: OWNER })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    if (!r.json.accessToken) throw new Error('No accessToken in response')
    state.ownerToken = r.json.accessToken
    if (r.setCookie) state.ownerCookie = r.setCookie
    pass('POST /api/auth/login — owner → 200 + token')
  })

  // user4 first (no residency — admission/complaint/testimonial flow)
  await test('POST /api/auth/login — user4 (no residency)', async () => {
    const r = await req('POST', '/api/auth/login', { body: USER4 })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    if (!r.json.accessToken) throw new Error('No accessToken in response')
    state.user4Token = r.json.accessToken
    pass('POST /api/auth/login — user4 → 200 + token')
  })

  // user (Rahul — admitted PG0) for "mine" endpoint coverage
  await test('POST /api/auth/login — user (admitted PG0)', async () => {
    const r = await req('POST', '/api/auth/login', { body: USER })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    if (!r.json.accessToken) throw new Error('No accessToken in response')
    state.userToken = r.json.accessToken
    if (r.setCookie) state.userCookie = r.setCookie
    state.userId = r.json.data?._id
    pass('POST /api/auth/login — user → 200 + token')
  })

  // wrong password — 5th attempt, at the rate limit boundary
  await test('POST /api/auth/login — wrong password → 401 or 429', async () => {
    const r = await req('POST', '/api/auth/login', {
      body: { email: ADMIN.email, password: 'wrongpass' },
      expectStatus: [401, 429],
    })
    if (!r.ok) throw new Error(`Expected 401 or 429 (rate-limit), got ${r.status}`)
    pass(`POST /api/auth/login — wrong password → ${r.status}`)
  })

}

async function testGetMe() {
  section('AUTH — GET ME')

  await test('GET /api/auth/me — admin', async () => {
    if (!state.adminToken) throw new Error('No admin token — login failed')
    const r = await req('GET', '/api/auth/me', { token: state.adminToken })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    if (r.json.data?.role !== 'admin') throw new Error(`Expected role=admin, got ${r.json.data?.role}`)
    pass('GET /api/auth/me — admin → 200, role=admin')
  })

  await test('GET /api/auth/me — owner (captures ownerPgId)', async () => {
    if (!state.ownerToken) throw new Error('No owner token')
    const r = await req('GET', '/api/auth/me', { token: state.ownerToken })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    state.ownerPgId = r.json.data?.pgId
    pass(`GET /api/auth/me — owner → 200, pgId=${state.ownerPgId}`)
  })

  await test('GET /api/auth/me — no token → 401', async () => {
    const r = await req('GET', '/api/auth/me', { expectStatus: 401 })
    if (!r.ok) throw new Error(`Expected 401, got ${r.status}`)
    pass('GET /api/auth/me — no token → 401')
  })

  await test('GET /api/auth/me — bad token → 401', async () => {
    const r = await req('GET', '/api/auth/me', {
      token: 'garbage.token.here',
      expectStatus: 401,
    })
    if (!r.ok) throw new Error(`Expected 401, got ${r.status}`)
    pass('GET /api/auth/me — bad token → 401')
  })
}

async function testTokenRefresh() {
  section('AUTH — TOKEN REFRESH')

  await test('POST /api/auth/refresh — with cookie', async () => {
    if (!state.userCookie) return skip('refresh with cookie', 'no cookie captured')
    const r = await req('POST', '/api/auth/refresh', {
      cookie: state.userCookie,
    })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    if (!r.json.accessToken) throw new Error('No new accessToken returned')
    state.userToken = r.json.accessToken  // update to new rotated token
    pass('POST /api/auth/refresh — rotates token → 200')
  })

  await test('POST /api/auth/refresh — no cookie → 401', async () => {
    const r = await req('POST', '/api/auth/refresh', { expectStatus: 401 })
    if (!r.ok) throw new Error(`Expected 401, got ${r.status}`)
    pass('POST /api/auth/refresh — no cookie → 401')
  })
}

async function testOtpRegistration() {
  section('AUTH — REGISTER (OTP flow)')
  const testEmail = `testuser_${Date.now()}@example.com`

  await test('POST /api/auth/register/initiate → 200', async () => {
    const r = await req('POST', '/api/auth/register/initiate', {
      body: { email: testEmail },
    })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass('POST /api/auth/register/initiate → 200 (OTP in server console)')
  })

  await test('POST /api/auth/register/initiate duplicate → 409', async () => {
    const r = await req('POST', '/api/auth/register/initiate', {
      body: { email: ADMIN.email },
      expectStatus: 409,
    })
    if (!r.ok) throw new Error(`Expected 409, got ${r.status}`)
    pass('POST /api/auth/register/initiate existing email → 409')
  })

  await test('POST /api/auth/register/initiate resend within 60s → 429', async () => {
    const r = await req('POST', '/api/auth/register/initiate', {
      body: { email: testEmail },
      expectStatus: 429,
    })
    if (!r.ok) throw new Error(`Expected 429, got ${r.status}`)
    pass('POST /api/auth/register/initiate resend cooldown → 429')
  })

  await test('POST /api/auth/register/verify wrong OTP → 400', async () => {
    const r = await req('POST', '/api/auth/register/verify', {
      body: { email: testEmail, otp: '000000', name: 'Test', password: 'Test@1234' },
      expectStatus: 400,
    })
    if (!r.ok) throw new Error(`Expected 400, got ${r.status}`)
    pass('POST /api/auth/register/verify wrong OTP → 400')
  })

  await test('POST /api/auth/register/initiate invalid email → 400', async () => {
    const r = await req('POST', '/api/auth/register/initiate', {
      body: { email: 'not-an-email' },
      expectStatus: 400,
    })
    if (!r.ok) throw new Error(`Expected 400, got ${r.status}`)
    pass('POST /api/auth/register/initiate invalid email → 400')
  })
}

async function testForgotPassword() {
  section('AUTH — FORGOT / RESET PASSWORD')

  await test('POST /api/auth/forgot-password/initiate — valid email → 200', async () => {
    const r = await req('POST', '/api/auth/forgot-password/initiate', {
      body: { email: USER.email },
    })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass('POST /api/auth/forgot-password/initiate → 200 (OTP in console)')
  })

  await test('POST /api/auth/forgot-password/initiate — unknown email → 200 (enum-safe)', async () => {
    const r = await req('POST', '/api/auth/forgot-password/initiate', {
      body: { email: 'nobody@nowhere.com' },
    })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}`)
    pass('POST /api/auth/forgot-password/initiate unknown email → 200 (enum-safe)')
  })

  await test('POST /api/auth/forgot-password/verify wrong OTP → 400', async () => {
    const r = await req('POST', '/api/auth/forgot-password/verify', {
      body: { email: USER.email, otp: '000000' },
      expectStatus: 400,
    })
    if (!r.ok) throw new Error(`Expected 400, got ${r.status}`)
    pass('POST /api/auth/forgot-password/verify wrong OTP → 400')
  })

  await test('POST /api/auth/reset-password invalid reset token → 401', async () => {
    const r = await req('POST', '/api/auth/reset-password', {
      body: { resetToken: 'garbage', newPassword: 'NewPass@123' },
      expectStatus: 401,
    })
    if (!r.ok) throw new Error(`Expected 401, got ${r.status}`)
    pass('POST /api/auth/reset-password garbage token → 401')
  })
}

async function testLogout() {
  section('AUTH — LOGOUT')

  await test('POST /api/auth/logout → 200', async () => {
    const r = await req('POST', '/api/auth/logout', { cookie: state.user2Token })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass('POST /api/auth/logout → 200')
  })
}

async function testPGList() {
  section('PGs — LIST & DETAIL')

  await test('GET /api/pgs → 200, returns array', async () => {
    const r = await req('GET', '/api/pgs')
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    const pgs = r.json.data?.pgs || r.json.data
    if (!Array.isArray(pgs)) throw new Error(`Expected array, got: ${JSON.stringify(r.json).slice(0,200)}`)
    if (pgs.length === 0) throw new Error('No PGs returned — seed may have failed')
    state.pgId   = pgs[0]._id
    state.pgSlug = pgs[0].slug
    pass(`GET /api/pgs → 200, ${pgs.length} PGs`)
  })

  await test('GET /api/pgs?search=sunshine → filters', async () => {
    const r = await req('GET', '/api/pgs?search=sunshine')
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}`)
    pass('GET /api/pgs?search=sunshine → 200')
  })

  await test('GET /api/pgs?city=Pune → filters', async () => {
    const r = await req('GET', '/api/pgs?city=Pune')
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}`)
    pass('GET /api/pgs?city=Pune → 200')
  })

  await test('GET /api/pgs/:id → 200 detail', async () => {
    if (!state.pgId) throw new Error('No pgId from list — previous test failed')
    const r = await req('GET', `/api/pgs/${state.pgId}`)
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass(`GET /api/pgs/${state.pgId} → 200`)
  })

  await test('GET /api/pgs/:id — authed → includes admission context', async () => {
    if (!state.pgId || !state.userToken) throw new Error('Missing pgId or userToken')
    const r = await req('GET', `/api/pgs/${state.pgId}`, { token: state.userToken })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}`)
    pass(`GET /api/pgs/:id authed → 200 + admission context`)
  })

  await test('GET /api/pgs/invalid-id → 400', async () => {
    const r = await req('GET', '/api/pgs/not-a-valid-id', { expectStatus: 400 })
    if (!r.ok) throw new Error(`Expected 400, got ${r.status}`)
    pass('GET /api/pgs/invalid-id → 400')
  })
}

async function testPGAdmin() {
  section('PGs — ADMIN CRUD')

  await test('POST /api/pgs — admin create PG → 201', async () => {
    if (!state.adminToken) throw new Error('No admin token')
    const payload = {
      name: 'Test PG Created By Test Suite',
      slug: `test-pg-${Date.now()}`,
      description: 'A test PG created by automated test suite',
      location: { country: 'India', state: 'Maharashtra', city: 'Pune', area: 'Hinjewadi', address: '123 Test St' },
      pricing: { rent: 8000, deposit: 16000 },
      accommodation: { gender: 'any', totalCapacity: 10 },
      owner: { name: 'Test Owner', phone: '9876543210', email: 'testowner@pg.com' },
    }
    const r = await req('POST', '/api/pgs', { body: payload, token: state.adminToken, expectStatus: 201 })
    if (!r.ok) throw new Error(`Expected 201, got ${r.status}: ${JSON.stringify(r.json)}`)
    state.createdPgId = r.json.data?._id
    pass(`POST /api/pgs → 201, id=${state.createdPgId}`)
  })

  await test('POST /api/pgs — user token → 403', async () => {
    const r = await req('POST', '/api/pgs', {
      body: { name: 'x' },
      token: state.userToken,
      expectStatus: 403,
    })
    if (!r.ok) throw new Error(`Expected 403, got ${r.status}`)
    pass('POST /api/pgs user token → 403 (forbidden)')
  })

  await test('PATCH /api/pgs/:id — admin update → 200', async () => {
    if (!state.createdPgId) throw new Error('No createdPgId — create test failed')
    const r = await req('PATCH', `/api/pgs/${state.createdPgId}`, {
      body: { description: 'Updated description from test suite' },
      token: state.adminToken,
    })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass(`PATCH /api/pgs/${state.createdPgId} → 200`)
  })

  await test('DELETE /api/pgs/:id — admin soft delete → 200', async () => {
    if (!state.createdPgId) throw new Error('No createdPgId')
    const r = await req('DELETE', `/api/pgs/${state.createdPgId}`, { token: state.adminToken })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass(`DELETE /api/pgs/${state.createdPgId} → 200 (soft delete)`)
  })
}

async function testPGOwnerSelfService() {
  section('PGs — OWNER SELF-SERVICE')

  await test('PATCH /api/pgs/my/details — owner → 200', async () => {
    if (!state.ownerToken) throw new Error('No owner token')
    const r = await req('PATCH', '/api/pgs/my/details', {
      body: { description: 'Updated from test suite', pricing: { rent: 9000, deposit: 18000 } },
      token: state.ownerToken,
    })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass('PATCH /api/pgs/my/details → 200')
  })

  await test('PATCH /api/pgs/my/capacity — owner → 200', async () => {
    const r = await req('PATCH', '/api/pgs/my/capacity', {
      body: { totalCapacity: 15 },
      token: state.ownerToken,
    })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass('PATCH /api/pgs/my/capacity → 200')
  })

  await test('PATCH /api/pgs/my/location — owner → 200', async () => {
    const r = await req('PATCH', '/api/pgs/my/location', {
      body: { lat: 18.5204, lng: 73.8567 },
      token: state.ownerToken,
    })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass('PATCH /api/pgs/my/location → 200')
  })

  await test('PATCH /api/pgs/my/details — user token → 403', async () => {
    const r = await req('PATCH', '/api/pgs/my/details', {
      body: { description: 'shouldfail' },
      token: state.userToken,
      expectStatus: 403,
    })
    if (!r.ok) throw new Error(`Expected 403, got ${r.status}`)
    pass('PATCH /api/pgs/my/details user token → 403')
  })
}

async function testAdmissions() {
  section('ADMISSIONS')

  await test('POST /api/admissions — user4 apply → 201', async () => {
    const targetPg = state.ownerPgId || state.pgId
    if (!targetPg || !state.user4Token) throw new Error('Missing ownerPgId or user4Token')
    const r = await req('POST', '/api/admissions', {
      body: { pgId: targetPg, moveInNote: 'Looking for quiet room' },
      token: state.user4Token,
      expectStatus: 201,
    })
    if (!r.ok) throw new Error(`Expected 201, got ${r.status}: ${JSON.stringify(r.json)}`)
    state.admissionId = r.json.data?._id
    pass(`POST /api/admissions → 201, id=${state.admissionId}`)
  })

  await test('POST /api/admissions — duplicate apply → 400', async () => {
    const targetPg = state.ownerPgId || state.pgId
    const r = await req('POST', '/api/admissions', {
      body: { pgId: targetPg },
      token: state.user4Token,
      expectStatus: 400,
    })
    if (!r.ok) throw new Error(`Expected 400, got ${r.status}`)
    pass('POST /api/admissions duplicate → 400 (already has active)')
  })

  await test('GET /api/admissions/mine — user4 → 200', async () => {
    const r = await req('GET', '/api/admissions/mine', { token: state.user4Token })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass('GET /api/admissions/mine → 200')
  })

  await test('GET /api/admissions/pg — owner → 200', async () => {
    const r = await req('GET', '/api/admissions/pg', { token: state.ownerToken })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass('GET /api/admissions/pg → 200')
  })

  await test('GET /api/admissions — admin → 200', async () => {
    const r = await req('GET', '/api/admissions', { token: state.adminToken })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass('GET /api/admissions admin → 200')
  })

  await test('GET /api/admissions — user token → 403', async () => {
    const r = await req('GET', '/api/admissions', {
      token: state.userToken,
      expectStatus: 403,
    })
    if (!r.ok) throw new Error(`Expected 403, got ${r.status}`)
    pass('GET /api/admissions user token → 403')
  })

  await test('PATCH /api/admissions/:id/decide — owner admit → 200', async () => {
    if (!state.admissionId) throw new Error('No admissionId — apply test failed')
    const r = await req('PATCH', `/api/admissions/${state.admissionId}/decide`, {
      body: { decision: 'admitted' },
      token: state.ownerToken,
    })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass(`PATCH /api/admissions/${state.admissionId}/decide → admitted`)
  })

  await test('PATCH /api/admissions/:id/revoke — owner revoke → 200', async () => {
    if (!state.admissionId) throw new Error('No admissionId')
    const r = await req('PATCH', `/api/admissions/${state.admissionId}/revoke`, {
      token: state.ownerToken,
    })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass(`PATCH /api/admissions/${state.admissionId}/revoke → 200`)
  })

  // Re-apply so user4 can withdraw
  await test('POST /api/admissions — re-apply after revoke → 201', async () => {
    const targetPg = state.ownerPgId || state.pgId
    const r = await req('POST', '/api/admissions', {
      body: { pgId: targetPg },
      token: state.user4Token,
      expectStatus: 201,
    })
    if (!r.ok) throw new Error(`Expected 201, got ${r.status}: ${JSON.stringify(r.json)}`)
    state.admissionId = r.json.data?._id
    pass(`POST /api/admissions re-apply → 201`)
  })

  await test('POST /api/admissions/:id/withdraw — user4 → 200', async () => {
    if (!state.admissionId) throw new Error('No admissionId')
    const r = await req('POST', `/api/admissions/${state.admissionId}/withdraw`, {
      token: state.user4Token,
    })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass(`POST /api/admissions/${state.admissionId}/withdraw → 200`)
  })

  // owner-add user4 (no active admission after withdraw) — admitted to owner's PG for complaint/testimonial tests
  await test('POST /api/admissions/owner-add — owner adds user4 directly → 201', async () => {
    const r = await req('POST', '/api/admissions/owner-add', {
      body: { email: USER4.email },
      token: state.ownerToken,
      expectStatus: 201,
    })
    if (!r.ok) throw new Error(`Expected 201, got ${r.status}: ${JSON.stringify(r.json)}`)
    state.admissionId = r.json.data?._id
    pass('POST /api/admissions/owner-add → 201')
  })
}

async function testComplaints() {
  section('COMPLAINTS')

  // user4 was just admitted via owner-add to owner's PG — no prior complaint
  await test('POST /api/complaints — user4 (admitted) → 201', async () => {
    const targetPg = state.ownerPgId || state.pgId
    if (!targetPg || !state.user4Token) throw new Error('Missing ownerPgId or user4Token')
    const r = await req('POST', '/api/complaints', {
      body: { pgId: targetPg, type: 'security', description: 'Security guard absent at night causing safety concerns' },
      token: state.user4Token,
      expectStatus: 201,
    })
    if (!r.ok) throw new Error(`Expected 201, got ${r.status}: ${JSON.stringify(r.json)}`)
    state.complaintId = r.json.data?._id
    pass(`POST /api/complaints → 201, id=${state.complaintId}`)
  })

  await test('POST /api/complaints — cooldown (15min) → 429', async () => {
    const targetPg = state.ownerPgId || state.pgId
    const r = await req('POST', '/api/complaints', {
      body: { pgId: targetPg, type: 'cleanliness', description: 'Dirty common areas everywhere right now' },
      token: state.user4Token,
      expectStatus: 429,
    })
    if (!r.ok) throw new Error(`Expected 429, got ${r.status}`)
    pass('POST /api/complaints cooldown → 429')
  })

  await test('POST /api/complaints — description too short → 400 or 429', async () => {
    const targetPg = state.ownerPgId || state.pgId
    const r = await req('POST', '/api/complaints', {
      body: { pgId: targetPg, type: 'security', description: 'bad' },
      token: state.user4Token,
      expectStatus: [400, 429],
    })
    if (!r.ok) throw new Error(`Expected 400 or 429, got ${r.status}`)
    pass('POST /api/complaints short description → 400/429')
  })

  await test('GET /api/complaints/mine — user4 → 200', async () => {
    const r = await req('GET', '/api/complaints/mine', { token: state.user4Token })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass('GET /api/complaints/mine → 200')
  })

  await test('GET /api/complaints — owner → 200', async () => {
    const r = await req('GET', '/api/complaints', { token: state.ownerToken })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass('GET /api/complaints owner → 200')
  })

  await test('GET /api/complaints — admin → 200', async () => {
    const r = await req('GET', '/api/complaints', { token: state.adminToken })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass('GET /api/complaints admin → 200')
  })

  await test('GET /api/complaints — user token → 403', async () => {
    const r = await req('GET', '/api/complaints', {
      token: state.userToken,
      expectStatus: 403,
    })
    if (!r.ok) throw new Error(`Expected 403, got ${r.status}`)
    pass('GET /api/complaints user token → 403')
  })

  await test('PATCH /api/complaints/:id — owner update status → 200', async () => {
    if (!state.complaintId) throw new Error('No complaintId')
    const r = await req('PATCH', `/api/complaints/${state.complaintId}`, {
      body: { status: 'approved', adminRemark: 'Will be fixed by end of week' },
      token: state.ownerToken,
    })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass(`PATCH /api/complaints/${state.complaintId} → 200`)
  })
}

async function testTestimonials() {
  section('TESTIMONIALS')

  await test('GET /api/testimonials/featured — public → 200', async () => {
    const r = await req('GET', '/api/testimonials/featured')
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass('GET /api/testimonials/featured → 200')
  })

  await test('GET /api/testimonials?pgId — public → 200', async () => {
    const targetPg = state.ownerPgId || state.pgId
    if (!targetPg) throw new Error('No pgId')
    const r = await req('GET', `/api/testimonials?pgId=${targetPg}`)
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}`)
    pass(`GET /api/testimonials?pgId → 200`)
  })

  // user4 was admitted via owner-add — can post testimonial for owner's PG
  await test('POST /api/testimonials — user4 (admitted) → 201', async () => {
    const targetPg = state.ownerPgId || state.pgId
    if (!state.user4Token || !targetPg) throw new Error('Missing user4Token or ownerPgId')
    const r = await req('POST', '/api/testimonials', {
      body: { pgId: targetPg, content: 'Great place to stay! Clean and well maintained. Staff is very helpful.', rating: 5 },
      token: state.user4Token,
      expectStatus: 201,
    })
    if (!r.ok) throw new Error(`Expected 201, got ${r.status}: ${JSON.stringify(r.json)}`)
    state.testimonialId = r.json.data?._id
    pass(`POST /api/testimonials → 201, id=${state.testimonialId}`)
  })

  await test('POST /api/testimonials — duplicate → 409', async () => {
    const targetPg = state.ownerPgId || state.pgId
    const r = await req('POST', '/api/testimonials', {
      body: { pgId: targetPg, content: 'Great again...', rating: 4 },
      token: state.user4Token,
      expectStatus: 409,
    })
    if (!r.ok) throw new Error(`Expected 409, got ${r.status}`)
    pass('POST /api/testimonials duplicate → 409')
  })

  await test('GET /api/testimonials/mine — user4 → 200', async () => {
    const r = await req('GET', '/api/testimonials/mine', { token: state.user4Token })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}`)
    pass('GET /api/testimonials/mine → 200')
  })

  await test('GET /api/testimonials/pg — owner → 200', async () => {
    const r = await req('GET', '/api/testimonials/pg', { token: state.ownerToken })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}`)
    pass('GET /api/testimonials/pg → 200')
  })

  await test('PATCH /api/testimonials/:id — owner approve → 200', async () => {
    if (!state.testimonialId) throw new Error('No testimonialId')
    const r = await req('PATCH', `/api/testimonials/${state.testimonialId}`, {
      body: { status: 'approved', isVisible: true },
      token: state.ownerToken,
    })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass(`PATCH /api/testimonials/${state.testimonialId} → 200`)
  })

  await test('GET /api/testimonials/admin — admin → 200', async () => {
    const r = await req('GET', '/api/testimonials/admin', { token: state.adminToken })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}`)
    pass('GET /api/testimonials/admin → 200')
  })
}

async function testAdmin() {
  section('ADMIN')

  await test('GET /api/admin/users — admin → 200', async () => {
    const r = await req('GET', '/api/admin/users', { token: state.adminToken })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    const users = r.json.data?.users || r.json.data
    if (Array.isArray(users)) {
      const regular = users.find(u => u.role === 'user')
      if (regular) state.userId = regular._id
    }
    pass(`GET /api/admin/users → 200`)
  })

  await test('GET /api/admin/users — user token → 403', async () => {
    const r = await req('GET', '/api/admin/users', {
      token: state.userToken,
      expectStatus: 403,
    })
    if (!r.ok) throw new Error(`Expected 403, got ${r.status}`)
    pass('GET /api/admin/users user token → 403')
  })

  await test('GET /api/admin/complaints/stats — admin → 200', async () => {
    const r = await req('GET', '/api/admin/complaints/stats', { token: state.adminToken })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}`)
    pass('GET /api/admin/complaints/stats → 200')
  })

  await test('GET /api/admin/complaints/by-pg — admin → 200', async () => {
    const r = await req('GET', '/api/admin/complaints/by-pg', { token: state.adminToken })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}`)
    pass('GET /api/admin/complaints/by-pg → 200')
  })

  await test('GET /api/admin/owners — admin → 200', async () => {
    const r = await req('GET', '/api/admin/owners', { token: state.adminToken })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}`)
    const owners = r.json.data?.owners || r.json.data
    if (Array.isArray(owners) && owners.length > 0) {
      state.ownerId = owners[0]._id
    }
    pass('GET /api/admin/owners → 200')
  })

  await test('POST /api/admin/owners — create owner → 201', async () => {
    if (!state.pgId) throw new Error('No pgId')
    const r = await req('POST', '/api/admin/owners', {
      body: { name: 'New Test Owner', email: `newowner_${Date.now()}@pgapp.com`, password: 'Owner@123', pgId: state.pgId },
      token: state.adminToken,
      expectStatus: 201,
    })
    if (!r.ok) throw new Error(`Expected 201, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass('POST /api/admin/owners → 201')
  })

  await test('PATCH /api/admin/owners/:id — update → 200', async () => {
    if (!state.ownerId) return skip('PATCH /api/admin/owners/:id', 'no ownerId captured')
    const r = await req('PATCH', `/api/admin/owners/${state.ownerId}`, {
      body: { pgId: state.pgId },
      token: state.adminToken,
    })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass(`PATCH /api/admin/owners/${state.ownerId} → 200`)
  })

  await test('PATCH /api/admin/owners/:id/password — reset → 200', async () => {
    if (!state.ownerId) return skip('PATCH /api/admin/owners/:id/password', 'no ownerId captured')
    const r = await req('PATCH', `/api/admin/owners/${state.ownerId}/password`, {
      body: { password: 'Owner@456' },
      token: state.adminToken,
    })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass(`PATCH /api/admin/owners/${state.ownerId}/password → 200`)
  })

  await test('PATCH /api/admin/users/:id/deactivate — admin → 200', async () => {
    if (!state.userId) return skip('deactivate user', 'no userId captured')
    const r = await req('PATCH', `/api/admin/users/${state.userId}/deactivate`, {
      token: state.adminToken,
    })
    if (!r.ok) throw new Error(`Expected 200, got ${r.status}: ${JSON.stringify(r.json)}`)
    pass(`PATCH /api/admin/users/${state.userId}/deactivate → 200`)
  })
}

async function testDeprecatedRoutes() {
  section('DEPRECATED / EDGE ROUTES')

  await test('GET /api/verify-residency/apply → 410 deprecated', async () => {
    const r = await req('GET', '/api/verify-residency/apply', {
      token: state.adminToken,
      expectStatus: 410,
    })
    if (!r.ok) throw new Error(`Expected 410, got ${r.status}`)
    pass('GET /api/verify-residency/apply → 410')
  })

  await test('GET /nonexistent-route → 404', async () => {
    const r = await req('GET', '/api/this-does-not-exist', { expectStatus: 404 })
    if (!r.ok) throw new Error(`Expected 404, got ${r.status}`)
    pass('GET /api/nonexistent → 404')
  })
}

// ════════════════════════════════════════════════════════════════
// RUNNER
// ════════════════════════════════════════════════════════════════

async function run() {
  console.log(bold(`\n${'═'.repeat(60)}`))
  console.log(bold('  NEST STAY — FULL API TEST SUITE'))
  console.log(bold(`  ${new Date().toISOString()}`))
  console.log(bold(`${'═'.repeat(60)}`))

  await testHealth()
  await testLogin()
  await testGetMe()
  await testTokenRefresh()
  await testOtpRegistration()
  await testForgotPassword()
  await testPGList()
  await testPGAdmin()
  await testPGOwnerSelfService()
  await testAdmissions()
  await testComplaints()
  await testTestimonials()
  await testAdmin()
  await testLogout()
  await testDeprecatedRoutes()

  // ── Summary ──────────────────────────────────────────────────
  const total = passed + failed + skipped
  console.log(`\n${bold('═'.repeat(60))}`)
  console.log(bold('  RESULTS'))
  console.log(bold('═'.repeat(60)))
  console.log(`  ${green(`✓ Passed : ${passed}`)}`)
  console.log(`  ${red(`✗ Failed : ${failed}`)}`)
  console.log(`  ${yellow(`○ Skipped: ${skipped}`)}`)
  console.log(`  Total   : ${total}`)

  if (failures.length > 0) {
    console.log(`\n${bold(red('  FAILURES'))}`)
    failures.forEach(f => {
      console.log(`  ${red('✗')} ${f.name}`)
      console.log(`    ${red('→')} ${f.reason}`)
    })
  }

  const pct = Math.round((passed / (passed + failed)) * 100)
  console.log(`\n  Score: ${pct >= 90 ? green(`${pct}%`) : pct >= 70 ? yellow(`${pct}%`) : red(`${pct}%`)}`)
  console.log(bold(`${'═'.repeat(60)}\n`))

  process.exit(failed > 0 ? 1 : 0)
}

run().catch(err => {
  console.error('Test runner crashed:', err)
  process.exit(1)
})
