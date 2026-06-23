import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPGList } from '@shared/api/pgs'
import { getFeaturedTestimonials } from '@shared/api/testimonials'
import { SkeletonBase } from '@shared/components/Skeleton'

export default function LandingPage() {
  return (
    <div className="bg-[#fbf9f8] text-[#1b1c1c] overflow-x-hidden">
      <Navbar />
      <main className="pt-14 lg:pt-20">
        <HeroSection />
        <TrustIndicators />
        <PopularLocationsSection />
        <CollegesSection />
        <FeaturedPGsSection />
        <ValuePropSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <OwnerSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-[#E5E7EB]/60"
      style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(251,249,248,0.92)' }}
    >
      <div className="flex justify-between items-center w-full px-6 lg:px-16 max-w-[1280px] mx-auto h-14 lg:h-20">
        <Link to="/">
          <img src="/logo.png" alt="Nest Stay" className="h-[52px] lg:h-14 w-auto" />
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          <a href="#home" className="text-sm font-bold text-[#e98a76] border-b-2 border-[#e98a76] pb-1">Home</a>
          <a href="#listings" className="text-sm font-medium text-[#434849] hover:text-black transition-colors">Properties</a>
          <a href="#colleges" className="text-sm font-medium text-[#434849] hover:text-black transition-colors">PG Near You</a>
          <a href="#for-owners" className="text-sm font-medium text-[#434849] hover:text-black transition-colors">For Property Owners</a>
          <a href="#about" className="text-sm font-medium text-[#434849] hover:text-black transition-colors">About Us</a>
          <a href="#contact" className="text-sm font-medium text-[#434849] hover:text-black transition-colors">Contact</a>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/register"
            className="bg-[#e98a76] text-white px-4 py-2 lg:px-5 lg:py-2.5 rounded-full lg:rounded-xl text-xs lg:text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
          >
            Register
          </Link>
          <Link
            to="/owner/register"
            className="hidden xl:block bg-[#101e22] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
          >
            List Your Property
          </Link>
          <button
            className="lg:hidden text-black p-2.5 rounded-lg hover:bg-[#f0eded] transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">{open ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#fbf9f8] border-t border-[#E5E7EB] px-6 py-4 space-y-1 shadow-lg">
          <a href="#home" className="block text-sm py-2.5 text-[#e98a76] font-bold" onClick={() => setOpen(false)}>Home</a>
          <a href="#listings" className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>Properties</a>
          <a href="#colleges" className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>PG Near You</a>
          <a href="#for-owners" className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>For Property Owners</a>
          <a href="#about" className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>About Us</a>
          <a href="#contact" className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>Contact</a>
          <div className="pt-3 border-t border-[#E5E7EB] space-y-1">
            <Link to="/register" className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>Register</Link>
            <Link to="/owner/register" className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>List Your Property</Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

const SELECT_ARROW = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2373787a' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")"

function HeroSection() {
  const navigate = useNavigate()
  const [college, setCollege] = useState('')
  const [area, setArea] = useState('')
  const [budget, setBudget] = useState('')
  const [gender, setGender] = useState('')

  function handleFindPG(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    const c = college.trim()
    const b = budget.trim().replace(/[^0-9]/g, '')
    if (c) params.set('college', c)
    if (area && area !== 'Select Area') params.set('area', area)
    if (b && parseInt(b) > 0) params.set('budget', b)
    if (gender && gender !== 'Boys / Girls' && gender !== 'Any') params.set('gender', gender.toLowerCase())
    navigate(`/properties${params.toString() ? '?' + params.toString() : ''}`)
  }

  return (
    <section
      id="home"
      className="relative overflow-hidden"
    >
      {/* Mobile background image */}
      <div
        className="absolute inset-0 z-0 lg:hidden"
        style={{
          backgroundImage: "url('/hero-section-mobile.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: '65% center',
        }}
      />
      {/* Mobile fade overlay */}
      <div
        className="absolute inset-0 z-0 lg:hidden"
        style={{
          background: 'linear-gradient(to bottom, rgba(251,249,248,0.80) 0%, rgba(251,249,248,0.60) 55%, rgba(251,249,248,0.20) 100%)',
        }}
      />

      {/* Desktop background image */}
      <div
        className="absolute inset-0 z-0 hidden lg:block"
        style={{
          backgroundImage: "url('/hero-section')",
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
        }}
      />
      {/* Desktop fade overlay: left-to-right */}
      <div
        className="absolute inset-0 z-0 hidden lg:block"
        style={{
          background: 'linear-gradient(to right, #fbf9f8 0%, #fbf9f8 45%, rgba(251,249,248,0.85) 65%, rgba(251,249,248,0.2) 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 lg:px-16 py-12 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        <div>
          {/* Trust badge */}
          <span className="inline-flex items-center gap-1.5 bg-[#fef3f0] text-[#c0431e] border border-[#f4c4b5] px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wide mb-3">
            <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            Verified PG Discovery Platform — Pune
          </span>

          {/* Headline */}
          <h1 className="text-[28px] sm:text-[34px] lg:text-[48px] font-extrabold text-[#1b1c1c] leading-[1.18] mb-3">
            Find Verified PGs &amp; Hostels{' '}
            <span className="text-[#e98a76]">Near Your College or Workplace</span>
          </h1>

          {/* Supporting text */}
          <p className="text-sm sm:text-base lg:text-lg text-[#434849] mb-4 leading-relaxed max-w-[460px] lg:max-w-none">
            Safe, Affordable &amp; Fully Verified Accommodation for Students and Working Professionals.
          </p>

          {/* Social proof — above form to prime trust before action */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex">
              {[
                { initials: 'A', bg: '#8b5cf6', color: '#fff' },
                { initials: 'R', bg: '#ec4899', color: '#fff' },
                { initials: 'P', bg: '#06b6d4', color: '#fff' },
                { initials: '+',  bg: '#f3f4f6', color: '#73787a' },
              ].map(({ initials, bg, color }, i) => (
                <div
                  key={initials}
                  className={`w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold ${i > 0 ? '-ml-2.5' : ''}`}
                  style={{ backgroundColor: bg, color }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <div className="text-sm text-[#1b1c1c]">
              <span className="font-semibold">Trusted by Residents</span><br />
              Across Pune
            </div>
          </div>

          {/* Search form card */}
          <form onSubmit={handleFindPG} className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.10)] border border-[#E5E7EB]">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[#73787a] uppercase tracking-wide px-1">College / Workplace</label>
                <input
                  type="text"
                  value={college}
                  onChange={e => setCollege(e.target.value)}
                  placeholder="College or workplace"
                  className="h-[48px] sm:h-[52px] px-3 border border-[#d1d5db] rounded-xl text-sm outline-none focus:border-[#e98a76] focus:bg-[#fffaf9] bg-white transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[#73787a] uppercase tracking-wide px-1">Area</label>
                <select
                  value={area}
                  onChange={e => setArea(e.target.value)}
                  className="h-[48px] sm:h-[52px] px-3 pr-8 border border-[#d1d5db] rounded-xl text-sm outline-none focus:border-[#e98a76] focus:bg-[#fffaf9] bg-white text-[#434849] appearance-none transition-colors"
                  style={{ backgroundImage: SELECT_ARROW, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="">Select Area</option>
                  <option>Hinjewadi</option>
                  <option>Baner</option>
                  <option>Kharadi</option>
                  <option>Wakad</option>
                  <option>Kalyani Nagar</option>
                  <option>Viman Nagar</option>
                  <option>Pimpri-Chinchwad</option>
                  <option>Hadapsar</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[#73787a] uppercase tracking-wide px-1">Budget</label>
                <input
                  type="text"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder="e.g. ₹8,000"
                  className="h-[48px] sm:h-[52px] px-3 border border-[#d1d5db] rounded-xl text-sm outline-none focus:border-[#e98a76] focus:bg-[#fffaf9] bg-white transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[#73787a] uppercase tracking-wide px-1">Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="h-[48px] sm:h-[52px] px-3 pr-8 border border-[#d1d5db] rounded-xl text-sm outline-none focus:border-[#e98a76] focus:bg-[#fffaf9] bg-white text-[#434849] appearance-none transition-colors"
                  style={{ backgroundImage: SELECT_ARROW, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="">Boys / Girls</option>
                  <option value="Boys">Boys</option>
                  <option value="Girls">Girls</option>
                  <option value="Any">Any</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-[#e98a76] text-white px-6 h-[56px] rounded-xl text-[15px] font-bold hover:opacity-90 active:scale-95 transition-all flex-1 shadow-[0_4px_12px_rgba(233,138,118,0.40)]"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                Find PG
              </button>
              <a
                href="https://wa.me/919970114079"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 h-[48px] sm:h-[56px] border border-[#c3c7c9] rounded-xl bg-[#f9f8f7] text-[#1b1c1c] text-sm font-medium hover:bg-[#f0eded] transition-colors flex-1"
              >
                <span className="material-symbols-outlined text-[18px] text-[#434849]">support_agent</span>
                Talk to Expert
              </a>
            </div>
          </form>

        </div>

      </div>
    </section>
  )
}

// ─── Trust Indicators ─────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  {
    icon: 'verified',
    title: 'Verified Listings',
    desc: 'Every PG is reviewed and verified before going live on the platform.',
  },
  {
    icon: 'currency_rupee',
    title: 'Zero Brokerage',
    desc: 'Connect directly with PG owners. No middlemen, no hidden fees.',
  },
  {
    icon: 'groups',
    title: 'Students & Professionals',
    desc: 'Serving both students and working professionals looking for accommodation.',
  },
  {
    icon: 'shield',
    title: 'Safe & Transparent',
    desc: 'Verified owners, real photos, honest reviews from actual residents.',
  },
]

function TrustIndicators() {
  return (
    <section className="py-14 lg:py-20 bg-white border-y border-[#E5E7EB]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
        <div className="text-center mb-10">
          <span className="text-[#e98a76] text-xs font-bold uppercase tracking-wider mb-2 block">Why Nest Stay</span>
          <h2 className="text-[24px] lg:text-[32px] font-extrabold text-[#1b1c1c] leading-tight">
            A Platform Built on Trust
          </h2>
          <p className="text-sm text-[#73787a] mt-2 max-w-md mx-auto leading-relaxed">
            Find accommodation that fits your life — whether you're a student or a working professional.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TRUST_ITEMS.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-[#fbf9f8] border border-[#E5E7EB] rounded-2xl p-5 flex flex-col gap-3 hover:border-[#e98a76]/40 hover:shadow-md transition-all duration-200"
              style={{ boxShadow: 'rgba(0,0,0,0.04) 0px 2px 8px' }}
            >
              <div className="w-10 h-10 rounded-xl bg-[#fff3ee] flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[#e98a76]" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-[#1b1c1c] mb-1">{title}</p>
                <p className="text-xs text-[#73787a] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Popular Locations ────────────────────────────────────────────────────────

const LOCATIONS = [
  { name: 'Kasba Peth',    count: '50+', img: '/cities/hinjewadi.jpeg' },
  { name: 'Baner',         count: '60+', img: '/cities/baner.jpeg' },
  { name: 'Koregaon Park', count: '45+', img: '/cities/kharadi.jpeg' },
  { name: 'Shivajinagar',  count: '55+', img: '/cities/wakad.jpeg' },
  { name: 'Kharadi',     count: '80+', img: '/cities/kalyani-nagar.jpeg' },
  { name: 'Deccan',        count: '35+', img: '/cities/viman-nagar.jpeg' },
]

function PopularLocationsSection() {
  return (
    <section className="py-12 lg:py-20">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
        <h2 className="text-[28px] font-bold text-[#1b1c1c] text-center mb-8">Popular Areas in Pune</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {LOCATIONS.map(({ name, count, img }) => (
            <Link
              key={name}
              to="/login"
              className="relative rounded-2xl overflow-hidden cursor-pointer transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl group"
              style={{ aspectRatio: '3/2' }}
            >
              <img
                src={img}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <div className="text-base font-bold mb-0.5">{name}</div>
                <div className="text-sm opacity-80">{count} Properties</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Colleges Section ─────────────────────────────────────────────────────────

const COLLEGES = [
  { name: 'Symbiosis',         abbr: 'S', from: '#3b82f6', to: '#1e40af', logo: '/colleges/symbiosis.svg', count: '650+' },
  { name: 'PCCOE',             abbr: 'P', from: '#ef4444', to: '#dc2626', logo: '/colleges/pccoe.jpeg',    count: '400+' },
  { name: 'DY Patil',          abbr: 'D', from: '#8b5cf6', to: '#6d28d9', logo: '/colleges/dypatil.png',  count: '450+' },
  { name: 'Fergusson College', abbr: 'F', from: '#14b8a6', to: '#0d9488', logo: '/colleges/fergusson.png',count: '350+' },
  { name: 'COEP',              abbr: 'C', from: '#f59e0b', to: '#d97706', logo: '/colleges/coep.png',     count: '300+' },
  { name: 'AISSMS',            abbr: 'A', from: '#e98a76', to: '#c06a58', logo: '/colleges/aissms.png',   count: '250+' },
]

function CollegeLogo({ name, abbr, from, to, logo }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-white border-2 border-[#E5E7EB] flex items-center justify-center overflow-hidden shadow-sm">
      {logo && !failed ? (
        <img
          src={logo}
          alt={`${name} logo`}
          loading="lazy"
          className="w-full h-full object-contain p-2"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-white text-xl font-bold"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          {abbr}
        </div>
      )}
    </div>
  )
}

function CollegesSection() {
  return (
    <section id="colleges" className="py-8 bg-white border-y border-[#E5E7EB]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold text-[#1b1c1c]">
            Find Accommodation Near Your College or Workplace
          </h2>
          <Link to="/login" className="text-[#e98a76] text-sm font-semibold flex items-center gap-1 hover:underline flex-shrink-0">
            View All Locations <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {COLLEGES.map(({ name, abbr, from, to, logo }) => (
            <Link
              key={name}
              to="/login"
              className="bg-white border border-[#E5E7EB] rounded-xl py-5 px-3 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[#e98a76] cursor-pointer"
            >
              <CollegeLogo name={name} abbr={abbr} from={from} to={to} logo={logo} />
              <p className="text-sm font-semibold text-[#1b1c1c]">{name}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Featured Properties ──────────────────────────────────────────────────────

const FALLBACK_PGS = [
  {
    _id: 'fp1',
    name: 'Sunrise Boys PG',
    location: { area: 'Hinjewadi Phase 1', city: 'Pune' },
    pricing: { rent: 7500 },
    images: [],
  },
  {
    _id: 'fp2',
    name: 'Green Nest Girls PG',
    location: { area: 'Baner', city: 'Pune' },
    pricing: { rent: 9000 },
    images: [],
  },
  {
    _id: 'fp3',
    name: 'Urban Stay Co-Living',
    location: { area: 'Kharadi', city: 'Pune' },
    pricing: { rent: 8200 },
    images: [],
  },
]

const PG_PLACEHOLDER = '/pg-placeholder.jpg'

function FeaturedPGsSection() {
  const [pgs, setPgs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPGList({ limit: 3 })
      .then(res => setPgs(res.data?.length ? res.data : FALLBACK_PGS))
      .catch(() => setPgs(FALLBACK_PGS))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="listings" className="py-12 lg:py-20">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-[#e98a76] text-xs font-bold uppercase tracking-wider mb-2 block">Featured</span>
            <h2 className="text-[28px] font-bold text-[#1b1c1c]">Featured Properties</h2>
          </div>
          <Link to="/login" className="text-[#e98a76] text-sm font-semibold flex items-center gap-1 hover:underline flex-shrink-0">
            See All <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </Link>
        </div>

        {/* Desktop: 3-col grid */}
        {loading ? (
          <div className="hidden md:grid md:grid-cols-3 gap-6 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
                <SkeletonBase className="w-full h-48 rounded-none" />
                <div className="p-5 space-y-3">
                  <SkeletonBase className="h-5 w-2/3" />
                  <SkeletonBase className="h-4 w-1/2" />
                  <SkeletonBase className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {pgs.map(pg => <FeaturedPGCard key={pg._id} pg={pg} />)}
          </div>
        )}

        {/* Mobile: horizontal scroll strip */}
        {loading ? (
          <div
            className="flex md:hidden gap-4 overflow-x-auto pb-3 -mx-6 px-6 snap-x snap-mandatory animate-pulse"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[78vw] snap-start">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
                  <SkeletonBase className="w-full h-48 rounded-none" />
                  <div className="p-5 space-y-3">
                    <SkeletonBase className="h-5 w-2/3" />
                    <SkeletonBase className="h-4 w-1/2" />
                    <SkeletonBase className="h-4 w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex md:hidden gap-4 overflow-x-auto pb-3 -mx-6 px-6 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {pgs.map(pg => (
              <div key={pg._id} className="flex-shrink-0 w-[78vw] snap-start">
                <FeaturedPGCard pg={pg} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function FeaturedPGCard({ pg }) {
  const [imgError, setImgError] = useState(false)
  const image = (!imgError && pg.images?.[0]) ? (pg.images[0]?.url || pg.images[0]) : null
  const area = pg.location?.area
  const city = pg.location?.city
  const location = [area, city].filter(Boolean).join(', ') || '—'
  const rent = pg.pricing?.rent

  return (
    <div
      className="card-lift bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden h-full flex flex-col group"
      style={{ boxShadow: 'rgba(0,0,0,0.05) 0px 2px 8px, rgba(0,0,0,0.02) 0px 0px 1px' }}
    >
      <div className="relative h-52 overflow-hidden bg-[#f6f3f2] flex items-center justify-center flex-shrink-0">
        {image ? (
          <img
            src={image}
            alt={pg.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[48px] text-[#d1d5db]">apartment</span>
            <span className="text-xs text-[#9ca3af]">{pg.location?.area || 'Pune'}</span>
          </div>
        )}
        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/95 backdrop-blur-sm text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-100"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}>
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
          </svg>
          Verified
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-bold text-[#1b1c1c] mb-1 group-hover:text-[#e98a76] transition-colors leading-snug">{pg.name}</h3>
        <div className="flex items-center gap-1 text-[#73787a] text-sm mb-4">
          <span className="material-symbols-outlined text-[#9ca3af]" style={{ fontSize: '14px' }}>location_on</span>
          {location}
        </div>
        <div className="mt-auto">
          <div className="text-[22px] font-bold text-[#1b1c1c] tracking-tight mb-4">
            {rent ? <>&#8377;{rent.toLocaleString('en-IN')}<span className="text-xs font-normal text-[#9ca3af] ml-1">/mo</span></> : '—'}
          </div>
          <div className="flex gap-2">
            <Link
              to="/login"
              className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-[10px] text-sm font-semibold text-[#434849] text-center hover:bg-[#f6f3f2] hover:border-[#d4cfc9] transition-all"
            >
              View Details
            </Link>
            <Link
              to="/login"
              className="flex-1 px-4 py-2.5 bg-[#e98a76] text-white rounded-[10px] text-sm font-semibold text-center hover:opacity-90 active:scale-[0.97] transition-all btn-glow"
            >
              Book Visit
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Why Students Love NestStay ───────────────────────────────────────────────

function ValuePropSection() {
  return (
    <section id="about" className="py-16 lg:py-24 bg-[#101e22] text-white">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        <div className="order-2 lg:order-1 w-full h-72 lg:h-96 rounded-2xl overflow-hidden">
          <img src="/student-section.png" alt="Students using Nest Stay" className="w-full h-full object-cover" />
        </div>

        <div className="order-1 lg:order-2">
          <span className="text-[#ffdbd0] text-xs font-bold tracking-widest uppercase mb-4 block">
            Why Students Love NestStay
          </span>
          <h2 className="text-[28px] lg:text-[32px] font-bold mb-8 leading-tight">
            Everything You Need, <br /> All in One Place
          </h2>
          <ul className="space-y-5">
            {[
              { icon: 'verified',       title: 'Verified Properties',   desc: 'Every property is thoroughly verified for safety and quality' },
              { icon: 'shield',         title: 'Safe Environment',       desc: 'Your security is our top priority' },
              { icon: 'bolt',           title: 'Easy Booking',           desc: 'Simple and hassle-free booking process' },
              { icon: 'payments',       title: 'Transparent Pricing',    desc: 'No hidden charges, all costs upfront' },
              { icon: 'support_agent',  title: 'Student Support',        desc: '24/7 customer support for your needs' },
            ].map(({ icon, title, desc }) => (
              <li key={title} className="flex gap-4">
                <span className="material-symbols-outlined text-[#e98a76] text-[22px] flex-shrink-0 mt-0.5">{icon}</span>
                <span className="text-sm text-[#bac9ce] leading-relaxed">
                  <strong className="text-white font-semibold">{title}</strong> — {desc}
                </span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  { n: '1', title: 'Search',  desc: 'Browse verified properties near your college or workplace' },
  { n: '2', title: 'Compare', desc: 'Compare prices, amenities and locations side by side'      },
  { n: '3', title: 'Apply',   desc: 'Submit your admission request online — no visits needed'   },
  { n: '4', title: 'Move In', desc: 'Get approved by the owner and move into your new home'      },
]

function HowItWorksSection() {
  return (
    <section className="py-12 lg:py-20 bg-[#f6f3f2] border-y border-[#E5E7EB]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
        <h2 className="text-[28px] font-bold text-[#1b1c1c] text-center mb-10">How NestStay Works</h2>
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            className="absolute top-5 left-[12.5%] right-[12.5%] h-px hidden lg:block"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, #d1d5db 0, #d1d5db 8px, transparent 8px, transparent 16px)',
            }}
          />
          {STEPS.map(({ n, title, desc }) => (
            <div
              key={n}
              className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-center relative z-10"
            >
              <div className="w-10 h-10 bg-[#e98a76] text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                {n}
              </div>
              <div className="text-base font-semibold text-[#1b1c1c] mb-2">{title}</div>
              <div className="text-xs text-[#73787a] leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const FALLBACK_TESTIMONIALS = [
  {
    _id: 'f1',
    rating: 5,
    content: 'NestStay made finding a PG super easy! The verification process gave me complete peace of mind about safety and quality.',
    createdBy: { name: 'Rohit Sharma' },
    pgSnapshot: { name: 'MIT-WPU' },
  },
  {
    _id: 'f2',
    rating: 5,
    content: 'Excellent support team and transparent pricing. Found my perfect accommodation without any hassle or hidden charges!',
    createdBy: { name: 'Ananya Verma' },
    pgSnapshot: { name: 'Symbiosis' },
  },
  {
    _id: 'f3',
    rating: 5,
    content: 'Best platform for student accommodation. Quick bookings and amazing customer service throughout the entire process!',
    createdBy: { name: 'Pranav Joshi' },
    pgSnapshot: { name: 'COEP' },
  },
]

const AVATAR_COLORS = [
  ['bg-[#ffdbd0]', 'text-[#3a0b00]'],
  ['bg-[#d0e8ff]', 'text-[#003a6a]'],
  ['bg-[#d0ffd8]', 'text-[#003a10]'],
  ['bg-[#f5d0ff]', 'text-[#3a006a]'],
  ['bg-[#fff3d0]', 'text-[#3a2800]'],
  ['bg-[#d0fffa]', 'text-[#003a35]'],
]

function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFeaturedTestimonials()
      .then(res => setTestimonials(res.data?.length ? res.data : FALLBACK_TESTIMONIALS))
      .catch(() => setTestimonials(FALLBACK_TESTIMONIALS))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="reviews" className="py-12 lg:py-20">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
        <div className="text-center mb-10">
          <span className="text-[#e98a76] text-xs font-bold uppercase tracking-wider mb-2 block">What Residents Say</span>
          <h2 className="text-[28px] font-bold text-[#1b1c1c]">What Students Say</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-[#E5E7EB] space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => <SkeletonBase key={j} className="w-4 h-4 rounded" />)}
                </div>
                <div className="space-y-2">
                  <SkeletonBase className="h-3 rounded w-full" />
                  <SkeletonBase className="h-3 rounded w-5/6" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <SkeletonBase className="w-11 h-11 rounded-full" />
                  <div className="space-y-1.5">
                    <SkeletonBase className="h-3 rounded w-24" />
                    <SkeletonBase className="h-2.5 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.length > 0
              ? testimonials.map((t, idx) => {
                  const name = t.createdBy?.name || 'Resident'
                  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                  const [avatarBg, avatarText] = AVATAR_COLORS[idx % AVATAR_COLORS.length]
                  return (
                    <div key={t._id} className="bg-white p-6 rounded-2xl border border-[#E5E7EB] hover:shadow-card transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${avatarBg} ${avatarText}`}>
                          {initials}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[#1b1c1c]">{name}</div>
                          {t.pgSnapshot?.name && (
                            <div className="text-xs text-[#73787a]">{t.pgSnapshot.name}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-0.5 text-[#e98a76] mb-3">
                        {[...Array(t.rating)].map((_, i) => (
                          <span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        ))}
                      </div>
                      <p className="text-sm text-[#434849] leading-relaxed italic">"{t.content}"</p>
                    </div>
                  )
                })
              : null}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Owner Section ────────────────────────────────────────────────────────────

function OwnerSection() {
  return (
    <section id="for-owners" className="py-16 lg:py-24 bg-[#101e22] text-white">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16 text-center">
        <h2 className="text-[32px] lg:text-[40px] font-bold mb-6 leading-tight">
          Own a PG?<br />
          <span className="text-[#e98a76]">Get More Bookings Through NestStay</span>
        </h2>
        <p className="text-[#bac9ce] text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
          List your property once and manage everything from your dashboard — admissions, complaints, residents, and photos, all in one place.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mb-12">
          {['One-click admissions', 'Photo management', 'Complaint tracking', 'Resident analytics'].map(f => (
            <div key={f} className="flex flex-col items-center gap-2 text-sm text-[#bac9ce]">
              <span className="material-symbols-outlined text-[#e98a76] text-[28px]">check_circle</span>
              {f}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/owner/register"
            className="bg-[#e98a76] text-white px-10 py-4 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all"
          >
            List Your PG Free
          </Link>
          <Link
            to="/login"
            className="bg-transparent border border-[#c3c7c9] text-white px-10 py-4 rounded-2xl text-sm font-semibold hover:bg-white/10 transition-all"
          >
            Schedule Demo
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer id="contact" className="bg-[#e4e2e1] border-t border-[#E5E7EB] pt-16 pb-8">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12 pb-12 border-b border-[#E5E7EB]">

          <div className="col-span-2 md:col-span-1">
            <img src="/logo.png" alt="Nest Stay" className="h-20 w-auto mb-4" />
            <p className="text-sm text-[#434849] leading-relaxed mb-4">
              Your trusted platform for verified PGs and hostels near colleges.
            </p>
            <div className="flex gap-3">
              {['public', 'share', 'mail'].map(icon => (
                <a key={icon} href="#" className="w-9 h-9 rounded-full border border-[#c3c7c9] flex items-center justify-center hover:bg-black hover:text-white transition-all">
                  <span className="material-symbols-outlined text-[18px]">{icon}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#1b1c1c] mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {['Properties', 'PG Near You', 'Locations', 'Contact Us'].map(l => (
                <li key={l}><Link to="/login" className="text-sm text-[#434849] hover:text-black transition-colors block">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#1b1c1c] mb-4">For Owners</h4>
            <ul className="space-y-2">
              {['List Your Property', 'Partner With Us', 'Owner Login', 'Resources'].map(l => (
                <li key={l}><Link to="/login" className="text-sm text-[#434849] hover:text-black transition-colors block">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#1b1c1c] mb-4">Company</h4>
            <ul className="space-y-2">
              {['About Us', 'Careers', 'Blog', 'Press'].map(l => (
                <li key={l}><a href="#" className="text-sm text-[#434849] hover:text-black transition-colors block">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#1b1c1c] mb-4">Support</h4>
            <ul className="space-y-2">
              {['Help Center', 'Terms &amp; Conditions', 'Privacy Policy', 'Refund Policy'].map(l => (
                <li key={l}><a href="#" className="text-sm text-[#434849] hover:text-black transition-colors block" dangerouslySetInnerHTML={{ __html: l }} /></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#1b1c1c] mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-[#434849]">
                <span className="material-symbols-outlined text-[18px] text-[#73787a]">call</span>
                <a href="tel:+919970114079" className="hover:text-black transition-colors">+91 99701 14079</a>
              </li>
              <li className="flex items-center gap-2 text-sm text-[#434849]">
                <span className="material-symbols-outlined text-[18px] text-[#73787a]">mail</span>
                <a href="mailto:neststayco@gmail.com" className="hover:text-black transition-colors">neststayco@gmail.com</a>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#434849]">
                <span className="material-symbols-outlined text-[18px] text-[#73787a] mt-0.5">location_on</span>
                Pune, Maharashtra
              </li>
            </ul>
          </div>

        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#73787a]">© {new Date().getFullYear()} NestStay. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-[#73787a] hover:text-black transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-[#73787a] hover:text-black transition-colors">Terms of Service</a>
            <a href="#" className="text-xs text-[#73787a] hover:text-black transition-colors">Guest Guidelines</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── WhatsApp Floating Button ─────────────────────────────────────────────────

function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/919970114079"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white z-50 shadow-lg hover:scale-110 transition-transform"
      style={{ backgroundColor: '#25d366' }}
      aria-label="Chat on WhatsApp"
    >
      <span className="material-symbols-outlined text-[28px]">chat</span>
    </a>
  )
}
