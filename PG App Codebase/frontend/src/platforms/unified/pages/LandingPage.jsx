import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'
import { resolveUserHomeRoute } from '@shared/utils/routing'
import { getPGList } from '@shared/api/pgs'
import { getFeaturedTestimonials } from '@shared/api/testimonials'

export default function LandingPage() {
  const { user } = useAuth()
  return (
    <div className="bg-[#fbf9f8] text-[#1b1c1c] overflow-x-hidden">
      <Navbar user={user} />
      <main className="pt-20">
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

function Navbar({ user }) {
  const [open, setOpen] = useState(false)

  function dashboardPath() {
    if (!user) return '/login'
    return resolveUserHomeRoute(user.role)
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-[#E5E7EB]"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(251,249,248,0.85)' }}
    >
      <div className="flex justify-between items-center w-full px-6 lg:px-16 max-w-[1280px] mx-auto h-20">
        <Link to="/">
          <img src="/logo.png" alt="Nest Stay" className="h-14 w-auto" />
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          <a href="#home" className="text-sm font-bold text-[#e98a76] border-b-2 border-[#e98a76] pb-1">Home</a>
          <a href="#listings" className="text-sm font-medium text-[#434849] hover:text-black transition-colors">Properties</a>
          <a href="#colleges" className="text-sm font-medium text-[#434849] hover:text-black transition-colors">PG Near Colleges</a>
          <a href="#for-owners" className="text-sm font-medium text-[#434849] hover:text-black transition-colors">For Property Owners</a>
          <a href="#about" className="text-sm font-medium text-[#434849] hover:text-black transition-colors">About Us</a>
          <a href="#contact" className="text-sm font-medium text-[#434849] hover:text-black transition-colors">Contact</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={dashboardPath()}
            className="hidden md:block px-5 py-2.5 rounded-xl border border-[#73787a] text-black text-sm font-semibold hover:bg-[#f0eded] transition-all"
          >
            {user ? 'Open App' : 'Login'}
          </Link>
          <Link
            to="/register"
            className="bg-[#e98a76] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
          >
            Register
          </Link>
          <Link
            to="/register"
            className="hidden xl:block bg-[#101e22] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
          >
            List Your Property
          </Link>
          <button
            className="lg:hidden text-black p-2 rounded-lg hover:bg-[#f0eded] transition-colors"
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
          <a href="#colleges" className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>PG Near Colleges</a>
          <a href="#for-owners" className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>For Property Owners</a>
          <a href="#about" className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>About Us</a>
          <a href="#contact" className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>Contact</a>
          <div className="pt-3 border-t border-[#E5E7EB] space-y-1">
            <Link to={dashboardPath()} className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>
              {user ? 'Open App' : 'Login'}
            </Link>
            <Link to="/register" className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>Register</Link>
            <Link to="/register" className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>List Your Property</Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section id="home" className="relative bg-[#fbf9f8] py-12 lg:py-20">
      <div className="w-full max-w-[1280px] mx-auto px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        <div className="z-10">
          <span className="inline-block bg-tertiary-fixed text-on-tertiary-fixed-variant px-4 py-1.5 rounded-full text-xs font-bold tracking-wider mb-6">
            Trusted by 3000+ Students Across Pune
          </span>
          <h1 className="text-[40px] lg:text-[48px] font-extrabold text-[#1b1c1c] leading-tight mb-4">
            Find Verified PGs &amp; Hostels<br />
            <span className="text-[#e98a76]">Near Your College</span>
          </h1>
          <p className="text-lg text-[#434849] mb-8 leading-relaxed">
            Safe, Affordable &amp; Fully Verified Student Accommodation.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <input
              type="text"
              placeholder="Search by College"
              className="h-[52px] px-4 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#e98a76] bg-white"
            />
            <select className="h-[52px] px-4 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#e98a76] bg-white text-[#434849]">
              <option>Select Area</option>
              <option>Hinjewadi</option>
              <option>Baner</option>
              <option>Kharadi</option>
              <option>Wakad</option>
              <option>Kalyani Nagar</option>
              <option>Viman Nagar</option>
              <option>Pimpri-Chinchwad</option>
              <option>Hadapsar</option>
            </select>
            <input
              type="text"
              placeholder="Budget (e.g. ₹8,000/mo)"
              className="h-[52px] px-4 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#e98a76] bg-white"
            />
            <select className="h-[52px] px-4 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#e98a76] bg-white text-[#434849]">
              <option>Boys / Girls</option>
              <option>Boys</option>
              <option>Girls</option>
              <option>Any</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            <Link
              to="/login"
              className="flex items-center gap-2 bg-[#e98a76] text-white px-8 h-[52px] rounded-xl text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              Find PG
            </Link>
            <a
              href="https://wa.me/919970114079"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 h-[52px] border border-[#E5E7EB] rounded-xl bg-white text-[#1b1c1c] text-sm font-semibold hover:bg-[#f3f4f6] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ color: '#25d366' }}>chat</span>
              Talk to Expert
            </a>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex">
              {[
                { initials: 'A', bg: '#8b5cf6' },
                { initials: 'R', bg: '#ec4899' },
                { initials: 'P', bg: '#06b6d4' },
              ].map(({ initials, bg }, i) => (
                <div
                  key={initials}
                  className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium ${i > 0 ? '-ml-2' : ''}`}
                  style={{ backgroundColor: bg }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <div className="text-sm text-[#1b1c1c]">
              <span className="font-semibold">3000+ Students</span><br />
              Already Found Their Home
            </div>
          </div>
        </div>

        <div className="relative hidden lg:block" style={{ paddingBottom: '64px' }}>
          <div className="rounded-2xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1760072513376-67a46aab0fd1?w=600&h=340&fit=crop&q=80&auto=format"
              alt="Modern PG accommodation"
              className="w-full aspect-video object-cover"
            />
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2 w-[90%] bg-white rounded-2xl px-6 py-4 shadow-card border border-[#E5E7EB] grid grid-cols-4 gap-4 text-center z-10"
            style={{ bottom: '0' }}
          >
            {[
              { value: '✓', label: 'Verified Properties' },
              { value: '₹0', label: 'Zero Brokerage' },
              { value: '24/7', label: 'Support' },
              { value: '📄', label: 'Digital Agreement' },
            ].map(({ value, label }) => (
              <div key={label} className="text-xs text-[#73787a]">
                <strong className="block text-base font-semibold text-[#e98a76] mb-1">{value}</strong>
                {label}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

// ─── Trust Indicators ─────────────────────────────────────────────────────────

function TrustIndicators() {
  return (
    <section className="py-10 bg-[#f6f3f2] border-y border-[#E5E7EB]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          {[
            { value: '500+',  label: 'Verified Properties' },
            { value: '3000+', label: 'Students Placed'     },
            { value: '₹0',    label: 'Zero Brokerage'      },
            { value: '24×7',  label: 'Support'             },
            { value: '100%',  label: 'Safe &amp; Secure'   },
          ].map(({ value, label }) => (
            <div key={label} className="text-sm text-[#73787a]">
              <strong className="block text-xl font-bold text-[#1b1c1c] mb-1" dangerouslySetInnerHTML={{ __html: value }} />
              <span dangerouslySetInnerHTML={{ __html: label }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Popular Locations ────────────────────────────────────────────────────────

const LOCATIONS = [
  { name: 'Hinjewadi',     count: '80+', img: '/cities/city1.jpeg' },
  { name: 'Baner',         count: '60+', img: '/cities/city2.jpeg' },
  { name: 'Kharadi',       count: '55+', img: '/cities/city3.jpeg' },
  { name: 'Wakad',         count: '45+', img: '/cities/city4.jpeg' },
  { name: 'Kalyani Nagar', count: '40+', img: '/cities/city5.jpeg' },
  { name: 'Viman Nagar',   count: '35+', img: '/cities/city6.jpeg' },
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
            Find Accommodation Near Your College
          </h2>
          <Link to="/login" className="text-[#e98a76] text-sm font-semibold flex items-center gap-1 hover:underline flex-shrink-0">
            View All Colleges <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {COLLEGES.map(({ name, abbr, from, to, logo, count }) => (
            <Link
              key={name}
              to="/login"
              className="bg-white border border-[#E5E7EB] rounded-xl py-5 px-3 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[#e98a76] cursor-pointer"
            >
              <CollegeLogo name={name} abbr={abbr} from={from} to={to} logo={logo} />
              <p className="text-sm font-semibold text-[#1b1c1c] mb-1">{name}</p>
              <p className="text-xs text-[#6B7280]">{count} Properties</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Featured Properties ──────────────────────────────────────────────────────

function PGCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden animate-pulse">
      <div className="h-52 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3 mt-4" />
      </div>
    </div>
  )
}

function FeaturedPGsSection() {
  const [pgs, setPgs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPGList({ sortBy: 'trustScore', limit: 3 })
      .then(res => setPgs(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="listings" className="py-12 lg:py-20">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="text-[#e98a76] text-xs font-bold uppercase tracking-wider mb-2 block">Featured</span>
            <h2 className="text-[28px] font-bold text-[#1b1c1c]">Featured Properties</h2>
          </div>
          <Link to="/login" className="text-[#e98a76] text-sm font-semibold flex items-center gap-1 hover:underline flex-shrink-0">
            See All <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <PGCardSkeleton key={i} />)
            : pgs.length > 0
              ? pgs.map(pg => <FeaturedPGCard key={pg._id} pg={pg} />)
              : null}
        </div>
      </div>
    </section>
  )
}

const PG_PLACEHOLDER = 'https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image'

function FeaturedPGCard({ pg }) {
  const image = pg.images?.[0] || PG_PLACEHOLDER
  const area = pg.location?.area
  const city = pg.location?.city
  const location = [area, city].filter(Boolean).join(', ') || '—'
  const rent = pg.pricing?.rent

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden group hover:shadow-card transition-all duration-300">
      <div className="relative h-52 overflow-hidden bg-[#dbeafe] flex items-center justify-center">
        <img
          src={image}
          alt={pg.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.target.src = PG_PLACEHOLDER }}
        />
        <span className="absolute top-3 left-3 bg-[#e98a76] text-white px-3 py-1 rounded-md text-xs font-semibold">
          VERIFIED
        </span>
        {pg.meta?.trustScore > 0 && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
            <span
              className="material-symbols-outlined text-[#e98a76] text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >star</span>
            <span className="text-xs font-bold text-[#1b1c1c]">{pg.meta.trustScore}</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-base font-semibold text-[#1b1c1c] mb-1">{pg.name}</h3>
        <div className="flex items-center gap-1 text-[#73787a] text-sm mb-3">
          <span className="material-symbols-outlined text-[16px]">location_on</span>
          {location}
        </div>
        <div className="text-xl font-bold text-[#e98a76] mb-4">
          {rent ? <>&#8377;{rent.toLocaleString('en-IN')}<span className="text-sm font-normal text-[#73787a]">/month</span></> : '—'}
        </div>
        <div className="flex gap-2">
          <Link
            to={`/user/pgs/${pg._id}`}
            className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm font-semibold text-[#1b1c1c] text-center hover:bg-[#f3f4f6] transition-colors"
          >
            View Details
          </Link>
          <Link
            to={`/user/pgs/${pg._id}/apply`}
            className="flex-1 px-4 py-2.5 bg-[#e98a76] text-white rounded-lg text-sm font-semibold text-center hover:opacity-90 transition-all"
          >
            Book Visit
          </Link>
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
  { n: '1', title: 'Search',        desc: 'Browse verified properties near your college or workplace' },
  { n: '2', title: 'Compare',       desc: 'Compare prices, amenities and locations side by side'      },
  { n: '3', title: 'Schedule Visit', desc: 'Book a property visit at your preferred date and time'    },
  { n: '4', title: 'Move In',       desc: 'Complete documentation digitally and move in hassle-free'  },
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-[#E5E7EB] animate-pulse space-y-4">
                  <div className="flex gap-1">{[...Array(5)].map((_, j) => <div key={j} className="w-4 h-4 bg-gray-200 rounded" />)}</div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-11 h-11 bg-gray-200 rounded-full" />
                    <div className="space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded w-24" />
                      <div className="h-2.5 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                </div>
              ))
            : testimonials.length > 0
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
            to="/register"
            className="bg-[#e98a76] text-white px-10 py-4 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all"
          >
            Partner With Us
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
            <img src="/logo2.png" alt="Nest Stay" className="h-20 w-auto mb-4" />
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
              {['Properties', 'PG Near Colleges', 'Locations', 'Contact Us'].map(l => (
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
