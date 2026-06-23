import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const MONGO_URI = 'mongodb+srv://db_user:nestconnect1@cluster0.hmfd4oy.mongodb.net/Neststay_DB'

function slugify(name) {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(plain, salt)
}

// ─── 20 PGs ───────────────────────────────────────────────────────────────────
// Index  0-7  : Pune
// Index  8-11 : Mumbai
// Index 12-14 : Bangalore
// Index 15-16 : Hyderabad
// Index 17    : Chennai
// Index 18    : inactive (Pune)
// Index 19    : pending_review / unverified (Bangalore)

const PG_DATA = [
  // ── Pune ──
  { // 0
    name: 'Sunrise Boys PG', city: 'Pune', area: 'Kothrud',
    gender: 'male', rent: 7500, deposit: 15000, maintenance: 500,
    foodType: 'veg', amenities: ['WiFi', 'AC', 'Laundry', 'Parking', 'CCTV'],
    isVerified: true, status: 'active', capacity: 24,
  },
  { // 1
    name: 'Blue Ridge Men PG', city: 'Pune', area: 'Baner',
    gender: 'male', rent: 9000, deposit: 18000, maintenance: 700,
    foodType: 'non-veg', amenities: ['WiFi', 'Gym', 'Food', 'Housekeeping'],
    isVerified: true, status: 'active', capacity: 18,
  },
  { // 2
    name: 'Green Valley Boys PG', city: 'Pune', area: 'Wakad',
    gender: 'male', rent: 6000, deposit: 12000, maintenance: 400,
    foodType: 'veg', amenities: ['WiFi', 'Food', 'Laundry'],
    isVerified: false, status: 'active', capacity: 20,
  },
  { // 3
    name: 'Pink Pearl Girls PG', city: 'Pune', area: 'Kothrud',
    gender: 'female', rent: 8000, deposit: 16000, maintenance: 500,
    foodType: 'veg', amenities: ['WiFi', 'AC', 'Food', 'CCTV', 'Housekeeping'],
    isVerified: true, status: 'active', capacity: 20,
  },
  { // 4
    name: 'Bliss Womens Hostel', city: 'Pune', area: 'Aundh',
    gender: 'female', rent: 10000, deposit: 20000, maintenance: 800,
    foodType: 'both', amenities: ['WiFi', 'AC', 'Gym', 'Food', 'Laundry', 'CCTV'],
    isVerified: true, status: 'active', capacity: 30,
  },
  { // 5
    name: 'Sakura Ladies PG', city: 'Pune', area: 'Hinjewadi',
    gender: 'female', rent: 7000, deposit: 14000, maintenance: 600,
    foodType: 'veg', amenities: ['WiFi', 'Food', 'CCTV'],
    isVerified: false, status: 'active', capacity: 16,
  },
  { // 6
    name: 'Harmony Co-living', city: 'Pune', area: 'Viman Nagar',
    gender: 'mixed', rent: 11000, deposit: 22000, maintenance: 900,
    foodType: 'both', amenities: ['WiFi', 'AC', 'Gym', 'Food', 'Laundry', 'Parking', 'CCTV'],
    isVerified: true, status: 'active', capacity: 40,
  },
  { // 7
    name: 'Urban Nest PG', city: 'Pune', area: 'Shivajinagar',
    gender: 'mixed', rent: 8500, deposit: 17000, maintenance: 600,
    foodType: 'non-veg', amenities: ['WiFi', 'Food', 'Laundry'],
    isVerified: true, status: 'active', capacity: 22,
  },

  // ── Mumbai ──
  { // 8
    name: 'Metro Boys PG', city: 'Mumbai', area: 'Andheri',
    gender: 'male', rent: 13000, deposit: 26000, maintenance: 1000,
    foodType: 'both', amenities: ['WiFi', 'AC', 'Food', 'CCTV'],
    isVerified: true, status: 'active', capacity: 28,
  },
  { // 9
    name: 'Seaview Mens PG', city: 'Mumbai', area: 'Bandra',
    gender: 'male', rent: 15000, deposit: 30000, maintenance: 1200,
    foodType: 'non-veg', amenities: ['WiFi', 'AC', 'Gym', 'Parking'],
    isVerified: false, status: 'active', capacity: 14,
  },
  { // 10
    name: 'Lotus Ladies PG', city: 'Mumbai', area: 'Andheri',
    gender: 'female', rent: 12000, deposit: 24000, maintenance: 900,
    foodType: 'veg', amenities: ['WiFi', 'AC', 'Food', 'CCTV', 'Housekeeping'],
    isVerified: true, status: 'active', capacity: 20,
  },
  { // 11
    name: 'Pearl Womens Hostel', city: 'Mumbai', area: 'Borivali',
    gender: 'female', rent: 9500, deposit: 19000, maintenance: 700,
    foodType: 'veg', amenities: ['WiFi', 'Food', 'Laundry', 'CCTV'],
    isVerified: true, status: 'active', capacity: 18,
  },

  // ── Bangalore ──
  { // 12
    name: 'TechHub Co-living', city: 'Bangalore', area: 'Koramangala',
    gender: 'mixed', rent: 14000, deposit: 28000, maintenance: 1000,
    foodType: 'both', amenities: ['WiFi', 'AC', 'Gym', 'Food', 'Laundry', 'CCTV'],
    isVerified: true, status: 'active', capacity: 50,
  },
  { // 13
    name: 'Garden City Girls PG', city: 'Bangalore', area: 'Whitefield',
    gender: 'female', rent: 11000, deposit: 22000, maintenance: 800,
    foodType: 'veg', amenities: ['WiFi', 'AC', 'Food', 'CCTV', 'Housekeeping'],
    isVerified: true, status: 'active', capacity: 24,
  },
  { // 14
    name: 'Silicon Boys PG', city: 'Bangalore', area: 'Electronic City',
    gender: 'male', rent: 8000, deposit: 16000, maintenance: 600,
    foodType: 'both', amenities: ['WiFi', 'Food', 'Laundry', 'Parking'],
    isVerified: true, status: 'active', capacity: 30,
  },

  // ── Hyderabad ──
  { // 15
    name: 'Golconda Boys PG', city: 'Hyderabad', area: 'Gachibowli',
    gender: 'male', rent: 8500, deposit: 17000, maintenance: 600,
    foodType: 'both', amenities: ['WiFi', 'AC', 'Food', 'CCTV', 'Laundry'],
    isVerified: true, status: 'active', capacity: 26,
  },
  { // 16
    name: 'Charminar Ladies PG', city: 'Hyderabad', area: 'Madhapur',
    gender: 'female', rent: 9000, deposit: 18000, maintenance: 700,
    foodType: 'non-veg', amenities: ['WiFi', 'AC', 'Food', 'CCTV'],
    isVerified: false, status: 'active', capacity: 20,
  },

  // ── Chennai ──
  { // 17
    name: 'Marina Co-living', city: 'Chennai', area: 'Adyar',
    gender: 'mixed', rent: 10500, deposit: 21000, maintenance: 800,
    foodType: 'veg', amenities: ['WiFi', 'AC', 'Food', 'Gym', 'Laundry', 'CCTV'],
    isVerified: true, status: 'active', capacity: 35,
  },

  // ── Edge cases ──
  { // 18 — inactive
    name: 'Old Town PG', city: 'Pune', area: 'Peth',
    gender: 'male', rent: 5000, deposit: 10000, maintenance: 300,
    foodType: 'veg', amenities: ['WiFi', 'Food'],
    isVerified: false, status: 'inactive', capacity: 10,
  },
  { // 19 — active but unverified, no owner
    name: 'New Horizon PG', city: 'Bangalore', area: 'HSR Layout',
    gender: 'mixed', rent: 12500, deposit: 25000, maintenance: 800,
    foodType: 'both', amenities: ['WiFi', 'AC', 'Food', 'Parking'],
    isVerified: false, status: 'active', capacity: 20,
  },
]

// ─── 20 Users ─────────────────────────────────────────────────────────────────
// Indices 0-8  : pg_owners  (0-7 linked, 8 unlinked)
// Indices 9-19 : regular users

const USER_DATA = [
  // PG Owners — linked
  { name: 'Rajesh Sharma',   email: 'rajesh.sharma@pgowner.com',   role: 'pg_owner', pgIndex: 0  },
  { name: 'Amit Kulkarni',   email: 'amit.kulkarni@pgowner.com',   role: 'pg_owner', pgIndex: 1  },
  { name: 'Sunil Patil',     email: 'sunil.patil@pgowner.com',     role: 'pg_owner', pgIndex: 2  },
  { name: 'Priya Desai',     email: 'priya.desai@pgowner.com',     role: 'pg_owner', pgIndex: 3  },
  { name: 'Kavita Joshi',    email: 'kavita.joshi@pgowner.com',    role: 'pg_owner', pgIndex: 4  },
  { name: 'Sneha Nair',      email: 'sneha.nair@pgowner.com',      role: 'pg_owner', pgIndex: 5  },
  { name: 'Vikram Iyer',     email: 'vikram.iyer@pgowner.com',     role: 'pg_owner', pgIndex: 12 },
  { name: 'Sanjay Reddy',    email: 'sanjay.reddy@pgowner.com',    role: 'pg_owner', pgIndex: 15 },
  // PG Owner — unlinked (edge case)
  { name: 'Unlinked Owner',  email: 'unlinked.owner@pgowner.com',  role: 'pg_owner', pgIndex: null },

  // Regular users (indices 9–19)
  { name: 'Arjun Mehta',     email: 'arjun.mehta@user.com',   role: 'user' }, // 9
  { name: 'Pooja Rane',      email: 'pooja.rane@user.com',    role: 'user' }, // 10
  { name: 'Kiran Bhat',      email: 'kiran.bhat@user.com',    role: 'user' }, // 11
  { name: 'Nisha Pillai',    email: 'nisha.pillai@user.com',  role: 'user' }, // 12
  { name: 'Rohan Verma',     email: 'rohan.verma@user.com',   role: 'user' }, // 13
  { name: 'Divya Singh',     email: 'divya.singh@user.com',   role: 'user' }, // 14
  { name: 'Aakash Kumar',    email: 'aakash.kumar@user.com',  role: 'user' }, // 15
  { name: 'Tanvi Sawant',    email: 'tanvi.sawant@user.com',  role: 'user' }, // 16
  { name: 'Rahul Gupta',     email: 'rahul.gupta@user.com',   role: 'user' }, // 17
  { name: 'Meera Krishnan',  email: 'meera.krishnan@user.com',role: 'user' }, // 18
  { name: 'Farhan Sheikh',   email: 'farhan.sheikh@user.com', role: 'user' }, // 19
]

// ─── City coordinates ─────────────────────────────────────────────────────────
const CITY_META = {
  Pune:      { state: 'Maharashtra', lat: 18.52,  lng: 73.85 },
  Mumbai:    { state: 'Maharashtra', lat: 19.07,  lng: 72.87 },
  Bangalore: { state: 'Karnataka',   lat: 12.97,  lng: 77.59 },
  Hyderabad: { state: 'Telangana',   lat: 17.38,  lng: 78.48 },
  Chennai:   { state: 'Tamil Nadu',  lat: 13.08,  lng: 80.27 },
}

function pgDescription(p) {
  const who = p.gender === 'mixed' ? 'co-living' : p.gender === 'male' ? 'accommodation for boys' : 'accommodation for girls'
  const food = p.foodType === 'veg' ? 'pure vegetarian' : p.foodType === 'non-veg' ? 'non-vegetarian' : 'both veg and non-veg'
  return `${p.name} offers comfortable ${who} in ${p.area}, ${p.city}. Meals are ${food}. Well maintained with round-the-clock security and regular housekeeping.`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGO_URI)
  console.log('Connected to MongoDB')

  const db = mongoose.connection.db

  // Clear all collections
  const collections = await db.listCollections().toArray()
  for (const { name } of collections) {
    await db.collection(name).deleteMany({})
    console.log(`  Cleared: ${name}`)
  }

  const hashedPw = await hashPassword('test1234')

  // ── 1. Admin ──────────────────────────────────────────────────────────────
  const adminDoc = await db.collection('users').insertOne({
    name: 'Admin',
    email: 'admin@gmail.com',
    password: await hashPassword('admin123'),
    role: 'admin',
    pgId: null,
    onboardingStatus: 'legacy',
    isVerified: true,
    isActive: true,
    refreshToken: null,
    loginAttempts: 0,
    lockUntil: null,
    savedPGs: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const adminId = adminDoc.insertedId
  console.log('Admin created')

  // ── 2. PGs ────────────────────────────────────────────────────────────────
  const pgDocs = await db.collection('pgs').insertMany(
    PG_DATA.map(p => {
      const meta = CITY_META[p.city]
      return {
        name: p.name,
        slug: slugify(p.name),
        description: pgDescription(p),
        location: {
          country: 'India',
          state: meta.state,
          city: p.city,
          area: p.area,
          address: `${Math.floor(Math.random() * 200) + 1}, ${p.area} Main Road, ${p.city}`,
          coordinates: {
            lat: parseFloat((meta.lat + (Math.random() * 0.08 - 0.04)).toFixed(5)),
            lng: parseFloat((meta.lng + (Math.random() * 0.08 - 0.04)).toFixed(5)),
          },
        },
        pricing: { rent: p.rent, deposit: p.deposit, maintenance: p.maintenance },
        accommodation: {
          gender: p.gender,
          roomTypes: ['single', 'double'],
          totalCapacity: p.capacity,
        },
        foodType: p.foodType,
        amenities: p.amenities,
        images: [],
        owner: { name: '', phone: '', email: '', isVerified: false },
        createdBy: adminId,
        ownerId: null,
        status: p.status,
        isVerified: p.isVerified,
        verificationStatus: 'approved',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })
  )
  const pgIds = Object.values(pgDocs.insertedIds)
  console.log(`${pgIds.length} PGs created`)

  // ── 3. Users ──────────────────────────────────────────────────────────────
  const userInserts = await db.collection('users').insertMany(
    USER_DATA.map(u => ({
      name: u.name,
      email: u.email,
      password: hashedPw,
      role: u.role,
      pgId: u.role === 'pg_owner' && u.pgIndex !== null ? pgIds[u.pgIndex] : null,
      onboardingStatus: 'legacy',
      isVerified: true,
      isActive: true,
      refreshToken: null,
      loginAttempts: 0,
      lockUntil: null,
      savedPGs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  )
  const userIds = Object.values(userInserts.insertedIds)
  console.log(`${userIds.length} users created`)

  // Link ownerId + owner.name/email back into each PG
  for (let i = 0; i < USER_DATA.length; i++) {
    const u = USER_DATA[i]
    if (u.role === 'pg_owner' && u.pgIndex !== null) {
      await db.collection('pgs').updateOne(
        { _id: pgIds[u.pgIndex] },
        { $set: { ownerId: userIds[i], 'owner.name': u.name, 'owner.email': u.email } }
      )
    }
  }
  console.log('PG owner links set')

  // regularUserIds[0] = Arjun (USER_DATA index 9)
  const regularUserIds = userIds.slice(9)

  // ── 4. Admissions (PGResidency) ───────────────────────────────────────────
  // userIds[0-7] = linked pg_owners, used for processedBy
  const admissions = [
    // ─ Approved + active residents ─
    {
      userId: regularUserIds[0],  // Arjun → PG 0 Sunrise Boys
      pgId: pgIds[0], status: 'approved', residentStatus: 'active',
      processedBy: { role: 'owner', userId: userIds[0] },
      moveInNote: 'Moved in without issues.',
    },
    {
      userId: regularUserIds[1],  // Pooja → PG 3 Pink Pearl
      pgId: pgIds[3], status: 'approved', residentStatus: 'active',
      processedBy: { role: 'owner', userId: userIds[3] },
      moveInNote: 'Clean room, happy with facilities.',
    },
    {
      userId: regularUserIds[2],  // Kiran → PG 6 Harmony Co-living
      pgId: pgIds[6], status: 'approved', residentStatus: 'active',
      processedBy: { role: 'admin', userId: adminId },
      moveInNote: '',
    },
    {
      userId: regularUserIds[4],  // Rohan → PG 8 Metro Boys (no owner)
      pgId: pgIds[8], status: 'approved', residentStatus: 'active',
      processedBy: { role: 'admin', userId: adminId },
      moveInNote: 'Good location near office.',
    },
    {
      userId: regularUserIds[8],  // Rahul → PG 12 TechHub
      pgId: pgIds[12], status: 'approved', residentStatus: 'active',
      processedBy: { role: 'owner', userId: userIds[6] },
      moveInNote: 'Great community and facilities.',
    },
    {
      userId: regularUserIds[9],  // Meera → PG 13 Garden City Girls
      pgId: pgIds[13], status: 'approved', residentStatus: 'active',
      processedBy: { role: 'owner', userId: adminId },
      moveInNote: 'Quiet and clean environment.',
    },

    // ─ Pending ─
    {
      userId: regularUserIds[3],  // Nisha → PG 4 Bliss Womens
      pgId: pgIds[4], status: 'pending', residentStatus: null,
      processedBy: { role: null, userId: null },
      moveInNote: 'Joining from next month.',
    },
    {
      userId: regularUserIds[5],  // Divya → PG 10 Lotus Ladies
      pgId: pgIds[10], status: 'pending', residentStatus: null,
      processedBy: { role: null, userId: null },
      moveInNote: '',
    },
    {
      userId: regularUserIds[10], // Farhan → PG 17 Marina Chennai
      pgId: pgIds[17], status: 'pending', residentStatus: null,
      processedBy: { role: null, userId: null },
      moveInNote: 'Relocating from Mumbai for work.',
    },

    // ─ Rejected ─
    {
      userId: regularUserIds[6],  // Aakash → PG 1 Blue Ridge
      pgId: pgIds[1], status: 'rejected', residentStatus: null,
      processedBy: { role: 'owner', userId: userIds[1] },
      moveInNote: '',
    },

    // ─ Withdrawn ─
    {
      userId: regularUserIds[7],  // Tanvi → PG 5 Sakura Ladies
      pgId: pgIds[5], status: 'withdrawn', residentStatus: null,
      processedBy: { role: null, userId: null },
      moveInNote: 'Changed plans.',
    },

    // ─ Re-applications (after rejection / withdrawal) ─
    {
      userId: regularUserIds[6],  // Aakash (was rejected at PG 1) → PG 7 Urban Nest
      pgId: pgIds[7], status: 'pending', residentStatus: null,
      processedBy: { role: null, userId: null },
      moveInNote: 'Looking for a mixed PG closer to office.',
    },
    {
      userId: regularUserIds[7],  // Tanvi (withdrew from PG 5) → PG 11 Pearl Womens
      pgId: pgIds[11], status: 'approved', residentStatus: 'active',
      processedBy: { role: 'admin', userId: adminId },
      moveInNote: 'Needed a PG in Borivali. Settled in well.',
    },
    // ─ Additional applications covering more PGs ─
    {
      userId: regularUserIds[3],  // Nisha → backup application PG 16 Charminar Ladies
      pgId: pgIds[16], status: 'pending', residentStatus: null,
      processedBy: { role: null, userId: null },
      moveInNote: 'Applied as backup while waiting at Bliss.',
    },
    {
      userId: regularUserIds[4],  // Rohan → also applied PG 15 Golconda Boys
      pgId: pgIds[15], status: 'pending', residentStatus: null,
      processedBy: { role: null, userId: null },
      moveInNote: 'Exploring options in Hyderabad for project.',
    },
    {
      userId: regularUserIds[2],  // Kiran → also applied PG 14 Silicon Boys
      pgId: pgIds[14], status: 'rejected', residentStatus: null,
      processedBy: { role: 'owner', userId: adminId },
      moveInNote: '',
    },
  ]

  await db.collection('pgresidencies').insertMany(
    admissions.map(a => ({ ...a, createdAt: new Date(), updatedAt: new Date() }))
  )
  console.log(`${admissions.length} admissions created`)

  // ── 5. Saved PGs ──────────────────────────────────────────────────────────
  const savedPGsMap = [
    { userIdx: 0,  pgs: [pgIds[6], pgIds[8]] },                     // Arjun
    { userIdx: 1,  pgs: [pgIds[6], pgIds[12], pgIds[17]] },         // Pooja
    { userIdx: 2,  pgs: [pgIds[7], pgIds[12]] },                    // Kiran
    { userIdx: 3,  pgs: [pgIds[3], pgIds[4], pgIds[16]] },          // Nisha
    { userIdx: 4,  pgs: [pgIds[0], pgIds[15]] },                    // Rohan
    { userIdx: 5,  pgs: [pgIds[10], pgIds[11]] },                   // Divya
    { userIdx: 6,  pgs: [pgIds[2], pgIds[7]] },                     // Aakash
    { userIdx: 7,  pgs: [pgIds[3], pgIds[11]] },                    // Tanvi
    { userIdx: 8,  pgs: [pgIds[12], pgIds[17]] },                   // Rahul
    { userIdx: 9,  pgs: [pgIds[4], pgIds[13], pgIds[16]] },         // Meera
    { userIdx: 10, pgs: [pgIds[6], pgIds[7], pgIds[17]] },          // Farhan
  ]

  for (const { userIdx, pgs } of savedPGsMap) {
    await db.collection('users').updateOne(
      { _id: regularUserIds[userIdx] },
      { $set: { savedPGs: pgs } }
    )
  }
  console.log('Saved PGs set')

  // ── 6. Complaints ─────────────────────────────────────────────────────────
  const snap = (i, ownerIdx = null) => ({
    name: PG_DATA[i].name,
    city: PG_DATA[i].city,
    area: PG_DATA[i].area,
    ownerName: ownerIdx !== null ? USER_DATA[ownerIdx].name : '',
  })

  const complaints = [
    {
      pgId: pgIds[0], pgSnapshot: snap(0, 0),
      createdBy: regularUserIds[0], isVerifiedResident: true,
      type: 'food', isAnonymous: false, status: 'approved',
      description: 'Food quality has deteriorated over the past week. Meals are often served cold and the menu has become repetitive.',
      adminRemark: 'Forwarded to owner. Issue acknowledged.',
    },
    {
      pgId: pgIds[3], pgSnapshot: snap(3, 3),
      createdBy: regularUserIds[1], isVerifiedResident: true,
      type: 'cleanliness', isAnonymous: false, status: 'pending',
      description: 'Washrooms are not cleaned daily. There is a persistent odor and the cleaning schedule is not followed.',
      adminRemark: null,
    },
    {
      pgId: pgIds[6], pgSnapshot: snap(6),
      createdBy: regularUserIds[2], isVerifiedResident: true,
      type: 'management', isAnonymous: true, status: 'pending',
      description: 'Owner is unresponsive to maintenance requests. A broken ceiling fan in room 4 has not been fixed for 3 weeks.',
      adminRemark: null,
    },
    {
      pgId: pgIds[8], pgSnapshot: snap(8),
      createdBy: regularUserIds[4], isVerifiedResident: true,
      type: 'security', isAnonymous: false, status: 'rejected',
      description: 'Main gate security is lax. Outsiders have been seen entering the premises without being checked.',
      adminRemark: 'Could not verify. CCTV footage reviewed — no evidence found.',
    },
    {
      pgId: pgIds[12], pgSnapshot: snap(12, 6),
      createdBy: regularUserIds[8], isVerifiedResident: true,
      type: 'other', isAnonymous: false, status: 'pending',
      description: 'WiFi speed has dropped significantly in the evenings. Speeds are below 5 Mbps making it impossible to work from home.',
      adminRemark: null,
    },
    {
      pgId: pgIds[13], pgSnapshot: snap(13),
      createdBy: regularUserIds[9], isVerifiedResident: true,
      type: 'cleanliness', isAnonymous: false, status: 'approved',
      description: 'Common kitchen is left dirty after meals. Pest sighting reported near the storage area.',
      adminRemark: 'Pest control scheduled. Owner informed.',
    },
    // ─ Additional complaints covering more PGs ─
    {
      pgId: pgIds[1], pgSnapshot: snap(1, 1),
      createdBy: regularUserIds[6], isVerifiedResident: false,
      type: 'management', isAnonymous: false, status: 'rejected',
      description: 'During my admission process the owner was rude and dismissive. Calls were ignored and emails went unanswered for over a week.',
      adminRemark: 'Applicant was not a resident. Complaint outside scope. Closed.',
    },
    {
      pgId: pgIds[2], pgSnapshot: snap(2, 2),
      createdBy: regularUserIds[0], isVerifiedResident: false,
      type: 'food', isAnonymous: false, status: 'pending',
      description: 'Visited a friend staying here. The food served was undercooked and the dining area had visible hygiene issues.',
      adminRemark: null,
    },
    {
      pgId: pgIds[7], pgSnapshot: snap(7),
      createdBy: regularUserIds[4], isVerifiedResident: false,
      type: 'other', isAnonymous: true, status: 'pending',
      description: 'Loud music and noise past midnight on weekends. Other residents complained but management has not taken action.',
      adminRemark: null,
    },
    {
      pgId: pgIds[9], pgSnapshot: snap(9),
      createdBy: regularUserIds[1], isVerifiedResident: false,
      type: 'cleanliness', isAnonymous: false, status: 'pending',
      description: 'The shared bathrooms on the first floor have a persistent mould problem. Ventilation is poor and cleaning is infrequent.',
      adminRemark: null,
    },
    {
      pgId: pgIds[11], pgSnapshot: snap(11),
      createdBy: regularUserIds[7], isVerifiedResident: true,
      type: 'security', isAnonymous: false, status: 'approved',
      description: 'Building entrance camera has been non-functional for two weeks. This is a safety concern especially at night.',
      adminRemark: 'Owner has been asked to repair the CCTV within 7 days.',
    },
    {
      pgId: pgIds[14], pgSnapshot: snap(14),
      createdBy: regularUserIds[2], isVerifiedResident: false,
      type: 'management', isAnonymous: true, status: 'pending',
      description: 'Application was processed unfairly. Applicants with lower references were admitted before me without explanation.',
      adminRemark: null,
    },
    {
      pgId: pgIds[15], pgSnapshot: snap(15, 7),
      createdBy: regularUserIds[4], isVerifiedResident: false,
      type: 'food', isAnonymous: false, status: 'pending',
      description: 'The food menu shown during tour does not match what is actually served. Non-veg promised on weekends is not delivered.',
      adminRemark: null,
    },
    {
      pgId: pgIds[17], pgSnapshot: snap(17),
      createdBy: regularUserIds[10], isVerifiedResident: false,
      type: 'other', isAnonymous: false, status: 'pending',
      description: 'The move-in process was poorly communicated. Had to wait 3 hours on arrival because the room was not ready despite prior confirmation.',
      adminRemark: null,
    },
  ]

  await db.collection('complaints').insertMany(
    complaints.map(c => ({ ...c, createdAt: new Date(), updatedAt: new Date() }))
  )
  console.log(`${complaints.length} complaints created`)

  // ── 7. Testimonials ───────────────────────────────────────────────────────
  const testimonials = [
    {
      pgId: pgIds[0], pgSnapshot: { name: PG_DATA[0].name, city: PG_DATA[0].city, area: PG_DATA[0].area },
      createdBy: regularUserIds[0], rating: 5, isVerifiedResident: true,
      status: 'approved', isVisible: true,
      content: 'Sunrise Boys PG is one of the best places I have stayed. Clean rooms, good food, and a great community. The owner is very responsive and helpful. Highly recommend for working professionals.',
    },
    {
      pgId: pgIds[3], pgSnapshot: { name: PG_DATA[3].name, city: PG_DATA[3].city, area: PG_DATA[3].area },
      createdBy: regularUserIds[1], rating: 4, isVerifiedResident: true,
      status: 'approved', isVisible: true,
      content: 'Pink Pearl is a wonderful PG for girls. Security is top-notch, meals are fresh and tasty. AC rooms are spacious. Only wish there was a parking spot. Overall very satisfied.',
    },
    {
      pgId: pgIds[6], pgSnapshot: { name: PG_DATA[6].name, city: PG_DATA[6].city, area: PG_DATA[6].area },
      createdBy: regularUserIds[2], rating: 4, isVerifiedResident: true,
      status: 'pending', isVisible: false,
      content: 'Harmony Co-living is perfect for people who value community. Great amenities, fast WiFi, and helpful staff. A bit pricey but worth it for the facilities on offer.',
    },
    {
      pgId: pgIds[8], pgSnapshot: { name: PG_DATA[8].name, city: PG_DATA[8].city, area: PG_DATA[8].area },
      createdBy: regularUserIds[4], rating: 3, isVerifiedResident: true,
      status: 'pending', isVisible: false,
      content: 'Metro Boys PG in Andheri is decent for the price. Location is excellent with easy metro access. Rooms are a bit small but the food is very good.',
    },
    {
      pgId: pgIds[12], pgSnapshot: { name: PG_DATA[12].name, city: PG_DATA[12].city, area: PG_DATA[12].area },
      createdBy: regularUserIds[8], rating: 5, isVerifiedResident: true,
      status: 'approved', isVisible: true,
      content: 'TechHub Co-living in Koramangala is perfect for IT professionals. The gym, fast internet, and community events make it feel like home. Worth every rupee.',
    },
    {
      pgId: pgIds[13], pgSnapshot: { name: PG_DATA[13].name, city: PG_DATA[13].city, area: PG_DATA[13].area },
      createdBy: regularUserIds[9], rating: 4, isVerifiedResident: true,
      status: 'pending', isVisible: false,
      content: 'Garden City Girls PG is calm and well-maintained. The food is homely and the owner is cooperative. Whitefield location is convenient for Manyata tech park employees.',
    },
    // ─ Additional testimonials ─
    {
      pgId: pgIds[1], pgSnapshot: { name: PG_DATA[1].name, city: PG_DATA[1].city, area: PG_DATA[1].area },
      createdBy: regularUserIds[6], rating: 2, isVerifiedResident: false,
      status: 'approved', isVisible: true,
      content: 'Blue Ridge Men PG looks good on paper but the owner is difficult to deal with. My admission was rejected without any reason. Gym equipment is outdated and food is average at best.',
    },
    {
      pgId: pgIds[4], pgSnapshot: { name: PG_DATA[4].name, city: PG_DATA[4].city, area: PG_DATA[4].area },
      createdBy: regularUserIds[5], rating: 4, isVerifiedResident: false,
      status: 'pending', isVisible: false,
      content: 'Bliss Womens Hostel has excellent facilities. The gym is well-equipped, food is fresh and varied, and the owner is very approachable. Waiting to get admitted but already impressed.',
    },
    {
      pgId: pgIds[7], pgSnapshot: { name: PG_DATA[7].name, city: PG_DATA[7].city, area: PG_DATA[7].area },
      createdBy: regularUserIds[4], rating: 3, isVerifiedResident: false,
      status: 'approved', isVisible: true,
      content: 'Urban Nest PG is centrally located which is great. Rooms are clean but the noise level on weekends is too high. Food is good. Would be perfect if management enforced quiet hours.',
    },
    {
      pgId: pgIds[11], pgSnapshot: { name: PG_DATA[11].name, city: PG_DATA[11].city, area: PG_DATA[11].area },
      createdBy: regularUserIds[7], rating: 5, isVerifiedResident: true,
      status: 'approved', isVisible: true,
      content: 'Pearl Womens Hostel in Borivali is a hidden gem. Spacious rooms, hygienic kitchen, and a very safe environment. The owner is proactive and very responsive. Highly recommend to girls moving to Mumbai.',
    },
    {
      pgId: pgIds[14], pgSnapshot: { name: PG_DATA[14].name, city: PG_DATA[14].city, area: PG_DATA[14].area },
      createdBy: regularUserIds[8], rating: 4, isVerifiedResident: false,
      status: 'pending', isVisible: false,
      content: 'Silicon Boys PG offers great value for Electronic City. Rent is affordable and it is just a short bus ride to most IT parks. Food is decent. WiFi could be faster.',
    },
    {
      pgId: pgIds[15], pgSnapshot: { name: PG_DATA[15].name, city: PG_DATA[15].city, area: PG_DATA[15].area },
      createdBy: regularUserIds[0], rating: 4, isVerifiedResident: false,
      status: 'approved', isVisible: true,
      content: 'Golconda Boys PG is solid for professionals in Gachibowli. Meals are hearty, WiFi is stable, and the staff is courteous. Good pick for anyone joining the tech corridor in Hyderabad.',
    },
    {
      pgId: pgIds[9], pgSnapshot: { name: PG_DATA[9].name, city: PG_DATA[9].city, area: PG_DATA[9].area },
      createdBy: regularUserIds[1], rating: 3, isVerifiedResident: false,
      status: 'approved', isVisible: true,
      content: 'Seaview Mens PG charges premium but the location near Bandra makes it worth it for some. Rooms are spacious and the gym is a plus. Bathrooms need better maintenance though.',
    },
    {
      pgId: pgIds[17], pgSnapshot: { name: PG_DATA[17].name, city: PG_DATA[17].city, area: PG_DATA[17].area },
      createdBy: regularUserIds[10], rating: 4, isVerifiedResident: false,
      status: 'pending', isVisible: false,
      content: 'Marina Co-living in Adyar has a fantastic vibe. The community is warm, food is South Indian and delicious, and the facilities are modern. Waiting to get admitted and looking forward to moving in.',
    },
  ]

  await db.collection('testimonials').insertMany(
    testimonials.map(t => ({ ...t, createdAt: new Date(), updatedAt: new Date() }))
  )
  console.log(`${testimonials.length} testimonials created`)

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────────')
  console.log('Seed complete.')
  console.log('')
  console.log('  admin@gmail.com              → admin123')
  console.log('  rajesh.sharma@pgowner.com    → test1234  (Sunrise Boys PG, Pune)')
  console.log('  amit.kulkarni@pgowner.com    → test1234  (Blue Ridge Men PG, Pune)')
  console.log('  sunil.patil@pgowner.com      → test1234  (Green Valley Boys PG, Pune)')
  console.log('  priya.desai@pgowner.com      → test1234  (Pink Pearl Girls PG, Pune)')
  console.log('  kavita.joshi@pgowner.com     → test1234  (Bliss Womens Hostel, Pune)')
  console.log('  sneha.nair@pgowner.com       → test1234  (Sakura Ladies PG, Pune)')
  console.log('  vikram.iyer@pgowner.com      → test1234  (TechHub Co-living, Bangalore)')
  console.log('  sanjay.reddy@pgowner.com     → test1234  (Golconda Boys PG, Hyderabad)')
  console.log('  unlinked.owner@pgowner.com   → test1234  (no PG assigned)')
  console.log('  arjun.mehta@user.com         → test1234  (admitted: Sunrise Boys)')
  console.log('  pooja.rane@user.com          → test1234  (admitted: Pink Pearl)')
  console.log('  kiran.bhat@user.com          → test1234  (admitted: Harmony Co-living)')
  console.log('  nisha.pillai@user.com        → test1234  (pending: Bliss Womens)')
  console.log('  rohan.verma@user.com         → test1234  (admitted: Metro Boys)')
  console.log('  divya.singh@user.com         → test1234  (pending: Lotus Ladies)')
  console.log('  aakash.kumar@user.com        → test1234  (rejected: Blue Ridge)')
  console.log('  tanvi.sawant@user.com        → test1234  (withdrawn: Sakura Ladies)')
  console.log('  rahul.gupta@user.com         → test1234  (admitted: TechHub)')
  console.log('  meera.krishnan@user.com      → test1234  (admitted: Garden City Girls)')
  console.log('  farhan.sheikh@user.com       → test1234  (pending: Marina Chennai)')
  console.log('')
  console.log('PGs:          20 (18 active, 1 inactive, 5 unverified)')
  console.log('Users:        20 + 1 admin')
  console.log('Admissions:   8 approved/active, 6 pending, 2 rejected, 1 withdrawn')
  console.log('Complaints:   14 (4 approved, 8 pending, 2 rejected) across 12 PGs')
  console.log('Testimonials: 14 (7 approved/visible, 7 pending) across 14 PGs')
  console.log('Saved PGs:    all 11 users have saved PGs')
  console.log('─────────────────────────────────────────────────\n')

  await mongoose.disconnect()
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
