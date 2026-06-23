import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const MONGO_URI = 'mongodb+srv://db_user:nestconnect1@cluster0.hmfd4oy.mongodb.net/Neststay_DB'

async function resetDatabase() {
  await mongoose.connect(MONGO_URI)
  console.log('Connected to MongoDB')

  const db = mongoose.connection.db
  const collections = await db.listCollections().toArray()

  for (const { name } of collections) {
    await db.collection(name).deleteMany({})
    console.log(`Cleared: ${name}`)
  }

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash('admin123', salt)

  await db.collection('users').insertOne({
    name: 'Admin',
    email: 'admin@gmail.com',
    password: hashedPassword,
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

  console.log('Admin user created: admin@gmail.com / admin123')
  await mongoose.disconnect()
  console.log('Done.')
}

resetDatabase().catch(err => {
  console.error(err)
  process.exit(1)
})
