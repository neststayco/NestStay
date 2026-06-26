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
      <div className="flex justify-between items-center w-full px-5 lg:px-16 max-w-[1280px] mx-auto h-14 lg:h-20">
        <Link to="/">
          <img src="/logo2.png" alt="Nest Stay" className="h-9 lg:h-14 w-auto" />
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
            className="hidden lg:inline-flex bg-[#e98a76] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
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
            className="lg:hidden text-black p-2 rounded-lg hover:bg-[#f0eded] transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-[22px]">{open ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#fbf9f8] border-t border-[#E5E7EB] px-5 py-3 shadow-lg">
          <a href="#home" className="block text-sm py-3 text-[#e98a76] font-bold border-b border-[#f3f0ef]" onClick={() => setOpen(false)}>Home</a>
          <a href="#listings" className="block text-sm py-3 text-[#434849] border-b border-[#f3f0ef]" onClick={() => setOpen(false)}>Properties</a>
          <a href="#colleges" className="block text-sm py-3 text-[#434849] border-b border-[#f3f0ef]" onClick={() => setOpen(false)}>PG Near You</a>
          <a href="#for-owners" className="block text-sm py-3 text-[#434849] border-b border-[#f3f0ef]" onClick={() => setOpen(false)}>For Property Owners</a>
          <a href="#about" className="block text-sm py-3 text-[#434849] border-b border-[#f3f0ef]" onClick={() => setOpen(false)}>About Us</a>
          <a href="#contact" className="block text-sm py-3 text-[#434849] border-b border-[#f3f0ef]" onClick={() => setOpen(false)}>Contact</a>
          <div className="pt-3 flex flex-col gap-2">
            <Link to="/register" className="block text-center bg-[#e98a76] text-white text-sm font-semibold py-3 rounded-xl" onClick={() => setOpen(false)}>Register</Link>
            <Link to="/owner/register" className="block text-center border border-[#c3c7c9] text-[#1b1c1c] text-sm font-semibold py-3 rounded-xl" onClick={() => setOpen(false)}>List Your Property</Link>
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
    if (area) params.set('area', area)
    if (b && parseInt(b) > 0) params.set('budget', b)
    if (gender) params.set('gender', gender)
    navigate(`/properties${params.toString() ? '?' + params.toString() : ''}`)
  }

  return (
    <section id="home" className="relative overflow-hidden h-[calc(100vh-3.5rem)] sm:h-auto">
      {/* Mobile background */}
      <div
        className="absolute inset-0 z-0 lg:hidden"
        style={{ backgroundImage: "url('/hero-section-mobile.jpg')", backgroundSize: 'cover', backgroundPosition: '65% center' }}
      />
      <div
        className="absolute inset-0 z-0 lg:hidden"
        style={{ background: 'linear-gradient(to bottom, rgba(251,249,248,0.95) 0%, rgba(251,249,248,0.88) 55%, rgba(251,249,248,0.55) 100%)' }}
      />
      {/* Desktop background */}
      <div
        className="absolute inset-0 z-0 hidden lg:block"
        style={{ backgroundImage: "url('/hero-section')", backgroundSize: 'cover', backgroundPosition: 'center right' }}
      />
      <div
        className="absolute inset-0 z-0 hidden lg:block"
        style={{ background: 'linear-gradient(to right, #fbf9f8 0%, #fbf9f8 45%, rgba(251,249,248,0.85) 65%, rgba(251,249,248,0.2) 100%)' }}
      />

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 lg:px-16 py-8 sm:py-10 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center h-full sm:h-auto">
        <div>
          {/* Badge — subtle gray on mobile (reference layout), orange pill on sm+ */}
          <div className="inline-flex items-center bg-gray-50 sm:bg-[#fef3f0] border border-gray-100 sm:border-[#f4c4b5] rounded-full px-3 py-1 mb-5">
            <div className="w-4 h-4 bg-[#e98a76] rounded-full flex items-center justify-center mr-2 flex-shrink-0 sm:hidden">
              <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="material-symbols-outlined text-[#c0431e] text-[12px] mr-1.5 hidden sm:inline" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span className="text-[10px] font-semibold text-gray-500 sm:font-bold sm:text-[#c0431e] uppercase tracking-widest sm:tracking-wide">Verified PG Platform in Pune</span>
          </div>

          {/* Headline */}
          <h1 className="text-[22px] sm:text-[34px] lg:text-[48px] font-extrabold text-[#1b1c1c] leading-[1.2] mb-2 sm:mb-6">
            Find Verified PGs{' '}
            <span className="text-[#e98a76]">Near Your College</span>
          </h1>

          <p className="text-sm lg:text-lg text-[#434849] mb-6 sm:mb-8 leading-relaxed">
            Verified listings. No brokers. Transparent pricing.
          </p>

          {/* Social proof — hidden on mobile to preserve viewport fit */}
          <div className="hidden sm:flex items-center gap-3 mb-7">
            <div className="flex">
              {[
                { initials: 'A', bg: '#8b5cf6', color: '#fff' },
                { initials: 'R', bg: '#ec4899', color: '#fff' },
                { initials: 'P', bg: '#06b6d4', color: '#fff' },
                { initials: 'S', bg: '#f97316', color: '#fff' },
              ].map(({ initials, bg, color }, i) => (
                <div
                  key={initials}
                  className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold ${i > 0 ? '-ml-2' : ''}`}
                  style={{ backgroundColor: bg, color }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <p className="text-sm text-[#1b1c1c]">
              <span className="font-semibold">Students across Pune</span> trust NestStay
            </p>
          </div>

          {/* Search form
              Mobile:  open underline fields, no card — [College] / [Area][Budget] / [Gender] / [CTA full-width]
              sm+:     white card, boxed fields — [College][Area] / [Budget][Gender] / [CTA + Talk to Expert] */}
          <form onSubmit={handleFindPG} className="sm:bg-white/90 sm:backdrop-blur-sm sm:rounded-2xl sm:p-6 sm:shadow-[0_8px_32px_rgba(0,0,0,0.10)] sm:border sm:border-[#E5E7EB]">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:gap-4 sm:mb-5">
              {/* College — full width on mobile (col-span-2), half on sm+ (col-span-1) */}
              <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                <label className="text-[10px] font-semibold text-[#73787a] uppercase tracking-wide ml-0.5">College / Workplace</label>
                <input
                  type="text"
                  value={college}
                  onChange={e => setCollege(e.target.value)}
                  placeholder="e.g. Symbiosis, Infosys"
                  className="border-b border-[#d1d5db] sm:border sm:border-[#d1d5db] rounded-none sm:rounded-xl py-2.5 sm:py-0 sm:h-[56px] px-0 sm:px-3 bg-transparent sm:bg-white sm:focus:bg-[#fffaf9] text-sm outline-none focus:border-[#e98a76] transition-colors w-full placeholder:text-gray-300"
                />
              </div>
              {/* Area — half width on both (mobile: row-2 left; sm+: row-1 right) */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[#73787a] uppercase tracking-wide ml-0.5">Area</label>
                <select
                  value={area}
                  onChange={e => setArea(e.target.value)}
                  className="border-b border-[#d1d5db] sm:border sm:border-[#d1d5db] rounded-none sm:rounded-xl py-2.5 sm:py-0 sm:h-[56px] pl-0 pr-4 sm:pl-3 sm:pr-8 bg-transparent sm:bg-white text-[#434849] text-sm outline-none focus:border-[#e98a76] appearance-none transition-colors"
                  style={{ backgroundImage: SELECT_ARROW, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 2px center' }}
                >
                  <option value="">Any Area</option>
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
              {/* Budget — half width on both (mobile: row-2 right; sm+: row-2 left) */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[#73787a] uppercase tracking-wide ml-0.5">Budget</label>
                <input
                  type="text"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder="e.g. ₹8,000"
                  className="border-b border-[#d1d5db] sm:border sm:border-[#d1d5db] rounded-none sm:rounded-xl py-2.5 sm:py-0 sm:h-[56px] px-0 sm:px-3 bg-transparent sm:bg-white sm:focus:bg-[#fffaf9] text-sm outline-none focus:border-[#e98a76] transition-colors w-full placeholder:text-gray-300"
                />
              </div>
              {/* Gender — full width on mobile (col-span-2), half on sm+ (col-span-1) */}
              <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                <label className="text-[10px] font-semibold text-[#73787a] uppercase tracking-wide ml-0.5">Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="border-b border-[#d1d5db] sm:border sm:border-[#d1d5db] rounded-none sm:rounded-xl py-2.5 sm:py-0 sm:h-[56px] pl-0 pr-4 sm:pl-3 sm:pr-8 bg-transparent sm:bg-white text-[#434849] text-sm outline-none focus:border-[#e98a76] appearance-none transition-colors"
                  style={{ backgroundImage: SELECT_ARROW, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 2px center' }}
                >
                  <option value="">Any Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            {/* Mobile: mt-6 standalone CTA. sm+: flex row with Talk to Expert */}
            <div className="mt-6 sm:mt-0 sm:flex sm:gap-2">
              <button
                type="submit"
                className="w-full sm:flex-1 bg-[#e98a76] text-white font-semibold py-4 sm:py-0 sm:h-[56px] rounded-lg sm:rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_4px_12px_rgba(233,138,118,0.35)]"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                Find PG
              </button>
              <a
                href="https://wa.me/919970114079"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center justify-center gap-2 px-4 h-[56px] border border-[#c3c7c9] rounded-xl bg-[#f9f8f7] text-[#1b1c1c] text-sm font-medium hover:bg-[#f0eded] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-[#434849]">support_agent</span>
                <span>Talk to Expert</span>
              </a>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

// ─── Trust Indicators ─────────────────────────────────────────────────────────

function TrustIndicators() {
  return (
    <section className="py-16 lg:py-20 bg-white border-y border-[#E5E7EB]">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-16">

        {/* Heading — left-aligned, two-line impact */}
        <div className="mb-8 lg:mb-10">
          <span className="text-[#e98a76] text-xs font-bold uppercase tracking-wider mb-3 block">Why Nest Stay</span>
          <h2 className="text-[28px] lg:text-[38px] font-extrabold text-[#1b1c1c] leading-[1.1] tracking-tight">
            No Brokers.<br />Only Verified PGs.
          </h2>
        </div>

        {/* Bento grid
            Mobile:  row1=[Card1 dark, col-span-2] / row2=[Card2][Card3] / row3=[Card4 wide, col-span-2]
            lg+:     4 equal columns */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">

          {/* Card 1 — dark hero, full width on mobile */}
          <div
            className="col-span-2 lg:col-span-1 bg-[#101e22] rounded-2xl p-6 flex flex-col gap-4"
            style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(233,138,118,0.15)' }}>
              <span className="material-symbols-outlined text-[#e98a76]" style={{ fontSize: '30px', fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <div>
              <p className="text-white text-[15px] font-bold mb-1.5">Verified Listings</p>
              <p className="text-[#8fa8b0] text-sm leading-relaxed">Every PG manually reviewed before it goes live.</p>
            </div>
          </div>

          {/* Card 2 — warm tint, half width on mobile */}
          <div className="bg-[#fff8f5] rounded-2xl p-5 flex flex-col gap-3 border border-[#f4c4b5]">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <span className="material-symbols-outlined text-[#e98a76]" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>currency_rupee</span>
            </div>
            <div>
              <p className="text-[#1b1c1c] text-sm font-bold leading-snug">Zero Brokerage</p>
              <p className="text-[#73787a] text-xs mt-1 leading-relaxed">Talk directly to owners</p>
            </div>
          </div>

          {/* Card 3 — cool gray, half width on mobile */}
          <div className="bg-[#f0f4f5] rounded-2xl p-5 flex flex-col gap-3">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <span className="material-symbols-outlined text-[#e98a76]" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>shield</span>
            </div>
            <div>
              <p className="text-[#1b1c1c] text-sm font-bold leading-snug">Safe & Transparent</p>
              <p className="text-[#73787a] text-xs mt-1 leading-relaxed">Verified owners, real photos</p>
            </div>
          </div>

          {/* Card 4 — accent border, full width horizontal on mobile, flex-col on lg */}
          <div className="col-span-2 lg:col-span-1 bg-white border-2 border-[#e98a76]/25 rounded-2xl p-5 flex flex-row items-center gap-4 lg:flex-col lg:items-start lg:gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#fef3f0] flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[#e98a76]" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>groups</span>
            </div>
            <div>
              <p className="text-[#1b1c1c] text-[15px] font-bold mb-1">Built For Students and Working Professionals</p>
              <p className="text-[#73787a] text-sm leading-relaxed">Near colleges &amp; workplaces across Pune</p>
            </div>
          </div>

        </div>

        {/* Trust stats strip — large primary + 2 supporting */}
        <div className="mt-10 pt-8 border-t border-[#E5E7EB] flex flex-col gap-3">

          {/* Primary stat */}
          <div
            className="bg-[#fbf9f8] rounded-2xl p-5 flex items-center gap-4"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#fef3f0] flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[#e98a76]" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <div>
              <p className="text-[44px] lg:text-[56px] font-extrabold text-[#1b1c1c] leading-none tracking-tight">75+</p>
              <p className="text-[11px] font-bold text-[#1b1c1c] uppercase tracking-wide mt-1">Verified Listings in Pune</p>
              <p className="text-xs text-[#73787a] mt-1 leading-relaxed">Helping students find trusted stays near colleges &amp; workplaces.</p>
            </div>
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#fff8f5] rounded-2xl p-4 border border-[#f4c4b5]">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-3" style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.07)' }}>
                <span className="material-symbols-outlined text-[#e98a76]" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>school</span>
              </div>
              <p className="text-[30px] font-extrabold text-[#1b1c1c] leading-none tracking-tight">300+</p>
              <p className="text-[10px] font-semibold text-[#73787a] uppercase tracking-wide mt-1.5">Student Inquiries</p>
            </div>
            <div className="bg-[#f0f4f5] rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-3" style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.07)' }}>
                <span className="material-symbols-outlined text-[#e98a76]" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>money_off</span>
              </div>
              <p className="text-[30px] font-extrabold text-[#1b1c1c] leading-none tracking-tight">₹0</p>
              <p className="text-[10px] font-semibold text-[#73787a] uppercase tracking-wide mt-1.5">Brokerage Fee</p>
            </div>
          </div>

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
  { name: 'Kharadi',       count: '80+', img: '/cities/kalyani-nagar.jpeg' },
  { name: 'Deccan',        count: '35+', img: '/cities/viman-nagar.jpeg' },
]

function PopularLocationsSection() {
  return (
    <section className="pt-14 pb-8 lg:py-20 bg-[#fbf9f8]">
      <div className="max-w-[1280px] mx-auto">

        {/* Header */}
        <div className="px-4 lg:px-16 mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-[#e98a76] text-[10px] font-bold uppercase tracking-wider block mb-1">Explore Pune</span>
              <h2 className="text-[22px] lg:text-[28px] font-extrabold text-[#1b1c1c]">Popular Areas</h2>
            </div>
            <Link to="/login" className="text-[#e98a76] text-sm font-semibold flex items-center gap-0.5 hover:underline self-start sm:flex-shrink-0">
              All Areas <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Scroll viewport — two-div pattern avoids Safari overflow-padding bug */}
        <div
          className="overflow-x-auto md:overflow-visible"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex gap-3 px-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:px-16 md:gap-4">
            {LOCATIONS.map(({ name, count, img }) => (
              <Link
                key={name}
                to="/login"
                className="flex-shrink-0 w-[78vw] md:w-auto snap-start relative rounded-2xl overflow-hidden group"
                style={{ aspectRatio: '4/3' }}
              >
                <img
                  src={img}
                  alt={name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="text-[15px] font-bold leading-tight">{name}</div>
                  <div className="text-[11px] font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.72)' }}>{count} Properties</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

// ─── Colleges Section ─────────────────────────────────────────────────────────

const COLLEGES = [
  { name: 'Symbiosis',         abbr: 'S', from: '#3b82f6', to: '#1e40af', logo: '/colleges/symbiosis.svg', count: '18' },
  { name: 'PCCOE',             abbr: 'P', from: '#ef4444', to: '#dc2626', logo: '/colleges/pccoe.jpeg',    count: '12' },
  { name: 'DY Patil',          abbr: 'D', from: '#8b5cf6', to: '#6d28d9', logo: '/colleges/dypatil.png',  count: '14' },
  { name: 'Fergusson College', abbr: 'F', from: '#14b8a6', to: '#0d9488', logo: '/colleges/fergusson.png', count: '10' },
  { name: 'COEP',              abbr: 'C', from: '#f59e0b', to: '#d97706', logo: '/colleges/coep.png',     count: '9'  },
  { name: 'AISSMS',            abbr: 'A', from: '#e98a76', to: '#c06a58', logo: '/colleges/aissms.png',   count: '7'  },
]

function CollegeLogo({ name, abbr, from, to, logo, size = 'w-11 h-11', rounded = 'rounded-xl', textSize = '16px' }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`${size} ${rounded} bg-white border-2 border-[#E5E7EB] flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0`}>
      {logo && !failed ? (
        <img
          src={logo}
          alt={`${name} logo`}
          loading="lazy"
          className="w-full h-full object-contain p-1.5"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-white font-bold"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})`, fontSize: textSize }}
        >
          {abbr}
        </div>
      )}
    </div>
  )
}

function CollegesSection() {
  return (
    <section id="colleges" className="py-14 lg:py-20 bg-white border-y border-[#E5E7EB]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-16">

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-[#73787a] text-[10px] font-bold uppercase tracking-wider block mb-1">Quick Search</span>
              <h2 className="text-[20px] lg:text-[24px] font-extrabold text-[#1b1c1c]">PGs Near Your College</h2>
            </div>
            <Link to="/login" className="text-[#e98a76] text-sm font-semibold flex items-center gap-0.5 hover:underline self-start sm:flex-shrink-0">
              View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Scroll viewport — negative margin breaks out of container px-4, inner div owns the padding */}
        <div
          className="overflow-x-auto -mx-4 md:mx-0 md:overflow-visible"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="flex gap-2.5 px-4 pb-2 snap-x snap-mandatory md:grid md:grid-cols-3 md:px-0 md:pb-0 md:gap-3">
            {COLLEGES.map(({ name, abbr, from, to, logo, count }) => (
              <Link
                key={name}
                to="/login"
                className="flex-shrink-0 snap-start min-w-[152px] md:w-auto bg-white border border-[#E5E7EB] rounded-xl p-3 transition-all duration-200 hover:border-[#e98a76] hover:shadow-sm flex items-center gap-3"
              >
                <CollegeLogo name={name} abbr={abbr} from={from} to={to} logo={logo} size="w-10 h-10" rounded="rounded-xl" textSize="13px" />
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-[#1b1c1c] leading-tight truncate">{name}</p>
                  <p className="text-[10px] text-[#73787a] mt-0.5">{count} PGs Nearby</p>
                </div>
              </Link>
            ))}
          </div>
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
    <section id="listings" className="py-16 lg:py-20">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <span className="text-[#e98a76] text-xs font-bold uppercase tracking-wider mb-1 block">Featured</span>
            <h2 className="text-[22px] lg:text-[28px] font-bold text-[#1b1c1c]">Featured Properties</h2>
          </div>
          <Link to="/login" className="text-[#e98a76] text-sm font-semibold flex items-center gap-1 hover:underline flex-shrink-0">
            See All <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </Link>
        </div>

        {/* Desktop grid */}
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

        {/* Mobile: full-width single card snap scroll */}
        {loading ? (
          <div
            className="flex md:hidden gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory animate-pulse"
            style={{ scrollbarWidth: 'none' }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[88vw] snap-start bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
                <SkeletonBase className="w-full h-48 rounded-none" />
                <div className="p-4 space-y-3">
                  <SkeletonBase className="h-5 w-2/3" />
                  <SkeletonBase className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex md:hidden gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none' }}
          >
            {pgs.map(pg => (
              <div key={pg._id} className="flex-shrink-0 w-[88vw] snap-start">
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
  const location = [area, city].filter(Boolean).join(', ') || 'Pune'
  const rent = pg.pricing?.rent

  return (
    <div
      className="card-lift bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden h-full flex flex-col group"
      style={{ boxShadow: 'rgba(0,0,0,0.05) 0px 2px 8px, rgba(0,0,0,0.02) 0px 0px 1px' }}
    >
      <div className="relative h-48 overflow-hidden bg-[#f6f3f2] flex items-center justify-center flex-shrink-0">
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
        <div className="flex items-center gap-1 text-[#73787a] text-xs mb-3">
          <span className="material-symbols-outlined text-[#9ca3af]" style={{ fontSize: '13px' }}>location_on</span>
          {location}
        </div>
        <div className="mt-auto">
          <div className="text-[20px] font-bold text-[#1b1c1c] tracking-tight mb-3">
            {rent ? <>&#8377;{rent.toLocaleString('en-IN')}<span className="text-xs font-normal text-[#9ca3af] ml-1">/mo</span></> : 'Contact for price'}
          </div>
          <Link
            to="/login"
            className="block w-full py-2.5 bg-[#e98a76] text-white rounded-[10px] text-sm font-semibold text-center hover:opacity-90 active:scale-[0.97] transition-all"
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
      <style>{`
        @keyframes vp-float-a{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes vp-float-b{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes vp-float-c{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes vp-fade-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .vp-float-a{animation:vp-float-a 4s ease-in-out infinite}
        .vp-float-b{animation:vp-float-b 5s ease-in-out infinite .8s}
        .vp-float-c{animation:vp-float-c 3.5s ease-in-out infinite 1.5s}
        .vp-fade-line{opacity:0;animation:vp-fade-up .65s ease forwards}
      `}</style>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

        {/* LEFT — premium floating composition */}
        <div className="order-2 lg:order-1 w-full relative h-[360px] lg:h-[420px]">

          {/* Soft radial glow behind center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
            <div style={{
              width: '280px', height: '280px',
              background: 'radial-gradient(circle, rgba(233,138,118,0.18) 0%, rgba(233,138,118,0.05) 50%, transparent 70%)',
              borderRadius: '50%',
            }} />
          </div>

          {/* Orbital decorative rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 2 }}>
            <svg width="340" height="340" viewBox="0 0 340 340" fill="none">
              <circle cx="170" cy="170" r="124" stroke="#e98a76" strokeWidth="0.8" strokeDasharray="3 9" opacity="0.14" />
              <circle cx="170" cy="170" r="158" stroke="#e98a76" strokeWidth="0.5" strokeDasharray="2 12" opacity="0.07" />
            </svg>
          </div>

          {/* Main center image — outer handles centering, inner handles float */}
          <div className="absolute" style={{ zIndex: 10, width: '60%', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
            <div className="vp-float-a" style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07)', position: 'relative' }}>
              <img src="/student-section.png" alt="Students using Nest Stay" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(16,30,34,0.18) 0%, transparent 55%)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Floating card — Top Left */}
          <div className="absolute vp-float-b" style={{ zIndex: 20, top: '5%', left: '1%' }}>
            <div style={{ background: 'rgba(20,36,43,0.96)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '14px', padding: '10px', width: '138px', boxShadow: '0 8px 28px rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)' }}>
              <div style={{ width: '100%', height: '56px', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px', background: '#0d1f24' }}>
                <img src="/cities/baner.jpeg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
              </div>
              <p style={{ color: '#fff', fontSize: '11px', fontWeight: 600, lineHeight: 1.3 }}>Green Nest Girls PG</p>
              <p style={{ color: '#73787a', fontSize: '10px', marginTop: '2px' }}>Baner, Pune</p>
              <p style={{ color: '#e98a76', fontSize: '11px', fontWeight: 700, marginTop: '5px' }}>₹8,500<span style={{ color: '#73787a', fontWeight: 400 }}>/mo</span></p>
            </div>
          </div>

          {/* Floating card — Bottom Right */}
          <div className="absolute vp-float-c" style={{ zIndex: 20, bottom: '5%', right: '1%' }}>
            <div style={{ background: 'rgba(20,36,43,0.96)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '14px', padding: '10px', width: '138px', boxShadow: '0 8px 28px rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)' }}>
              <div style={{ width: '100%', height: '56px', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px', background: '#0d1f24' }}>
                <img src="/cities/hinjewadi.jpeg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
              </div>
              <p style={{ color: '#fff', fontSize: '11px', fontWeight: 600, lineHeight: 1.3 }}>Urban Stay Co-Living</p>
              <p style={{ color: '#73787a', fontSize: '10px', marginTop: '2px' }}>Hinjewadi, Pune</p>
              <p style={{ color: '#e98a76', fontSize: '11px', fontWeight: 700, marginTop: '5px' }}>₹7,200<span style={{ color: '#73787a', fontWeight: 400 }}>/mo</span></p>
            </div>
          </div>

          {/* Floating chip — Top Right */}
          <div className="absolute vp-float-a" style={{ zIndex: 20, top: '10%', right: '3%', animationDelay: '2s' }}>
            <div style={{ background: 'rgba(20,36,43,0.96)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '12px', padding: '10px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                <span style={{ fontSize: '10px', color: '#bac9ce', fontWeight: 500 }}>Admission Approved</span>
              </div>
              <p style={{ color: '#fff', fontSize: '11px', fontWeight: 600 }}>Priya S. ✓</p>
              <p style={{ color: '#73787a', fontSize: '10px', marginTop: '2px' }}>Sunrise Boys PG</p>
            </div>
          </div>

          {/* Floating chip — Bottom Left */}
          <div className="absolute vp-float-b" style={{ zIndex: 20, bottom: '10%', left: '3%', animationDelay: '1.2s' }}>
            <div style={{ background: 'rgba(20,36,43,0.96)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '12px', padding: '10px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {'★★★★★'.split('').map((s, i) => <span key={i} style={{ color: '#e98a76', fontSize: '12px' }}>{s}</span>)}
              </div>
              <p style={{ color: '#fff', fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>4.9 Rating</p>
              <p style={{ color: '#73787a', fontSize: '10px', marginTop: '2px' }}>120+ Residents</p>
            </div>
          </div>

        </div>

        {/* RIGHT — content */}
        <div className="order-1 lg:order-2">
          <span className="text-[#ffdbd0] text-xs font-bold tracking-widest uppercase mb-3 block">
            Built for Students and Working Professionals in Pune
          </span>

          {/* Upgraded headline */}
          <div className="mb-6">
            <div className="vp-fade-line" style={{ animationDelay: '0.1s' }}>
              <span style={{ display: 'block', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, color: '#ffffff', lineHeight: 1.1, letterSpacing: '-0.02em' }}>NO BROKER.</span>
              <svg width="160" height="6" viewBox="0 0 160 6" fill="none" style={{ display: 'block', marginTop: '4px', marginBottom: '8px' }}>
                <path d="M2 4 Q40 1 80 3 Q120 5 158 2" stroke="#e98a76" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </svg>
            </div>

            <div className="vp-fade-line" style={{ animationDelay: '0.25s' }}>
              <span style={{ display: 'block', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, color: '#ffffff', lineHeight: 1.1, letterSpacing: '-0.02em' }}>NO SURPRISES.</span>
              <svg width="215" height="6" viewBox="0 0 215 6" fill="none" style={{ display: 'block', marginTop: '4px', marginBottom: '8px' }}>
                <path d="M2 4 Q53 1 107 3 Q161 5 213 2" stroke="#e98a76" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </svg>
            </div>

            <div className="vp-fade-line" style={{ animationDelay: '0.4s' }}>
              <span style={{ display: 'block', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, background: 'linear-gradient(135deg, #e98a76 0%, #ffb8a0 80%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1, letterSpacing: '-0.02em' }}>JUST PGs.</span>
              <svg width="128" height="8" viewBox="0 0 128 8" fill="none" style={{ display: 'block', marginTop: '4px' }}>
                <path d="M2 5.5 Q32 2 64 4.5 Q96 7 126 4" stroke="#e98a76" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
            </div>
          </div>

          <ul className="space-y-4">
            {[
              { icon: 'verified', title: 'Reviewed Before Listing', desc: 'Checked before going live. No ghost listings.' },
              { icon: 'shield',   title: 'Owner Identity Verified',  desc: "You know who you're dealing with before you visit." },
              { icon: 'bolt',     title: 'Apply Without Calling',    desc: 'Submit online. Owner reviews and responds.' },
              { icon: 'payments', title: 'No Hidden Charges',        desc: 'Rent, deposit and maintenance shown upfront.' },
            ].map(({ icon, title, desc }) => (
              <li key={title} className="flex gap-3">
                <span className="material-symbols-outlined text-[#e98a76] text-[20px] flex-shrink-0 mt-0.5">{icon}</span>
                <span className="text-sm text-[#bac9ce] leading-relaxed">
                  <strong className="text-white font-semibold">{title}:</strong> {desc}
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
  { n: '1', title: 'Search',  desc: 'Browse verified PGs near your college or work' },
  { n: '2', title: 'Compare', desc: 'See rent, amenities and distance at a glance'  },
  { n: '3', title: 'Apply',   desc: 'Submit online. Owner reviews and responds.'    },
  { n: '4', title: 'Move In', desc: 'Owner approves. You move in. Done.'            },
]

function HowItWorksSection() {
  return (
    <section className="py-16 lg:py-20 bg-[#f6f3f2] border-y border-[#E5E7EB]">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-16">
        <h2 className="text-[22px] lg:text-[28px] font-bold text-[#1b1c1c] text-center mb-10">How NestStay Works</h2>
        <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          <div
            className="absolute top-5 left-[12.5%] right-[12.5%] h-px hidden lg:block"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, #d1d5db 0, #d1d5db 8px, transparent 8px, transparent 16px)' }}
          />
          {STEPS.map(({ n, title, desc }) => (
            <div
              key={n}
              className="bg-white border border-[#E5E7EB] rounded-xl p-5 lg:p-6 text-center relative z-10"
            >
              <div className="w-10 h-10 bg-[#e98a76] text-white rounded-full flex items-center justify-center font-bold text-base mx-auto mb-3">
                {n}
              </div>
              <div className="text-sm font-semibold text-[#1b1c1c] mb-1">{title}</div>
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
    content: 'Found a PG in Hinjewadi within 2 days. No broker calls, no surprise charges.',
    createdBy: { name: 'Rohit Sharma' },
    pgSnapshot: { name: 'MIT-WPU' },
  },
  {
    _id: 'f2',
    rating: 5,
    content: 'All photos matched what I saw in person. Picked my PG without visiting three places first.',
    createdBy: { name: 'Ananya Verma' },
    pgSnapshot: { name: 'Symbiosis' },
  },
  {
    _id: 'f3',
    rating: 5,
    content: 'Raised a noise complaint through the app. Owner responded the same day.',
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
    <section id="reviews" className="py-16 lg:py-20">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-16">
        <div className="text-center mb-10">
          <span className="text-[#e98a76] text-xs font-bold uppercase tracking-wider mb-2 block">What Residents Say</span>
          <h2 className="text-[22px] lg:text-[28px] font-bold text-[#1b1c1c]">What Students Say</h2>
        </div>

        {loading ? (
          <div
            className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0 md:mx-0 md:px-0 animate-pulse"
            style={{ scrollbarWidth: 'none' }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[88vw] md:w-auto snap-start bg-white p-5 rounded-2xl border border-[#E5E7EB] space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => <SkeletonBase key={j} className="w-4 h-4 rounded" />)}
                </div>
                <div className="space-y-2">
                  <SkeletonBase className="h-3 rounded w-full" />
                  <SkeletonBase className="h-3 rounded w-5/6" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <SkeletonBase className="w-10 h-10 rounded-full" />
                  <div className="space-y-1.5">
                    <SkeletonBase className="h-3 rounded w-24" />
                    <SkeletonBase className="h-2.5 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0 md:mx-0 md:px-0"
            style={{ scrollbarWidth: 'none' }}
          >
            {testimonials.map((t, idx) => {
              const name = t.createdBy?.name || 'Resident'
              const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
              const [avatarBg, avatarText] = AVATAR_COLORS[idx % AVATAR_COLORS.length]
              return (
                <div key={t._id} className="flex-shrink-0 w-[88vw] md:w-auto snap-start bg-white p-5 rounded-2xl border border-[#E5E7EB]">
                  <div className="flex gap-0.5 text-[#e98a76] mb-3">
                    {[...Array(t.rating)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                  </div>
                  <p className="text-sm text-[#434849] leading-relaxed italic mb-4">"{t.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${avatarBg} ${avatarText}`}>
                      {initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#1b1c1c]">{name}</div>
                      {t.pgSnapshot?.name && <div className="text-xs text-[#73787a]">{t.pgSnapshot.name}</div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Owner Section ────────────────────────────────────────────────────────────

function OwnerSection() {
  return (
    <section id="for-owners" className="py-16 lg:py-20 bg-[#101e22] text-white">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-16 text-center">
        <h2 className="text-[26px] lg:text-[40px] font-bold mb-4 leading-tight">
          Own a PG?<br />
          <span className="text-[#e98a76]">Fill Your Rooms Faster with NestStay</span>
        </h2>
        <p className="text-[#bac9ce] text-sm lg:text-lg mb-8 max-w-xl mx-auto">
          List once, manage from one dashboard. Admissions, complaints, residents and photos.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl mx-auto mb-8">
          {['One-click admissions', 'Photo management', 'Complaint tracking', 'Occupancy overview'].map(f => (
            <div key={f} className="flex flex-col items-center gap-2 text-xs text-[#bac9ce]">
              <span className="material-symbols-outlined text-[#e98a76] text-[24px]">check_circle</span>
              {f}
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/owner/register"
            className="bg-[#e98a76] text-white px-8 py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
          >
            List Your PG Free
          </Link>
          <Link
            to="/login"
            className="border border-[#c3c7c9] text-white px-8 py-3.5 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all"
          >
            See How It Works
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function FooterAccordion({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#d4d0ce]">
      <button
        className="w-full flex justify-between items-center py-4 text-sm font-bold text-[#1b1c1c]"
        onClick={() => setOpen(o => !o)}
      >
        {title}
        <span className="material-symbols-outlined text-[18px] text-[#73787a] transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </button>
      {open && <div className="pb-4 space-y-2">{children}</div>}
    </div>
  )
}

function Footer() {
  return (
    <footer id="contact" className="bg-[#e4e2e1] border-t border-[#E5E7EB] pt-10 pb-8">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-16">

        {/* Brand block — always visible */}
        <div className="mb-8">
          <img src="/logo2.png" alt="Nest Stay" className="h-14 lg:h-20 w-auto mb-3" />
          <p className="text-sm text-[#434849] mb-4 max-w-xs">
            Find PGs near your college, without the broker.
          </p>
          <div className="flex gap-3">
            {['public', 'share', 'mail'].map(icon => (
              <a key={icon} href="#" className="w-9 h-9 rounded-full border border-[#c3c7c9] flex items-center justify-center hover:bg-black hover:text-white transition-all">
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Contact — always visible on mobile */}
        <div className="mb-6 flex flex-col gap-2 lg:hidden">
          <a href="tel:+919970114079" className="flex items-center gap-2 text-sm text-[#434849]">
            <span className="material-symbols-outlined text-[16px] text-[#73787a]">call</span>
            +91 99701 14079
          </a>
          <a href="mailto:neststayco@gmail.com" className="flex items-center gap-2 text-sm text-[#434849]">
            <span className="material-symbols-outlined text-[16px] text-[#73787a]">mail</span>
            neststayco@gmail.com
          </a>
        </div>

        {/* Accordion links — mobile only */}
        <div className="lg:hidden mb-6">
          <FooterAccordion title="Quick Links">
            {['Properties', 'PG Near You', 'Locations', 'Contact Us'].map(l => (
              <Link key={l} to="/login" className="block text-sm text-[#434849] py-1">{l}</Link>
            ))}
          </FooterAccordion>
          <FooterAccordion title="For Owners">
            {['List Your Property', 'Partner With Us', 'Owner Login'].map(l => (
              <Link key={l} to="/login" className="block text-sm text-[#434849] py-1">{l}</Link>
            ))}
          </FooterAccordion>
          <FooterAccordion title="Support">
            {['Help Center', 'Privacy Policy', 'Terms of Service'].map(l => (
              <a key={l} href="#" className="block text-sm text-[#434849] py-1">{l}</a>
            ))}
          </FooterAccordion>
        </div>

        {/* Desktop multi-column — hidden on mobile */}
        <div className="hidden lg:grid lg:grid-cols-5 gap-8 mb-12 pb-12 border-b border-[#E5E7EB]">
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
              {['Help Center', 'Terms of Service', 'Privacy Policy', 'Refund Policy'].map(l => (
                <li key={l}><a href="#" className="text-sm text-[#434849] hover:text-black transition-colors block">{l}</a></li>
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

        <div className="border-t border-[#d4d0ce] pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-[#73787a]">© {new Date().getFullYear()} NestStay. All rights reserved.</p>
          <div className="flex gap-5">
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
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white z-50 shadow-lg hover:scale-110 transition-transform"
      style={{ backgroundColor: '#25d366' }}
      aria-label="Chat on WhatsApp"
    >
      <span className="material-symbols-outlined text-[24px] sm:text-[28px]">chat</span>
    </a>
  )
}
