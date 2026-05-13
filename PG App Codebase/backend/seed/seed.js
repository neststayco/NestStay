import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

import User from '../src/models/user.js'
import PG from '../src/models/pg.js'
import Complaint from '../src/models/Complaint.js'
import PGResidency from '../src/models/pgResidency.js'

import { USERS, PGS, COMPLAINTS, RESIDENCIES } from './data.js'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pg-app'

async function seed() {
  await mongoose.connect(MONGO_URI)
  console.log('Connected to MongoDB:', MONGO_URI)

  // ── Wipe existing data ──────────────────────────────────────
  await Promise.all([
    User.deleteMany({}),
    PG.deleteMany({}),
    Complaint.deleteMany({}),
    PGResidency.deleteMany({}),
  ])
  console.log('Cleared: users, pgs, complaints, pgresidencies')

  // ── Admin User ──────────────────────────────────────────────
  const adminData = USERS[0]
  const admin = await User.create(adminData)
  console.log('Seeded Admin user')

  // ── PGs ─────────────────────────────────────────────────────
  const pgDocs = PGS.map((pg) => ({ ...pg, createdBy: admin._id }))
  const createdPGs = await PG.insertMany(pgDocs)
  console.log(`Seeded ${createdPGs.length} PGs`)

  // ── Remaining Users ─────────────────────────────────────────
  const otherUsers = USERS.slice(1)
  const hashedUsers = await Promise.all(
    otherUsers.map(async (u) => {
      const { pgIndex, ...userData } = u
      const hashedPassword = await bcrypt.hash(u.password, 10)
      const user = { ...userData, password: hashedPassword }
      
      if (u.role === 'pg_owner' && typeof pgIndex === 'number') {
        user.pgId = createdPGs[pgIndex]._id
      }
      
      return user
    })
  )
  const createdOtherUsers = await User.insertMany(hashedUsers)
  const createdUsers = [admin, ...createdOtherUsers]
  console.log(`Seeded ${createdOtherUsers.length} additional users`)

  // ── Complaints ──────────────────────────────────────────────
  const complaintDocs = COMPLAINTS.map((c) => {
    const pg = createdPGs[c.pgIndex]
    const user = createdUsers[c.userIndex]
    return {
      pgId: pg._id,
      pgSnapshot: {
        name: pg.name,
        city: pg.location.city,
        area: pg.location.area,
        ownerName: pg.owner.name,
      },
      createdBy: user._id,
      type: c.type,
      description: c.description,
      isAnonymous: c.isAnonymous,
      isVerifiedResident: c.isVerifiedResident,
      status: c.status,
      adminRemark: c.adminRemark || null,
    }
  })
  const createdComplaints = await Complaint.insertMany(complaintDocs)
  console.log(`Seeded ${createdComplaints.length} complaints`)

  // ── Residency applications ──────────────────────────────────
  const residencyDocs = RESIDENCIES.map((r) => {
    const pg = createdPGs[r.pgIndex]
    const user = createdUsers[r.userIndex]
    return {
      pgId: pg._id,
      userId: user._id,
      status: r.status,
      moveInNote: r.moveInNote,
      processedBy: r.verifiedByAdmin ? { role: 'admin', userId: admin._id } : { role: null, userId: null },
    }
  })
  const createdResidencies = await PGResidency.insertMany(residencyDocs)
  console.log(`Seeded ${createdResidencies.length} residency applications`)

  // ── Summary ─────────────────────────────────────────────────
  console.log('\n✅ Seed complete\n')
  console.log('── Login credentials ──────────────────────────')
  USERS.forEach((u) => {
    console.log(`  ${u.role.padEnd(8)} │ ${u.email.padEnd(35)} │ ${u.password}`)
  })
  console.log('───────────────────────────────────────────────\n')

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
