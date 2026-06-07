// ─────────────────────────────────────────────────────────────
// Raw seed data — passwords are plain text here, hashed in seed.js
// ─────────────────────────────────────────────────────────────

export const USERS = [
  // ── Admin ──────────────────────────────────────────────────
  {
    name: 'Admin PG',
    email: 'admin@pgapp.com',
    password: 'Admin@123',
    role: 'admin',
  },

  // ── Students / Users ───────────────────────────────────────
  {
    name: 'Rahul Sharma',
    email: 'rahul.sharma@student.com',
    password: 'Student@123',
    role: 'user',
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@student.com',
    password: 'Student@123',
    role: 'user',
  },
  {
    name: 'Amit Kumar',
    email: 'amit.kumar@student.com',
    password: 'Student@123',
    role: 'user',
  },
  {
    name: 'Sneha Joshi',
    email: 'sneha.joshi@student.com',
    password: 'Student@123',
    role: 'user',
  },
  {
    name: 'Rohit Verma',
    email: 'rohit.verma@student.com',
    password: 'Student@123',
    role: 'user',
  },

  // ── PG Owners ──────────────────────────────────────────────
  {
    name: 'Suresh Desai',
    email: 'owner1@pgapp.com',
    password: 'Owner@123',
    role: 'pg_owner',
    pgIndex: 0, // Sunshine PG
  },
  {
    name: 'Meena Kulkarni',
    email: 'owner2@pgapp.com',
    password: 'Owner@123',
    role: 'pg_owner',
    pgIndex: 1, // Green Valley Residency
  },
  {
    name: 'Rajesh Patil',
    email: 'owner3@pgapp.com',
    password: 'Owner@123',
    role: 'pg_owner',
    pgIndex: 2, // City Heights PG
  },
  {
    name: 'Kavita Jain',
    email: 'owner4@pgapp.com',
    password: 'Owner@123',
    role: 'pg_owner',
    pgIndex: 3, // Scholar's Hub
  },
  {
    name: 'Sunil Nair',
    email: 'owner5@pgapp.com',
    password: 'Owner@123',
    role: 'pg_owner',
    pgIndex: 4, // Silicon Stay
  },
]

// ─────────────────────────────────────────────────────────────
// PG data — createdBy will be set to admin._id in seed.js
// ─────────────────────────────────────────────────────────────

export const PGS = [
  {
    name: 'Sunshine PG',
    slug: 'sunshine-pg-kothrud-pune',
    description: 'A well-maintained PG in the heart of Kothrud with homely food, 24/7 water supply, and close proximity to major IT companies and colleges.',
    location: {
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
      area: 'Kothrud',
      address: '12, Paud Road, Kothrud, Pune - 411038',
      coordinates: { lat: 18.5074, lng: 73.8077 },
    },
    pricing: { rent: 8500, deposit: 17000, maintenance: 500 },
    accommodation: {
      gender: 'male',
      roomTypes: ['single', 'double'],
      totalCapacity: 20,
    },
    amenities: ['wifi', 'food', 'laundry', 'parking', 'power backup', 'water purifier'],
    images: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
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
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
      area: 'Baner',
      address: '45, Sus Road, Baner, Pune - 411045',
      coordinates: { lat: 18.5590, lng: 73.7868 },
    },
    pricing: { rent: 12000, deposit: 24000, maintenance: 800 },
    accommodation: {
      gender: 'female',
      roomTypes: ['single', 'double', 'triple'],
      totalCapacity: 30,
    },
    amenities: ['wifi', 'food', 'ac', 'laundry', 'gym', 'cctv', 'power backup', 'water purifier', 'housekeeping'],
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    ],
    owner: { name: 'Meena Kulkarni', phone: '9765432109', email: 'owner2@pgapp.com', isVerified: true },
    isActive: true,
    isVerified: true,
  },
  {
    name: 'City Heights PG',
    slug: 'city-heights-pg-wakad-pune',
    description: 'Affordable and comfortable PG near Hinjewadi IT Park. Ideal for software professionals. Meals, laundry, and high-speed WiFi included.',
    location: {
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
      area: 'Wakad',
      address: '78, Datta Mandir Road, Wakad, Pune - 411057',
      coordinates: { lat: 18.5986, lng: 73.7618 },
    },
    pricing: { rent: 9500, deposit: 19000, maintenance: 600 },
    accommodation: {
      gender: 'male',
      roomTypes: ['double', 'triple'],
      totalCapacity: 40,
    },
    amenities: ['wifi', 'food', 'laundry', 'cctv', 'power backup'],
    images: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
      'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800',
    ],
    owner: { name: 'Rajesh Patil', phone: '9654321098', email: 'owner3@pgapp.com', isVerified: true },
    isActive: true,
    isVerified: true,
  },
  {
    name: "Scholar's Hub",
    slug: 'scholars-hub-viman-nagar-pune',
    description: 'Study-friendly PG in Viman Nagar with dedicated study rooms, high-speed internet, and nutritious meals. Close to Pune airport and Symbiosis colleges.',
    location: {
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
      area: 'Viman Nagar',
      address: '23, Sakore Nagar Road, Viman Nagar, Pune - 411014',
      coordinates: { lat: 18.5679, lng: 73.9143 },
    },
    pricing: { rent: 10500, deposit: 21000, maintenance: 700 },
    accommodation: {
      gender: 'unisex',
      roomTypes: ['single', 'double'],
      totalCapacity: 25,
    },
    amenities: ['wifi', 'food', 'ac', 'laundry', 'study room', 'cctv', 'power backup', 'water purifier'],
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800',
    ],
    owner: { name: 'Kavita Jain', phone: '9543210987', email: 'owner4@pgapp.com', isVerified: true },
    isActive: true,
    isVerified: true,
  },
  {
    name: 'Silicon Stay',
    slug: 'silicon-stay-hinjewadi-pune',
    description: 'Modern PG in Hinjewadi for tech professionals. Fully furnished rooms, fast WiFi, and excellent food. Walking distance from major IT parks.',
    location: {
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
      area: 'Hinjewadi',
      address: '14, Phase 1, Hinjewadi, Pune - 411057',
      coordinates: { lat: 18.5912, lng: 73.7389 },
    },
    pricing: { rent: 14000, deposit: 28000, maintenance: 1000 },
    accommodation: {
      gender: 'male',
      roomTypes: ['single', 'double'],
      totalCapacity: 35,
    },
    amenities: ['wifi', 'food', 'ac', 'gym', 'laundry', 'cctv', 'power backup', 'housekeeping', 'parking'],
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
    ],
    owner: { name: 'Sunil Nair', phone: '9432109876', email: 'owner5@pgapp.com', isVerified: true },
    isActive: true,
    isVerified: true,
  },
]

// ─────────────────────────────────────────────────────────────
// Complaints — pgIndex and userIndex refer to positions in the
// USERS array (admin is index 0, students start at 1)
// ─────────────────────────────────────────────────────────────

export const COMPLAINTS = [
  {
    pgIndex: 0,
    userIndex: 1, // Rahul
    type: 'food',
    description: 'The quality of food has deteriorated significantly. We pay premium rent and expect better.',
    isAnonymous: false,
    isVerifiedResident: true,
    status: 'approved',
    adminRemark: 'Owner notified.',
  },
]

// ─────────────────────────────────────────────────────────────
// Residency applications
// pgIndex / userIndex same reference convention
// verifiedByAdmin: true means admin approved it
// ─────────────────────────────────────────────────────────────

export const RESIDENCIES = [
  {
    pgIndex: 0,
    userIndex: 1, // Rahul at Sunshine PG — admitted
    status: 'admitted',
    moveInNote: 'Glad to be here!',
    verifiedByAdmin: true,
  },
  {
    pgIndex: 1,
    userIndex: 2, // Priya at Green Valley — admitted
    status: 'admitted',
    moveInNote: 'ID proof submitted.',
    verifiedByAdmin: true,
  },
  {
    pgIndex: 2,
    userIndex: 3, // Amit at City Heights — admitted
    status: 'admitted',
    moveInNote: 'Rent receipt submitted.',
    verifiedByAdmin: true,
  },
]
