import 'dotenv/config'
import mongoose from 'mongoose'
import User from '../src/models/user.js'
import PG from '../src/models/pg.js'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pg-app'

const PGS = [
  {
    name: 'Sunshine PG',
    slug: 'sunshine-pg-kothrud-pune',
    description: 'A well-maintained PG in the heart of Kothrud with homely food, 24/7 water supply, and close proximity to major IT companies and colleges.',
    location: {
      country: 'India', state: 'Maharashtra', city: 'Pune', area: 'Kothrud',
      address: '12, Paud Road, Kothrud, Pune - 411038',
      coordinates: { lat: 18.5074, lng: 73.8077 },
    },
    pricing: { rent: 8500, deposit: 17000, maintenance: 500 },
    accommodation: { gender: 'male', roomTypes: ['single', 'double'], totalCapacity: 20 },
    foodType: 'veg',
    amenities: ['wifi', 'food', 'laundry', 'parking', 'power backup', 'water purifier'],
    images: [
      { url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800', fileId: 'seed_sunshine_1' },
      { url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', fileId: 'seed_sunshine_2' },
      { url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800', fileId: 'seed_sunshine_3' },
    ],
    owner: { name: 'Suresh Desai', phone: '9876543210', email: 'owner1@pgapp.com', isVerified: true },
    isActive: true,
    isVerified: true,
  },
  {
    name: 'Green Valley Residency',
    slug: 'green-valley-residency-baner-pune',
    description: 'Premium PG accommodation for working professionals and students in Baner. Attached bathrooms, AC rooms, and healthy meals included.',
    location: {
      country: 'India', state: 'Maharashtra', city: 'Pune', area: 'Baner',
      address: '45, Sus Road, Baner, Pune - 411045',
      coordinates: { lat: 18.5590, lng: 73.7868 },
    },
    pricing: { rent: 12000, deposit: 24000, maintenance: 800 },
    accommodation: { gender: 'female', roomTypes: ['single', 'double', 'triple'], totalCapacity: 30 },
    foodType: 'both',
    amenities: ['wifi', 'food', 'ac', 'laundry', 'gym', 'cctv', 'power backup', 'water purifier', 'housekeeping'],
    images: [
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', fileId: 'seed_greenvalley_1' },
      { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', fileId: 'seed_greenvalley_2' },
      { url: 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800', fileId: 'seed_greenvalley_3' },
    ],
    owner: { name: 'Meena Kulkarni', phone: '9765432109', email: 'owner2@pgapp.com', isVerified: true },
    isActive: true,
    isVerified: true,
  },
]

async function seed() {
  await mongoose.connect(MONGO_URI)
  console.log('Connected:', MONGO_URI)

  await Promise.all([User.deleteMany({}), PG.deleteMany({})])
  console.log('Cleared users + pgs')

  // Admin — pre-save hook hashes password automatically
  const admin = await User.create({
    name: 'Admin PG',
    email: 'admin@pgapp.com',
    password: 'Admin@123',
    role: 'admin',
  })
  console.log('Seeded admin:', admin.email)

  // PGs (linked to admin as creator)
  const pgDocs = PGS.map((pg) => ({ ...pg, createdBy: admin._id }))
  const createdPGs = await PG.insertMany(pgDocs)
  console.log(`Seeded ${createdPGs.length} PGs`)

  // PG Owners — pre-save hook runs with create()
  const owner1 = await User.create({
    name: 'Suresh Desai',
    email: 'owner1@pgapp.com',
    password: 'Owner@123',
    role: 'pg_owner',
    pgId: createdPGs[0]._id,
  })
  console.log('Seeded owner1:', owner1.email, '→ PG:', createdPGs[0].name)

  const owner2 = await User.create({
    name: 'Meena Kulkarni',
    email: 'owner2@pgapp.com',
    password: 'Owner@123',
    role: 'pg_owner',
    pgId: createdPGs[1]._id,
  })
  console.log('Seeded owner2:', owner2.email, '→ PG:', createdPGs[1].name)

  console.log('\n✅ Done\n')
  console.log('── Credentials ─────────────────────────────────')
  console.log('  admin    │ admin@pgapp.com    │ Admin@123')
  console.log('  pg_owner │ owner1@pgapp.com   │ Owner@123')
  console.log('  pg_owner │ owner2@pgapp.com   │ Owner@123')
  console.log('────────────────────────────────────────────────\n')

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
