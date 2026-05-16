import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURED_PGS = [
  {
    id: 1,
    name: 'The Collective Hub',
    location: 'Hinjewadi, Pune',
    price: '₹12,000',
    rating: 4.9,
    status: 'Available',
    statusStyle: 'bg-green-100 text-green-700',
    src: 'https://images.unsplash.com/photo-1721743169043-dda0212ce3d4?w=600&h=400&fit=crop&q=80&auto=format',
  },
  {
    id: 2,
    name: 'Zenith Suites',
    location: 'Baner, Pune',
    price: '₹18,000',
    rating: 4.8,
    status: 'Available',
    statusStyle: 'bg-green-100 text-green-700',
    src: 'https://images.unsplash.com/photo-1757344454333-cc666252e596?w=600&h=400&fit=crop&q=80&auto=format',
  },
  {
    id: 3,
    name: 'Creative Loft',
    location: 'Kharadi, Pune',
    price: '₹15,000',
    rating: 5.0,
    status: 'Filling Fast',
    statusStyle: 'bg-yellow-100 text-yellow-700',
    src: 'https://images.unsplash.com/photo-1750255079667-4c5591a7058b?w=600&h=400&fit=crop&q=80&auto=format',
  },
]

const TESTIMONIALS = [
  {
    id: 1,
    quote: '"Found my PG near Hinjewadi in 2 days flat. Verified listings meant no surprises — photos and pricing were exactly as shown."',
    name: 'Priya Mehta',
    role: 'Software Engineer, Hinjewadi',
    initials: 'PM',
    avatarBg: 'bg-[#ffdbd0]',
    avatarText: 'text-[#e98a76]',
  },
  {
    id: 2,
    quote: '"Applied online, got approved by the owner, moved into my Baner PG within a week. Zero paperwork, zero follow-up calls."',
    name: 'Arjun Singh',
    role: 'MBA Student, Symbiosis Pune',
    initials: 'AS',
    avatarBg: 'bg-primary-fixed',
    avatarText: 'text-primary',
  },
  {
    id: 3,
    quote: '"Filed an anonymous complaint about my AC — the owner never knew it was me. Resolved in 24 hours. That anonymity gave me the confidence to actually speak up."',
    name: 'Sneha Kapoor',
    role: 'Data Analyst, Kharadi',
    initials: 'SK',
    avatarBg: 'bg-tertiary-fixed',
    avatarText: 'text-on-tertiary-fixed',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user } = useAuth()
  return (
    <div className="bg-[#fbf9f8] text-[#1b1c1c] overflow-x-hidden">
      <Navbar user={user} />
      <main className="pt-20">
        <HeroSection />
        <TrustBar />
        <ValuePropSection />
        <FeaturedPGsSection />
        <TestimonialsSection />
        <OwnerSection />
        <CTASection />
        <StatsSection />
      </main>
      <Footer />
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ user }) {
  const [open, setOpen] = useState(false)

  function dashboardPath() {
    if (!user) return '/login'
    if (user.role === 'admin') return '/admin'
    if (user.role === 'pg_owner') return '/pgowner'
    return '/user'
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-[#E5E7EB]"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(251,249,248,0.85)' }}
    >
      <div className="flex justify-between items-center w-full px-6 lg:px-16 max-w-[1280px] mx-auto h-20">
        <Link to="/">
          <img src="/nest-stay-logo.png" alt="Nest Stay" className="h-10 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-bold text-[#e98a76] border-b-2 border-[#e98a76] pb-1">Explore</a>
          <a href="#for-owners" className="text-sm font-medium text-[#434849] hover:text-black transition-colors">List Property</a>
          <a href="#" className="text-sm font-medium text-[#434849] hover:text-black transition-colors">About Us</a>
          <a href="#" className="text-sm font-medium text-[#434849] hover:text-black transition-colors">Help</a>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to={dashboardPath()}
            className="hidden md:block px-6 py-2.5 rounded-xl border border-[#73787a] text-black text-sm font-semibold hover:bg-[#f0eded] transition-all"
          >
            {user ? 'Dashboard' : 'Sign In'}
          </Link>
          <Link
            to="/register"
            className="bg-[#e98a76] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
          >
            Find a PG
          </Link>
          <button
            className="md:hidden text-black p-2 rounded-lg hover:bg-[#f0eded] transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">{open ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#fbf9f8] border-t border-[#E5E7EB] px-6 py-4 space-y-1 shadow-lg">
          <a href="#" className="block text-sm py-2.5 text-[#e98a76] font-bold" onClick={() => setOpen(false)}>Explore</a>
          <a href="#for-owners" className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>List Property</a>
          <a href="#" className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>About Us</a>
          <a href="#" className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>Help</a>
          <div className="pt-3 border-t border-[#E5E7EB]">
            <Link to={dashboardPath()} className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>
              {user ? 'Dashboard' : 'Sign In'}
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative bg-[#fbf9f8] min-h-[calc(100vh-5rem)] flex items-center py-8 lg:pt-0 lg:pb-10">
      <div className="w-full max-w-[1280px] mx-auto px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        <div className="z-10">
          <span className="inline-block bg-tertiary-fixed text-on-tertiary-fixed-variant px-4 py-1.5 rounded-full text-xs font-bold tracking-wider mb-6">
            Trusted by students &amp; working professionals
          </span>
          <h1 className="text-[40px] lg:text-[48px] font-extrabold text-[#1b1c1c] leading-tight mb-6">
            Find Your Perfect <br />
            <span className="text-[#e98a76]">Paying Guest</span> Home
          </h1>
          <p className="text-lg text-[#434849] max-w-lg mb-10 leading-relaxed">
            Find verified PG accommodations across Pune — from Hinjewadi to Kharadi. Apply for residency, manage your stay, and raise complaints — all in one place.
          </p>

          {/* Search bar */}
          <div className="bg-white p-2 rounded-2xl shadow-card border border-[#E5E7EB] flex items-center gap-2 max-w-2xl">
            <div className="flex-1 flex items-center px-4 gap-2">
              <span className="material-symbols-outlined text-[#73787a] text-[20px]">location_on</span>
              <input
                type="text"
                placeholder="Search by locality, area or landmark..."
                className="w-full border-none focus:ring-0 bg-transparent text-sm outline-none"
                onKeyDown={(e) => { if (e.key === 'Enter') window.location.assign('/login') }}
              />
            </div>
            <Link
              to="/login"
              className="bg-black text-white px-8 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-[#e98a76] transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              Search
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap gap-6">
            {[
              { icon: 'verified',        label: 'Verified Listings'       },
              { icon: 'lock',           label: 'Anonymous Complaints'    },
              { icon: 'bolt',           label: 'Quick Admission'         },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm font-bold text-[#434849]">
                <span className="material-symbols-outlined text-[#e98a76] text-[18px] leading-none flex-shrink-0">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Hero image + floating badge */}
        <div className="relative hidden lg:block">
          <div className="rounded-[2.5rem] overflow-hidden" style={{ aspectRatio: '4/5' }}>
            <img
              src="https://images.unsplash.com/photo-1760072513376-67a46aab0fd1?w=600&h=750&fit=crop&q=80&auto=format"
              alt="Modern PG room"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-card border border-[#E5E7EB] flex items-center gap-4">
            <div className="w-12 h-12 bg-[#ffdbd0] flex items-center justify-center rounded-xl">
              <span className="material-symbols-outlined text-[#e98a76]">thumb_up</span>
            </div>
            <div>
              <div className="text-2xl font-bold">4.9/5</div>
              <div className="text-xs font-bold text-[#73787a]">Guest Satisfaction Rating</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

// ─── Trust Bar ────────────────────────────────────────────────────────────────

function TrustBar() {
  return (
    <section className="py-12 bg-[#f6f3f2] border-y border-[#E5E7EB]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-8">
        <span className="text-xs font-bold text-[#73787a] uppercase tracking-widest whitespace-nowrap">
          Trusted by Professionals From
        </span>
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 opacity-50">
          {['Infosys', 'TCS', 'Wipro', 'Persistent', 'Cognizant'].map(co => (
            <span key={co} className="text-2xl font-bold text-[#1b1c1c]">{co}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Value Prop Section ───────────────────────────────────────────────────────

function ValuePropSection() {
  return (
    <section className="py-16 lg:py-32 bg-[#101e22] text-white">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

        <div className="order-2 lg:order-1">
          <div className="relative">
            <div className="bg-[#eae8e7] w-full aspect-square rounded-[3rem] rotate-3 absolute inset-0 opacity-10" />
            <img
              src="https://images.unsplash.com/photo-1759038086454-082dc45d101d?w=600&h=600&fit=crop&q=80&auto=format"
              alt="Comfortable co-living space"
              className="rounded-[3rem] aspect-square object-cover relative z-10 shadow-ambient"
            />
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <span className="text-[#ffdbd0] text-xs font-bold tracking-widest uppercase mb-4 block">
            For Students &amp; Guests
          </span>
          <h2 className="text-[32px] font-bold mb-6 leading-tight">
            Discover PGs Designed <br /> for Comfortable Living
          </h2>
          <p className="text-[#bac9ce] mb-10 leading-relaxed">
            From studio rooms to shared accommodation across Hinjewadi, Baner, Kharadi and beyond — every listing is verified so you move in with zero surprises.
          </p>
          <ul className="space-y-6 mb-12">
            {[
              'All Pune listings verified and approved before going live',
              'Raise complaints anonymously — your identity stays protected',
              'Online admission — apply, get approved, move in fast',
            ].map(item => (
              <li key={item} className="flex items-start gap-4">
                <span className="material-symbols-outlined text-[#e98a76] mt-0.5 flex-shrink-0">check_circle</span>
                <p className="text-sm font-semibold">{item}</p>
              </li>
            ))}
          </ul>
          <Link
            to="/login"
            className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl text-sm font-semibold hover:bg-[#ffdbd0] transition-colors"
          >
            Explore Listings
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

      </div>
    </section>
  )
}

// ─── Featured PG Spaces ───────────────────────────────────────────────────────

function FeaturedPGsSection() {
  return (
    <section id="listings" className="py-12 lg:py-24">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-[#e98a76] text-xs font-bold uppercase tracking-wider mb-2 block">Featured</span>
            <h2 className="text-[32px] font-bold text-[#1b1c1c]">Premium PG Spaces</h2>
          </div>
          <Link to="/login" className="text-[#e98a76] text-sm font-semibold flex items-center gap-1 hover:underline flex-shrink-0">
            See All <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED_PGS.map(pg => <PGCard key={pg.id} pg={pg} />)}
        </div>
      </div>
    </section>
  )
}

function PGCard({ pg }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden group hover:shadow-card transition-all duration-300">
      <div className="relative h-64 overflow-hidden">
        <img
          src={pg.src}
          alt={pg.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
          <span
            className="material-symbols-outlined text-[#e98a76] text-[16px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >star</span>
          <span className="text-xs font-bold text-[#1b1c1c]">{pg.rating}</span>
        </div>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-[#1b1c1c]">{pg.name}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${pg.statusStyle}`}>{pg.status}</span>
        </div>
        <div className="flex items-center gap-1 text-[#73787a] text-sm mb-4">
          <span className="material-symbols-outlined text-[18px]">location_on</span>
          {pg.location}
        </div>
        <div className="pt-4 border-t border-[#E5E7EB] flex justify-between items-center">
          <div className="text-2xl font-bold text-[#e98a76]">
            {pg.price}<span className="text-sm font-normal text-[#73787a]">/mo</span>
          </div>
          <Link to="/login" className="text-black text-sm font-semibold hover:text-[#e98a76] transition-colors">
            Details
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function TestimonialsSection() {
  return (
    <section id="reviews" className="py-12 lg:py-24 bg-[#f6f3f2]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
        <div className="text-center mb-16">
          <span className="text-[#e98a76] text-xs font-bold uppercase tracking-wider mb-2 block">What Residents Say</span>
          <h2 className="text-[32px] font-bold text-[#1b1c1c]">Loved by Growing Residents</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map(t => (
            <div key={t.id} className="bg-white p-8 rounded-2xl border border-[#E5E7EB] hover:shadow-card transition-all">
              <div className="flex gap-1 text-[#e98a76] mb-6">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >star</span>
                ))}
              </div>
              <p className="text-sm text-[#434849] italic mb-8 leading-relaxed">{t.quote}</p>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${t.avatarBg} ${t.avatarText}`}>
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1b1c1c]">{t.name}</div>
                  <div className="text-xs text-[#73787a]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Owner Section ────────────────────────────────────────────────────────────

function OwnerSection() {
  return (
    <section id="for-owners" className="py-16 lg:py-32 bg-[#fbf9f8] relative overflow-hidden">
      <div className="absolute inset-0 bg-[#e98a76] opacity-[0.03] -skew-y-3 origin-right pointer-events-none" />
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative">

        <div>
          <span className="text-[#e98a76] text-xs font-bold uppercase tracking-widest mb-4 block">For Property Owners</span>
          <h2 className="text-[32px] font-bold mb-6 leading-tight text-[#1b1c1c]">
            Manage Your PG with a{' '}
            <span className="text-[#e98a76]">Digital Dashboard</span>
          </h2>
          <p className="text-[#434849] mb-10 leading-relaxed">
            List your property once and manage everything from your dashboard. Admissions, complaints, resident roster, and photos — all in one place.
          </p>
          <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-12">
            {['One-click admissions', 'Photo gallery management', 'Complaint tracking', 'Resident analytics'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#e98a76]">check_circle</span>
                <span className="text-sm font-semibold">{f}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/register"
              className="bg-[#e98a76] text-white px-8 py-4 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all"
            >
              List Your Property
            </Link>
            <Link
              to="/login"
              className="bg-[#f0eded] text-[#1b1c1c] px-8 py-4 rounded-2xl text-sm font-semibold border border-[#E5E7EB] hover:bg-[#eae8e7] transition-all"
            >
              Owner Sign In
            </Link>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="relative">
          <div className="bg-white rounded-[2rem] border border-[#E5E7EB] shadow-card overflow-hidden">
            <div className="bg-[#eae8e7] p-4 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-xs text-[#73787a]">Owner Dashboard — Zenith Suites, Baner</span>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-[#f6f3f2] rounded-xl">
                  <div className="text-[#73787a] text-xs font-bold uppercase mb-1">Occupancy</div>
                  <div className="text-2xl font-bold">94%</div>
                </div>
                <div className="p-4 bg-[#ffdbd0] rounded-xl">
                  <div className="text-[#3a0b00] text-xs font-bold uppercase mb-1">New Requests</div>
                  <div className="text-[#3a0b00] text-2xl font-bold">03</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#1b1c1c] mb-4">Recent Activities</div>
                <div className="flex items-center justify-between py-3 border-b border-[#E5E7EB]">
                  <span className="text-sm text-[#434849]">Rahul Sharma — admission approved</span>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Admitted</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-[#E5E7EB]">
                  <span className="text-sm text-[#434849]">Complaint: AC Not Cooling</span>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold">In Progress</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#ffdbd0] rounded-full blur-3xl opacity-30 -z-10" />
        </div>

      </div>
    </section>
  )
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="py-12 lg:py-24">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
        <div className="bg-[#101e22] rounded-[3rem] p-12 lg:p-24 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#e98a76] opacity-10 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[#ffdbd0] text-xs font-bold uppercase tracking-widest mb-6 block">Find Your PG Today</span>
            <h2 className="text-[40px] lg:text-[48px] font-extrabold mb-8 leading-tight">
              Stop Searching. <br /> Start Living.
            </h2>
            <p className="text-lg text-[#bac9ce] max-w-2xl mx-auto mb-12 leading-relaxed">
              Verified PGs in Pune with transparent pricing, quick admission, and a support system that actually works.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link
                to="/register"
                className="bg-[#e98a76] text-white px-10 py-5 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all"
              >
                Get Started — It's Free
              </Link>
              <Link
                to="/login"
                className="bg-transparent border border-[#c3c7c9] text-white px-10 py-5 rounded-2xl text-sm font-semibold hover:bg-white/10 transition-all"
              >
                Browse Listings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Stats Section ────────────────────────────────────────────────────────────

function StatsSection() {
  return (
    <section className="py-12 border-y border-[#E5E7EB]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        {[
          { value: '200+',  label: 'Verified Listings'    },
          { value: '1,500+', label: 'Happy Residents'     },
          { value: '18',    label: 'Pune Localities'       },
        ].map(({ value, label }) => (
          <div key={label}>
            <div className="text-[48px] font-extrabold text-black mb-2">{value}</div>
            <div className="text-sm font-semibold text-[#73787a]">{label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#e4e2e1] border-t border-[#E5E7EB] pt-24 pb-12">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">

        <div>
          <img src="/nest-stay-logo.png" alt="Nest Stay" className="h-12 w-auto mb-6" />
          <p className="text-sm text-[#434849] mb-8 leading-relaxed">
            Pune's trusted platform for verified PG accommodation — from Hinjewadi to Kharadi, find your perfect stay.
          </p>
          <div className="flex gap-4">
            <a href="#" aria-label="Website" className="w-10 h-10 rounded-full border border-[#c3c7c9] flex items-center justify-center hover:bg-black hover:text-white transition-all">
              <span className="material-symbols-outlined text-[20px]">public</span>
            </a>
            <a href="#" aria-label="Share" className="w-10 h-10 rounded-full border border-[#c3c7c9] flex items-center justify-center hover:bg-black hover:text-white transition-all">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-[#1b1c1c] mb-8">Quick Links</h4>
          <ul className="space-y-4">
            {['Browse PGs', 'How It Works', 'For Students', 'List Your PG', 'Owner Login'].map(l => (
              <li key={l}>
                <Link to="/login" className="text-sm text-[#434849] hover:text-black transition-colors">{l}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-[#1b1c1c] mb-8">Contact</h4>
          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-sm text-[#434849]">
              <span className="material-symbols-outlined text-[20px] text-[#73787a]">call</span>
              <a href="tel:+919970114079" className="hover:text-[#1b1c1c] transition-colors">+91 99701 14079</a>
            </li>
            <li className="flex items-center gap-3 text-sm text-[#434849]">
              <span className="material-symbols-outlined text-[20px] text-[#73787a]">mail</span>
              <a href="mailto:neststayco@gmail.com" className="hover:text-[#1b1c1c] transition-colors">neststayco@gmail.com</a>
            </li>
            <li className="flex items-start gap-3 text-sm text-[#434849]">
              <span className="material-symbols-outlined text-[20px] text-[#73787a] mt-0.5">location_on</span>
              Baner, Pune, <br /> Maharashtra
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-[#1b1c1c] mb-8">Newsletter</h4>
          <p className="text-sm text-[#434849] mb-6">Get the latest PG listings and living tips in your inbox.</p>
          <div className="flex items-center p-1 border border-[#c3c7c9] rounded-xl bg-[#f6f3f2]">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 bg-transparent border-none focus:ring-0 px-4 text-sm outline-none"
            />
            <button className="w-10 h-10 bg-[#e98a76] text-white rounded-lg flex items-center justify-center hover:opacity-90 flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>

      </div>

      <div className="max-w-[1280px] mx-auto px-6 lg:px-16 pt-8 border-t border-[#E5E7EB] flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-[#73787a]">© {new Date().getFullYear()} Nest Stay Hospitality. Premium sanctuary living.</p>
        <div className="flex gap-8">
          <a href="#" className="text-xs text-[#73787a] hover:text-black transition-colors">Privacy Policy</a>
          <a href="#" className="text-xs text-[#73787a] hover:text-black transition-colors">Terms of Service</a>
          <a href="#" className="text-xs text-[#73787a] hover:text-black transition-colors">Guest Guidelines</a>
        </div>
      </div>
    </footer>
  )
}
