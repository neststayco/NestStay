

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// ─── Constants ────────────────────────────────────────────────────────────────

const PHONE = '+91 99701 14079'
const EMAIL = 'neststayco@gmail.com'

const NAV_ITEMS = [
  {
    label: 'PG Rooms',
    items: ['Boys PG', 'Girls PG', 'Co-ed PG', 'Premium PG'],
  },
  {
    label: 'Coliving',
    items: ['Managed Studio', 'Shared Rooms', '1 BHK Apartment', 'Fully Furnished'],
  },
  {
    label: 'Virtual Tours',
    items: ['3D Walkthrough', 'Video Tour', 'Schedule a Visit'],
  },
  {
    label: 'Packages',
    items: ['Monthly Plan', 'Quarterly Plan', 'Annual Plan', 'Student Offer'],
  },
]

const LOOKING_FOR_OPTIONS = [
  'PG Room',
  'Coliving Studio',
  'Shared Apartment',
  'Private Room',
  'Managed Flat',
]

// 18 Pune localities — 6 columns × 3 rows
const PUNE_LOCALITIES = [
  { name: 'Hinjewadi',      icon: 'tower'      },
  { name: 'Baner',          icon: 'block'       },
  { name: 'Kharadi',        icon: 'tower'       },
  { name: 'Wakad',          icon: 'home'        },
  { name: 'Viman Nagar',    icon: 'campus'      },
  { name: 'Koregaon Park',  icon: 'commercial'  },
  { name: 'Magarpatta',     icon: 'campus'      },
  { name: 'Hadapsar',       icon: 'block'       },
  { name: 'Aundh',          icon: 'home'        },
  { name: 'Pimpri',         icon: 'tower'       },
  { name: 'Chinchwad',      icon: 'commercial'  },
  { name: 'Shivajinagar',   icon: 'campus'      },
  { name: 'Kalyani Nagar',  icon: 'commercial'  },
  { name: 'Nigdi',          icon: 'block'       },
  { name: 'Camp',           icon: 'commercial'  },
  { name: 'Swargate',       icon: 'home'        },
  { name: 'Katraj',         icon: 'block'       },
  { name: 'Deccan',         icon: 'campus'      },
]

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function CofyndNavbar({ user }) {
  const [openItem, setOpenItem] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenItem(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function roleHome(role) {
    if (role === 'admin') return '/admin'
    if (role === 'pg_owner') return '/pgowner'
    return '/user'
  }

  return (
    <nav
      ref={navRef}
      // DESIGN.md: "navbar uses Structural Secondary background with white typography"
      className="bg-charcoal-deep sticky top-0 z-50"
    >
      <div className="max-w-[1280px] mx-auto px-6 h-[72px] flex items-center gap-4 lg:gap-6">

        {/* ── Logo ────────────────────────────────────────────── */}
        <NavLogo />

        {/* ── Center contact pill (desktop only) ─────────────── */}
        {/* DESIGN.md: pill-shaped chips use rounded-full, border in Structural Secondary */}
        <div className="hidden lg:flex items-center gap-4 border border-white/15 rounded-full px-5 py-2.5 mx-auto flex-shrink-0">
          <a
            href={`tel:${PHONE.replace(/\s/g, '')}`}
            className="flex items-center gap-2 text-white/75 hover:text-white text-sm font-medium transition-colors whitespace-nowrap"
          >
            <PhoneIcon className="w-3.5 h-3.5 text-coral flex-shrink-0" />
            {PHONE}
          </a>
          <span className="w-px h-4 bg-white/15 flex-shrink-0" />
          <a
            href={`mailto:${EMAIL}`}
            className="flex items-center gap-2 text-white/75 hover:text-white text-sm font-medium transition-colors whitespace-nowrap"
          >
            <MailIcon className="w-3.5 h-3.5 text-coral flex-shrink-0" />
            {EMAIL}
          </a>
        </div>

        {/* ── Right nav + CTA (desktop) ────────────────────────── */}
        <div className="hidden lg:flex items-center gap-5 flex-shrink-0">
          {NAV_ITEMS.map(item => (
            <div key={item.label} className="relative">
              <button
                className={`flex items-center gap-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  openItem === item.label ? 'text-coral' : 'text-white/75 hover:text-white'
                }`}
                onClick={() => setOpenItem(p => p === item.label ? null : item.label)}
              >
                {item.label}
                {/* DESIGN.md: 16–24px radius on hover-state containers within nav */}
                <ChevronIcon
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    openItem === item.label ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openItem === item.label && (
                // DESIGN.md: floating elements use ambient shadow, charcoal-tinted 8–12%
                // DESIGN.md: cards on White Surface with 16px radius
                <div className="absolute top-[calc(100%+10px)] left-0 bg-white rounded-[16px] border border-warm-200 shadow-ambient py-2 min-w-[200px] z-50 animate-slide-in">
                  {item.items.map(sub => (
                    <Link
                      key={sub}
                      to="/login"
                      className="block px-4 py-2.5 text-sm text-charcoal/70 hover:text-coral hover:bg-warm-50 transition-colors first:rounded-t-[14px] last:rounded-b-[14px]"
                      onClick={() => setOpenItem(null)}
                    >
                      {sub}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* DESIGN.md: Primary buttons use CTA Accent (#F5847C), pill-shaped */}
          {user ? (
            <Link
              to={roleHome(user.role)}
              className="bg-coral hover:bg-coral-hover text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors whitespace-nowrap"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="bg-coral hover:bg-coral-hover text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors whitespace-nowrap"
            >
              Contact Us
            </Link>
          )}
        </div>

        {/* ── Mobile: hamburger + CTA ──────────────────────────── */}
        <div className="lg:hidden ml-auto flex items-center gap-3">
          <Link
            to="/login"
            className="bg-coral text-white text-sm font-semibold px-4 py-2 rounded-full flex-shrink-0"
          >
            Contact Us
          </Link>
          <button
            className="text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(p => !p)}
            aria-label="Menu"
          >
            {mobileOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 px-6 py-4 space-y-1 animate-slide-in">
          <a href={`tel:${PHONE.replace(/\s/g,'')}`} className="flex items-center gap-2 text-white/70 text-sm py-2.5">
            <PhoneIcon className="w-4 h-4 text-coral" /> {PHONE}
          </a>
          <a href={`mailto:${EMAIL}`} className="flex items-center gap-2 text-white/70 text-sm py-2.5">
            <MailIcon className="w-4 h-4 text-coral" /> {EMAIL}
          </a>
          <div className="border-t border-white/10 pt-3 mt-2 space-y-1">
            {NAV_ITEMS.map(item => (
              <div key={item.label} className="text-white/70 text-sm py-2 font-medium">
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

export function CofyndHeroSection() {
  const [lookingFor, setLookingFor] = useState('')
  const [selectedLocality, setSelectedLocality] = useState('')

  function handleSearch(e) {
    e.preventDefault()
    window.location.assign('/login')
  }

  return (
    // DESIGN.md: Background Warm (#FFF8F5) as Level 0
    <section className="bg-warm-50 overflow-hidden">
      <div className="max-w-[1280px] mx-auto">
        {/*
         * Two-column split: left 45% / right 55%
         * In CSS fr units: 9fr / 11fr (9+11=20; 9/20=45%, 11/20=55%)
         * Responsive: stacks vertically below 1024px
         */}
        <div className="grid grid-cols-1 lg:grid-cols-[9fr_11fr]">

          {/* ── LEFT COLUMN ─────────────────────────────────────── */}
          <div className="relative px-6 lg:pl-6 lg:pr-8 pt-10 pb-10 lg:pt-14 lg:pb-12 overflow-visible">

            {/*
             * Decorative blob — DESIGN.md: "Primary Canvas color behind photography or
             * in hero sections. Use smooth, non-symmetrical organic Bézier curves."
             * Absolute positioned, z-index: -1, behind headline text.
             */}
            <div
              className="absolute pointer-events-none select-none"
              style={{
                top: '20px',
                left: '-20px',
                width: '220px',
                height: '200px',
                background: '#FECEA1',  /* canvas — Primary Canvas */
                borderRadius: '60% 40% 55% 45% / 50% 60% 40% 50%',
                opacity: 0.72,
                zIndex: 0,
              }}
            />

            {/* ── Headline ───────────────────────────────────────── */}
            {/*
             * DESIGN.md Display scale: 48px / 700 / 1.1 line-height / -0.04em tracking
             * Mobile display-mobile: 36px same weight/spacing
             * "Work" and "Live" use CTA Accent (#F5847C) — primary brand color
             */}
            <h1
              className="relative font-bold text-charcoal mb-7"
              style={{
                fontSize: 'clamp(36px, 3.5vw, 48px)',
                lineHeight: '1.1',
                letterSpacing: '-0.04em',
                zIndex: 1,
              }}
            >
              Choose from 100,000+<br />
              spaces to{' '}
              <span className="text-coral">Work</span>
              {' '}&amp;{' '}
              <span className="text-coral">Live</span>
            </h1>

            {/* ── Filter Dropdowns ───────────────────────────────── */}
            {/*
             * DESIGN.md Input Fields:
             *   fill: Neutral Base (#F9F3EE = warm-100)
             *   border: Structural Secondary at 20% opacity
             *   radius: 8px (DESIGN.md rounded.DEFAULT)
             *   focus: border transitions to 100% Structural Secondary
             */}
            <form
              onSubmit={handleSearch}
              className="flex gap-3 mb-8 max-w-[520px] relative"
              style={{ zIndex: 1 }}
            >
              <FilterDropdown
                value={lookingFor}
                onChange={setLookingFor}
                placeholder="Looking For"
                options={LOOKING_FOR_OPTIONS}
              />
              <FilterDropdown
                value={selectedLocality}
                onChange={setSelectedLocality}
                placeholder="Select City"
                options={PUNE_LOCALITIES.map(l => l.name)}
              />
            </form>

            {/* ── Locality Grid ──────────────────────────────────── */}
            {/*
             * Desktop: 6 cols × 3 rows (inside 45% column)
             * Tablet 768–1023px: 4 columns (full width stacked)
             * Mobile <768px: 3 columns
             * Each cell: 72px circle + label below
             */}
            <div
              className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-5 relative"
              style={{ zIndex: 1 }}
            >
              {PUNE_LOCALITIES.map(loc => (
                <LocalityCell key={loc.name} name={loc.name} icon={loc.icon} />
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN ────────────────────────────────────── */}
          {/*
           * Hero image: height 580–620px, border-radius: 0 0 0 60px
           * (top-left 0, top-right 0, bottom-right 0, bottom-left 60px)
           * Hidden below lg breakpoint; shown as full-width banner on tablet/mobile
           */}
          <div className="relative lg:block lg:h-[600px]">
            {/* Mobile/tablet: banner image */}
            <div className="lg:hidden h-56 sm:h-72 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1758448721134-1798533ae917?w=900&h=600&fit=crop&q=80&auto=format"
                alt="Premium PG accommodation — modern interior, Pune"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Desktop: clipped image */}
            <div
              className="hidden lg:block w-full h-full relative"
            >
              <img
                src="https://images.unsplash.com/photo-1758448721134-1798533ae917?w=900&h=600&fit=crop&q=80&auto=format"
                alt="Premium PG accommodation — modern interior, Pune"
                className="w-full h-full object-cover object-center"
                style={{ borderRadius: '0 0 0 60px' }}
              />

              {/*
               * Floating call button — bottom-right of image
               * DESIGN.md: floating elements use ambient shadow
               *   rgba(42,54,59,0.12) tinted with Structural Secondary
               * Circle shape, white bg, coral phone icon
               */}
              <a
                href={`tel:${PHONE.replace(/\s/g, '')}`}
                aria-label="Call us"
                className="absolute bottom-8 right-8 w-[56px] h-[56px] bg-white rounded-full flex items-center justify-center text-coral hover:scale-110 transition-transform z-10"
                style={{
                  boxShadow: 'rgba(42,54,59,0.18) 0px 8px 28px 4px',
                }}
              >
                <FloatingPhoneIcon className="w-6 h-6" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────

function FilterDropdown({ value, onChange, placeholder, options }) {
  return (
    <div className="relative flex-1 min-w-0">
      {/*
       * DESIGN.md Input spec:
       *   fill: warm-100 (Neutral Base #F9F3EE)
       *   border: charcoal/20 (Structural Secondary at 20%)
       *   radius: 8px (rounded.DEFAULT = 0.5rem)
       *   focus: border-charcoal (100% Structural Secondary)
       */}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-warm-100 border border-charcoal/20 rounded text-sm font-medium text-charcoal focus:outline-none focus:border-charcoal cursor-pointer pr-9 pl-4"
        style={{ height: '48px' }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 pointer-events-none" />
    </div>
  )
}

// ─── Locality Cell ────────────────────────────────────────────────────────────

function LocalityCell({ name, icon }) {
  return (
    <button
      type="button"
      onClick={() => window.location.assign('/login')}
      className="flex flex-col items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 rounded-lg"
      title={`Browse PGs in ${name}`}
    >
      {/*
       * DESIGN.md: city icon background = Surface Container / Neutral Base (warm-100)
       * Icon stroke = CTA Accent (coral) — "accent color from design.md"
       * Hover: coral border highlight + scale(1.05) per spec
       * DESIGN.md border-radius for cards = 16px, but circles use rounded-full
       */}
      <div
        className="w-[72px] h-[72px] bg-warm-100 border-2 border-transparent rounded-full flex items-center justify-center
          text-coral/70 group-hover:text-coral
          group-hover:border-coral group-hover:scale-105 group-hover:bg-white
          transition-all duration-200"
        style={{ boxShadow: 'none' }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = 'rgba(42,54,59,0.08) 0px 4px 12px 0px'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <BuildingIcon variant={icon} className="w-9 h-9" />
      </div>
      {/* DESIGN.md body-md scale but city labels use 12px per spec */}
      <span className="text-[11px] font-medium text-charcoal/55 text-center leading-tight group-hover:text-charcoal transition-colors" style={{ maxWidth: '72px' }}>
        {name}
      </span>
    </button>
  )
}

// ─── Building Icons (thin-line architectural, stroke="currentColor") ──────────

function BuildingIcon({ variant, className }) {
  const svgBase = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.5',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    viewBox: '0 0 32 32',
  }

  switch (variant) {
    case 'tower':
      return (
        <svg {...svgBase} className={className}>
          {/* Modern high-rise office tower */}
          <rect x="9" y="2" width="14" height="28" rx="1" />
          <line x1="9" y1="9" x2="23" y2="9" />
          <line x1="9" y1="16" x2="23" y2="16" />
          <line x1="9" y1="23" x2="23" y2="23" />
          <rect x="11" y="4" width="3" height="3.5" rx="0.5" />
          <rect x="18" y="4" width="3" height="3.5" rx="0.5" />
          <rect x="11" y="11" width="3" height="3.5" rx="0.5" />
          <rect x="18" y="11" width="3" height="3.5" rx="0.5" />
          <rect x="11" y="18" width="3" height="3.5" rx="0.5" />
          <rect x="18" y="18" width="3" height="3.5" rx="0.5" />
          <rect x="13" y="25" width="6" height="5" rx="0.5" />
        </svg>
      )

    case 'block':
      return (
        <svg {...svgBase} className={className}>
          {/* Apartment block with pitched roof */}
          <path d="M2 14 L16 3 L30 14" />
          <rect x="3" y="14" width="26" height="16" rx="1" />
          <rect x="6" y="18" width="5" height="5" rx="0.5" />
          <rect x="13.5" y="18" width="5" height="5" rx="0.5" />
          <rect x="21" y="18" width="5" height="5" rx="0.5" />
          <rect x="12.5" y="24" width="7" height="6" rx="0.5" />
          <line x1="3" y1="30" x2="29" y2="30" />
        </svg>
      )

    case 'campus':
      return (
        <svg {...svgBase} className={className}>
          {/* IT campus / institutional building */}
          <rect x="2" y="12" width="28" height="18" rx="1" />
          <rect x="9" y="3" width="14" height="9" />
          <line x1="16" y1="3" x2="16" y2="12" />
          <line x1="12" y1="6" x2="20" y2="6" />
          <rect x="5" y="16" width="5" height="5" rx="0.5" />
          <rect x="13.5" y="16" width="5" height="5" rx="0.5" />
          <rect x="22" y="16" width="5" height="5" rx="0.5" />
          <rect x="13" y="24" width="6" height="6" rx="0.5" />
        </svg>
      )

    case 'home':
      return (
        <svg {...svgBase} className={className}>
          {/* Residential home — PG/villa style */}
          <path d="M2 15 L16 3 L30 15" />
          <rect x="3" y="15" width="26" height="15" rx="0.5" />
          <rect x="5" y="19" width="6" height="5" rx="0.5" />
          <rect x="21" y="19" width="6" height="5" rx="0.5" />
          <rect x="13" y="21" width="6" height="9" rx="0.5" />
          <path d="M2 30 L30 30" />
        </svg>
      )

    case 'commercial':
    default:
      return (
        <svg {...svgBase} className={className}>
          {/* Mixed-use commercial / business district */}
          <rect x="4" y="6" width="10" height="24" rx="1" />
          <rect x="18" y="11" width="10" height="19" rx="1" />
          <rect x="6" y="9" width="3" height="3" rx="0.4" />
          <rect x="11" y="9" width="3" height="3" rx="0.4" />
          <rect x="6" y="15" width="3" height="3" rx="0.4" />
          <rect x="11" y="15" width="3" height="3" rx="0.4" />
          <rect x="6" y="21" width="3" height="3" rx="0.4" />
          <rect x="11" y="21" width="3" height="3" rx="0.4" />
          <rect x="20" y="14" width="3" height="3" rx="0.4" />
          <rect x="25" y="14" width="3" height="3" rx="0.4" />
          <rect x="20" y="20" width="3" height="3" rx="0.4" />
          <rect x="25" y="20" width="3" height="3" rx="0.4" />
          <rect x="8" y="25" width="4" height="5" rx="0.4" />
          <rect x="21" y="25" width="4" height="5" rx="0.4" />
        </svg>
      )
  }
}

// ─── Logo Mark ────────────────────────────────────────────────────────────────

function NavLogo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
      {/*
       * Logo: canvas circle (Primary Canvas) + coral accent dot + charcoal wordmark
       * Mirrors Cofynd's circle-mark aesthetic using DESIGN.md palette
       */}
      <span className="relative flex-shrink-0">
        {/* Primary Canvas circle — blob/organic glow element */}
        <span
          className="block w-8 h-8 rounded-full"
          style={{ background: '#FECEA1', opacity: 0.85 }}
        />
        {/* CTA Accent dot — top-right */}
        <span
          className="absolute top-0 right-0 block w-3 h-3 rounded-full bg-coral border-[1.5px] border-charcoal"
        />
      </span>
      {/* Structural Secondary separator bar */}
      <span className="block w-[3px] h-7 rounded-full bg-white opacity-50 flex-shrink-0" />
      {/* Wordmark — DESIGN.md: Montserrat 700, Structural Secondary on light bg but white on dark navbar */}
      <span className="font-bold text-xl text-white tracking-tight">
        Nest Stay
      </span>
    </Link>
  )
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function PhoneIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.58.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.01L6.6 10.8z" />
    </svg>
  )
}

function MailIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  )
}

function FloatingPhoneIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.58.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.01L6.6 10.8z" />
    </svg>
  )
}

function ChevronIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
