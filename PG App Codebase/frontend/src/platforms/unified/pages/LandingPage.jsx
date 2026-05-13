import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'

// ─── Data ─────────────────────────────────────────────────────────────────────

function roleHome(role) {
  if (role === 'admin') return '/admin'
  if (role === 'pg_owner') return '/pgowner'
  return '/user'
}

const PHONE = '020 4614 0000'
const EMAIL = 'hello@pgfinder.in'
const ADDRESS = 'Koregaon Park, Pune, Maharashtra'

const TRUSTED_BY = ['Infosys', 'TCS', 'Wipro', 'Deloitte', 'Cognizant']

const FEATURED_PGS = [
  { id: 1, name: 'The Collective Hub', location: 'Koramangala, Bangalore', price: '₹12,000/mo', rating: 4.9, image: 'https://picsum.photos/seed/pghub/600/400' },
  { id: 2, name: 'Zenith Suites', location: 'HSR Layout, Bangalore', price: '₹18,000/mo', rating: 4.8, image: 'https://picsum.photos/seed/pgsuites/600/400' },
  { id: 3, name: 'Creative Loft', location: 'Indiranagar, Bangalore', price: '₹15,000/mo', rating: 5.0, image: 'https://picsum.photos/seed/pgloft/600/400' },
]

const TESTIMONIALS = [
  {
    id: 1,
    quote: 'Found my PG in 2 days flat. The verified listing system meant I could trust the photos and pricing without any surprises after moving in.',
    name: 'Priya Mehta',
    role: 'Software Engineer, Bangalore',
    initials: 'PM',
    rating: 5,
  },
  {
    id: 2,
    quote: 'The online admission process was seamless — I applied, got approved, and moved in within a week. Zero paperwork hassle.',
    name: 'Arjun Singh',
    role: 'MBA Student, Pune',
    initials: 'AS',
    rating: 5,
  },
  {
    id: 3,
    quote: "Had an issue with my room's AC. Filed a complaint through the app and it was resolved in 24 hours. Absolutely impressed.",
    name: 'Sneha Kapoor',
    role: 'Data Analyst, Mumbai',
    initials: 'SK',
    rating: 5,
  },
]

const GALLERY_IMAGES = [
  { id: 1, seed: 'gal1', alt: 'Spacious living area', w: 400, h: 520 },
  { id: 2, seed: 'gal2', alt: 'Study desk with natural light', w: 400, h: 300 },
  { id: 3, seed: 'gal3', alt: 'Cozy private room', w: 400, h: 460 },
  { id: 4, seed: 'gal4', alt: 'Common lounge', w: 400, h: 350 },
  { id: 5, seed: 'gal5', alt: 'Shared kitchen', w: 400, h: 480 },
  { id: 6, seed: 'gal6', alt: 'Rooftop terrace', w: 400, h: 310 },
]

const FEATURES_LIST = [
  'All listings verified and approved by our admin team',
  'Transparent complaint history visible for every PG',
  'Online admission application with owner approval flow',
  'Live seat availability updated in real time',
]

const OWNER_FEATURES = [
  'Manage admission requests with one click',
  'Track and resolve resident complaints',
  'View your complete resident roster',
  'Upload property photos and virtual tours',
  'Collect and showcase resident testimonials',
]

const PLATFORM_FEATURES = [
  'Verified PG listings with photo galleries',
  'Transparent complaint history per property',
  'Online admission and approval workflow',
  'Role-based access for owners and admins',
  'Secure JWT-authenticated sessions',
  'Mobile-first responsive design',
]

const QUICK_LINKS = [
  { label: 'Browse PGs', to: '/login' },
  { label: 'How It Works', href: '#features' },
  { label: 'For Students', to: '/register' },
  { label: 'List Your PG', to: '/register' },
  { label: 'Owner Login', to: '/login' },
  { label: 'Help Center', href: '#' },
]

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen font-sans overflow-x-hidden">
      <Navbar user={user} />
      <HeroSection />
      <TrustedBySection />
      <PromoSection />
      <WorkspaceGridSection />
      <TestimonialsSection />
      <OwnerSection />
      <CTASection />
      <Footer />
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ user }) {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-[#0C1A1E]/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 bg-coral rounded-lg flex items-center justify-center">
            <HouseIcon className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">PG Finder</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-white/70 hover:text-white text-sm font-medium transition-colors">Home</a>
          <a href="#features" className="text-white/70 hover:text-white text-sm font-medium transition-colors">How it Works</a>
          <a href="#listings" className="text-white/70 hover:text-white text-sm font-medium transition-colors">Explore PGs</a>
          <a href="#for-owners" className="text-white/70 hover:text-white text-sm font-medium transition-colors">For Owners</a>
          <a href="#testimonials" className="text-white/70 hover:text-white text-sm font-medium transition-colors">Reviews</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <Link
              to="/login"
              className="bg-coral hover:bg-coral-hover text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
            >
              Sign In
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
                Sign in
              </Link>
              <Link
                to="/register"
                className="bg-coral hover:bg-coral-hover text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
              >
                Book a Tour
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-charcoal-deep border-t border-white/10 px-6 py-4 space-y-1 animate-slide-in">
          <a href="#" className="block text-white/70 hover:text-white text-sm py-2.5 transition-colors" onClick={() => setOpen(false)}>Home</a>
          <a href="#features" className="block text-white/70 hover:text-white text-sm py-2.5 transition-colors" onClick={() => setOpen(false)}>How it Works</a>
          <a href="#listings" className="block text-white/70 hover:text-white text-sm py-2.5 transition-colors" onClick={() => setOpen(false)}>Explore PGs</a>
          <a href="#for-owners" className="block text-white/70 hover:text-white text-sm py-2.5 transition-colors" onClick={() => setOpen(false)}>For Owners</a>
          <a href="#testimonials" className="block text-white/70 hover:text-white text-sm py-2.5 transition-colors" onClick={() => setOpen(false)}>Reviews</a>
          <div className="flex flex-col gap-2 pt-3 border-t border-white/10 mt-2">
            <Link to="/login" className="text-white/70 hover:text-white text-sm py-2.5 text-center transition-colors" onClick={() => setOpen(false)}>
              Sign in
            </Link>
            <Link
              to="/register"
              className="bg-coral text-white text-sm font-semibold py-3 rounded-full text-center"
              onClick={() => setOpen(false)}
            >
              Book a Tour
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Hero Section ──────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section
      className="relative overflow-hidden pt-[72px]"
      style={{ background: 'radial-gradient(circle at top right, #F9DCC4 0%, #FECEA1 40%, #F5ECE7 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-28 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: Copy + Search */}
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 bg-white/50 border border-white/60 text-charcoal text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-coral rounded-full" />
              Verified PG Accommodation Platform
            </span>

            <h1 className="text-5xl lg:text-[64px] font-bold text-charcoal leading-[1.1] tracking-tight mb-6">
              Find Your Perfect<br />
              <span className="relative inline-block">
                Paying Guest
                <span
                  className="absolute -bottom-1 left-0 right-0 h-3 rounded-full opacity-30 -z-10"
                  style={{ background: '#F5847C' }}
                />
              </span>
              <br />Home
            </h1>

            <p className="text-charcoal/65 text-lg leading-relaxed mb-8 max-w-md">
              Browse verified PG accommodations across India. Apply for residency, manage your stay, and raise complaints — all from one platform.
            </p>

            {/* Search bar */}
            <div className="flex flex-col sm:flex-row gap-0 mb-8 max-w-lg bg-white rounded-2xl shadow-ambient overflow-hidden border border-white/60">
              <div className="flex-1 flex items-center gap-3 px-5 py-4">
                <LocationIcon className="w-4 h-4 text-charcoal/35 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search by city, area or PG name…"
                  className="flex-1 outline-none text-sm text-charcoal placeholder:text-charcoal/40 bg-transparent"
                  onKeyDown={(e) => { if (e.key === 'Enter') window.location.assign('/login') }}
                />
              </div>
              <Link
                to="/login"
                className="bg-charcoal hover:bg-charcoal-dark text-white font-semibold px-8 py-4 transition-colors whitespace-nowrap text-sm flex items-center justify-center gap-2"
              >
                <SearchIcon className="w-4 h-4" />
                Search
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-charcoal/65">
              {['500+ Verified Listings', '50+ Cities', 'Quick Admission'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircleIcon className="w-4 h-4 text-coral flex-shrink-0" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Two portrait images with floating stat cards */}
          <div className="relative hidden lg:flex gap-6 h-[560px] animate-fade-up" style={{ animationDelay: '0.2s' }}>
            {/* First image — full height, slight right offset */}
            <div className="relative w-1/2">
              <div className="absolute inset-0 bottom-16 rounded-[32px] overflow-hidden shadow-ambient border-4 border-white/50">
                <img
                  src="https://picsum.photos/seed/pghero-a/400/600"
                  alt="Modern PG room"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating stat — top left */}
              <div className="absolute -top-4 -left-4 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-ambient border border-white z-10 flex items-center gap-3">
                <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheckIcon className="w-5 h-5 text-coral" />
                </div>
                <div>
                  <p className="text-sm font-bold text-charcoal">500+</p>
                  <p className="text-[10px] text-charcoal/50 uppercase tracking-wider">Verified PGs</p>
                </div>
              </div>
            </div>

            {/* Second image — starts lower */}
            <div className="relative w-1/2">
              <div className="absolute inset-0 top-16 rounded-[32px] overflow-hidden shadow-ambient border-4 border-white/50">
                <img
                  src="https://picsum.photos/seed/pghero-b/400/600"
                  alt="Comfortable living space"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating stat — bottom left */}
              <div className="absolute bottom-4 -left-8 bg-white/90 backdrop-blur-md rounded-2xl px-5 py-4 shadow-ambient border border-white z-10">
                <p className="text-2xl font-bold text-charcoal leading-none">2,000+</p>
                <p className="text-[10px] text-charcoal/50 uppercase tracking-wider mt-1.5">Happy Residents</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave bottom edge — absolute to avoid interfering with flex/grid */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 48" className="w-full block" style={{ marginBottom: '-1px' }} preserveAspectRatio="none">
          <path d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z" fill="#ffffff" />
        </svg>
      </div>
    </section>
  )
}

// ─── Trusted By ────────────────────────────────────────────────────────────────

function TrustedBySection() {
  return (
    <div className="bg-white py-12 relative overflow-hidden">
      {/* Decorative side blurs */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 lg:gap-24 opacity-60">
          <div className="flex-shrink-0">
            <p className="text-[11px] font-bold text-charcoal/40 uppercase tracking-[0.2em] whitespace-nowrap">
              Trusted by professionals at
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {TRUSTED_BY.map(name => (
              <span 
                key={name} 
                className="text-charcoal/30 font-bold text-lg lg:text-xl tracking-tight select-none cursor-default transition-all duration-300 hover:text-coral hover:opacity-100 hover:scale-105"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Promo Section ─────────────────────────────────────────────────────────────

function PromoSection() {
  return (
    <section id="features" className="bg-warm-100 py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-[#0C1A1E] rounded-[40px] overflow-hidden p-8 lg:p-20 shadow-2xl relative">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-coral/10 blur-[100px] -mr-32 -mt-32" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: Rotated image */}
            <div className="flex justify-center">
              <div className="relative w-64 h-64 lg:w-80 lg:h-80">
                <div className="absolute inset-0 bg-coral rounded-3xl -rotate-6 opacity-25" />
                <div className="absolute inset-0 rounded-3xl overflow-hidden rotate-3 shadow-ambient" style={{ transform: 'rotate(3deg) scale(1.05)' }}>
                  <img
                    src="https://picsum.photos/seed/pgpromo/400/400"
                    alt="PG common space"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div>
              <p className="text-xs font-bold text-coral uppercase tracking-widest mb-3">For Students & Guests</p>
              <h2 className="text-4xl font-bold text-white leading-tight tracking-tight mb-5">
                Discover PGs Designed<br />for Comfortable Living
              </h2>
              <p className="text-white/55 text-base leading-relaxed mb-8">
                From studio rooms to shared dormitories, every listing is verified by our team so you move in with full confidence.
              </p>

              <ul className="space-y-4 mb-9">
                {FEATURES_LIST.map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-coral flex-shrink-0 mt-0.5" />
                    <span className="text-white/70 text-sm leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-white hover:bg-warm-50 text-charcoal font-semibold px-7 py-3.5 rounded-full transition-colors text-sm"
              >
                Explore Listings
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Workspace Grid Section ────────────────────────────────────────────────────

function WorkspaceGridSection() {
  return (
    <section id="listings" className="bg-warm-100 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-bold text-coral uppercase tracking-widest mb-2">Featured</p>
            <h2 className="text-3xl font-bold text-charcoal tracking-tight">Premium PG Spaces</h2>
          </div>
          <Link to="/login" className="text-coral text-sm font-semibold hover:underline flex items-center gap-1.5">
            See All <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_PGS.map(pg => (
            <WorkspacePGCard key={pg.id} pg={pg} />
          ))}
        </div>
      </div>
    </section>
  )
}

function WorkspacePGCard({ pg }) {
  return (
    <Link
      to="/login"
      className="group bg-white rounded-2xl overflow-hidden hover:-translate-y-2 transition-all duration-300 shadow-card hover:shadow-ambient block"
    >
      <div className="relative overflow-hidden h-52">
        <img
          src={pg.image}
          alt={pg.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-charcoal text-xs font-semibold px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
          <StarIcon className="w-3 h-3 text-yellow-400" /> {pg.rating}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-charcoal text-base mb-1">{pg.name}</h3>
        <p className="text-charcoal/50 text-xs mb-4 flex items-center gap-1">
          <LocationIcon className="w-3 h-3 flex-shrink-0" /> {pg.location}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-charcoal font-bold text-lg">{pg.price}</span>
          <span className="text-xs bg-coral/10 text-coral font-semibold px-2.5 py-1 rounded-full">Available</span>
        </div>
      </div>
    </Link>
  )
}

// ─── Testimonials ──────────────────────────────────────────────────────────────

function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-coral uppercase tracking-widest mb-3">What Residents Say</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-charcoal tracking-tight">
            Loved by Growing Residents
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(t => (
            <TestimonialCard key={t.id} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialCard({ t }) {
  return (
    <div className="bg-warm-50 rounded-2xl p-6 border border-warm-200 hover:shadow-ambient transition-all flex flex-col">
      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: t.rating }).map((_, i) => (
          <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
        ))}
      </div>

      <p className="text-charcoal/65 text-sm leading-relaxed mb-6 flex-1 italic">
        &ldquo;{t.quote}&rdquo;
      </p>

      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #F5847C 0%, #FECEA1 100%)' }}
        >
          {t.initials}
        </div>
        <div>
          <p className="text-charcoal font-semibold text-sm">{t.name}</p>
          <p className="text-charcoal/45 text-xs">{t.role}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Owner Section ─────────────────────────────────────────────────────────────

function OwnerSection() {
  return (
    <section id="for-owners" className="bg-canvas py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: Content */}
          <div>
            <p className="text-xs font-bold text-coral uppercase tracking-widest mb-3">For Property Owners</p>
            <h2 className="text-4xl font-bold text-charcoal leading-tight tracking-tight mb-5">
              Manage Your PG with a{' '}
              <span className="text-coral">Digital Dashboard</span>
            </h2>
            <p className="text-charcoal/60 text-lg leading-relaxed mb-8">
              List your property once and manage everything from your dashboard. Admissions, complaints, resident roster, and photos — all in one place.
            </p>

            <ul className="space-y-4 mb-9">
              {OWNER_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-3">
                  <span className="w-5 h-5 bg-charcoal/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckIcon className="w-3 h-3 text-charcoal" />
                  </span>
                  <span className="text-charcoal/70 text-sm leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-coral hover:bg-coral-hover text-white font-semibold px-6 py-3.5 rounded-full transition-colors text-sm shadow-warm"
              >
                List Your Property →
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 border border-charcoal/25 text-charcoal hover:border-charcoal/50 font-semibold px-6 py-3.5 rounded-full transition-colors text-sm"
              >
                Owner Sign In
              </Link>
            </div>
          </div>

          {/* Right: Image with price badge */}
          <div className="hidden lg:block relative">
            <div className="rounded-3xl overflow-hidden shadow-ambient" style={{ height: '480px' }}>
              <img
                src="https://picsum.photos/seed/pglaptop/600/480"
                alt="PG owner using dashboard"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Price badge circle */}
            <div className="absolute -bottom-5 -left-5 w-28 h-28 bg-charcoal rounded-full flex flex-col items-center justify-center text-white shadow-ambient z-10">
              <p className="text-xl font-bold leading-none">₹12k</p>
              <p className="text-[10px] text-white/55 mt-1">/month</p>
            </div>
            {/* Floating overlay card */}
            <div className="absolute top-6 -right-4 bg-white rounded-2xl px-4 py-3.5 shadow-ambient border border-warm-200 z-10">
              <p className="text-sm font-bold text-charcoal">3 New Requests</p>
              <p className="text-xs text-charcoal/50 mt-0.5">Awaiting your decision</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}



// ─── CTA Section ───────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="bg-warm-100 py-20 lg:py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div
          className="relative overflow-hidden rounded-3xl px-10 lg:px-20 py-16 lg:py-20 text-center"
          style={{ background: '#0C1A1E' }}
        >
          {/* Blobs */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-coral rounded-full opacity-10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#FECEA1' }} />

          <p className="text-xs font-bold text-coral uppercase tracking-widest mb-4 relative">Ready to Start?</p>
          <h2 className="text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-6 relative">
            Let Your Team Work with<br />Comfort and Style
          </h2>
          <p className="text-white/50 text-lg leading-relaxed mb-10 max-w-lg mx-auto relative">
            Join thousands of residents and working professionals who found their ideal PG through our verified platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
            <Link
              to="/register"
              className="bg-coral hover:bg-coral-hover text-white font-semibold px-8 py-4 rounded-full transition-colors text-base shadow-warm"
            >
              Get Started — It&apos;s Free
            </Link>
            <Link
              to="/login"
              className="border border-white/25 text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-full transition-colors text-base"
            >
              Browse Listings
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-6 mt-16 pt-10 border-t border-white/10 relative">
            {[
              { value: '500+', label: 'PG Listings' },
              { value: '2,000+', label: 'Happy Guests' },
              { value: '50+', label: 'Cities Covered' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl lg:text-4xl font-bold text-white mb-1">{s.value}</p>
                <p className="text-white/40 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  const [email, setEmail] = useState('')

  return (
    <footer className="bg-[#0C1A1E] text-white/60 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">

          {/* Brand + social */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-coral rounded-lg flex items-center justify-center flex-shrink-0">
                <HouseIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">PG Finder</span>
            </Link>
            <p className="text-white/35 text-xs leading-relaxed mb-6 max-w-[180px]">
              Verified PG accommodation discovery and management for modern India.
            </p>
            <div className="flex gap-2.5">
              <a href="#" aria-label="Website" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                <GlobeIcon className="w-4 h-4 text-white/60" />
              </a>
              <a href="#" aria-label="Share" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                <ShareIcon className="w-4 h-4 text-white/60" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-white font-semibold text-sm mb-5">Quick Links</p>
            <ul className="space-y-3">
              {QUICK_LINKS.map(l => (
                <li key={l.label}>
                  {l.to ? (
                    <Link to={l.to} className="text-xs hover:text-white/90 transition-colors">{l.label}</Link>
                  ) : (
                    <a href={l.href} className="text-xs hover:text-white/90 transition-colors">{l.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white font-semibold text-sm mb-5">Contact</p>
            <ul className="space-y-3.5">
              <li className="flex items-center gap-2.5">
                <PhoneIconSm className="w-4 h-4 text-coral flex-shrink-0" />
                <span className="text-xs">{PHONE}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MailIconSm className="w-4 h-4 text-coral flex-shrink-0" />
                <span className="text-xs">{EMAIL}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <LocationIcon className="w-4 h-4 text-coral flex-shrink-0 mt-0.5" />
                <span className="text-xs leading-relaxed">{ADDRESS}</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <p className="text-white font-semibold text-sm mb-2">Newsletter</p>
            <p className="text-xs text-white/35 mb-5 leading-relaxed">
              Get the latest PG listings and living tips in your inbox.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-coral/50 transition-colors min-w-0"
              />
              <button
                className="w-10 h-10 bg-coral hover:bg-coral-hover rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                aria-label="Subscribe"
              >
                <SendIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} PG Finder. All rights reserved.
          </p>
          <p className="text-xs text-white/20">
            Built for the modern paying guest experience.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function HouseIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function LocationIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function CheckCircleIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ArrowRightIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  )
}

function ShieldCheckIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function StarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )
}

function PeopleIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function MenuIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function XIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function GlobeIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  )
}

function ShareIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  )
}

function SendIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  )
}

function PhoneIconSm({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  )
}

function MailIconSm({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}
