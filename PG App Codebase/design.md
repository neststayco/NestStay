# Design System

## Overview

**Theme name:** Nest Stay — Warm Minimalism (v3, unified).

Built on **Tailwind CSS v3** with a custom theme extension. No third-party component library — all UI is hand-crafted JSX. No CSS-in-JS, no CSS Modules. Tokens live in `tailwind.config.js`; warm palette values use Tailwind arbitrary values (`bg-[#...]`) consistently across all surfaces.

The UI has **one unified visual register** — the Warm Minimalism system — applied to the landing page, user dashboard, and all authenticated surfaces.

---

## Colors

### Warm Minimalism Palette (universal — all surfaces)

| Role | Hex | Usage |
|---|---|---|
| **Page background** | `#fbf9f8` | Root `<div>`, hero, all page backgrounds |
| **Dark section bg** | `#101e22` | Value prop section, CTA section, dark cards |
| **Accent / CTA** | `#e98a76` | Primary buttons, active nav underline, icon highlights, price text, star ratings |
| **Accent light** | `#ffdbd0` | Avatar bg, floating badge icon bg, dashboard highlight cards, decorative blur |
| **Text primary** | `#1b1c1c` | All headings, card names, labels |
| **Text body** | `#434849` | Body copy, nav links, card descriptions |
| **Text muted** | `#73787a` | Outline icons, location text, footer muted, captions |
| **On-dark muted** | `#bac9ce` | Body text on `#101e22` sections |
| **On-dark light** | `#ffdbd0` | Eyebrow labels on dark sections |
| **Border / stroke** | `#E5E7EB` | All card borders, nav bottom border, section dividers |
| **Surface low** | `#f6f3f2` | Trust bar bg, testimonials bg, stat card bg, input bg |
| **Surface mid** | `#eae8e7` | Titlebar bg, decorative rotated div |
| **Surface hover** | `#f0eded` | Ghost button hover, mobile menu toggle hover |
| **Footer bg** | `#e4e2e1` | Footer background |
| **Dashboard accent text** | `#3a0b00` | Text on `#ffdbd0` dashboard highlight cards |

#### Navbar background (inline style)
```jsx
style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(251,249,248,0.85)' }}
```

### Tailwind Token Colors

| Token | Value | Usage |
|---|---|---|
| `tertiary-fixed` | `#f0e0cd` | Eyebrow badge background |
| `on-tertiary-fixed-variant` | `#4f4538` | Eyebrow badge text |
| `primary-fixed` | `#ffdad3` | Avatar bg (AS) |
| `primary` | `#954737` | Avatar text (AS) |
| `on-tertiary-fixed` | `#221a0f` | Avatar text (SK) |
| `shadow-card` | `rgba(0,0,0,0.08) 0px 4px 10px` | Card + search bar shadow |
| `shadow-ambient` | `rgba(42,54,59,0.12) 0px 12px 32px` | Value prop image shadow |

### Semantic Colors

| Semantic | Classes | Usage |
|---|---|---|
| Available | `bg-green-100 text-green-700` | PG card status pill |
| Filling Fast | `bg-yellow-100 text-yellow-700` | PG card status pill |
| Success / Verified | `green-600`, `green-100`, `green-700` | Verified badge, success stat card |
| Error / Danger | `red-50`–`red-700` | Error alerts, full-seats badge |
| Warning | `amber-50`–`amber-800` | Escalation alerts |
| Info | `blue-50`, `blue-600` | Beds-left badge |
| Rating stars | `text-[#e98a76]` with `fontVariationSettings: "'FILL' 1"` | All star icons |

---

## Logo & Brand

The Nest Stay logo is a **PNG image file** (`/nest-stay-logo.png`, 512×512, served from `frontend/public/`).

```jsx
// Navbar (h-10 = 40px)
<Link to="/">
  <img src="/nest-stay-logo.png" alt="Nest Stay" className="h-10 w-auto" />
</Link>

// Footer (h-12 = 48px)
<img src="/nest-stay-logo.png" alt="Nest Stay" className="h-12 w-auto mb-6" />
```

Browser tab favicon is also set to `/nest-stay-logo.png` in `index.html`.

---

## Typography

### Font Family

```js
// tailwind.config.js
fontFamily: {
  sans: ["Montserrat", "'Helvetica Neue'", "Helvetica", "Arial", "sans-serif"],
}
```

Montserrat loaded via Google Fonts at weights 400, 500, 600, 700. Plus Jakarta Sans also imported in `index.css` (available but not the primary font).

### Icon Font

Material Symbols Outlined — loaded via Google Fonts in `index.css`. Used for all icons (location_on, search, payments, verified, check_circle, star, thumb_up, arrow_forward, etc.).

```jsx
<span className="material-symbols-outlined text-[#e98a76]">verified</span>
// Filled variant:
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
```

### Font Size Scale

| Class | Size | Usage |
|---|---|---|
| `text-xs` / `text-[10px]` | 12px / 10px | Eyebrow labels, badges, captions, footer links |
| `text-sm` | 14px | Nav links, body copy, buttons, card content |
| `text-lg` | 18px | Hero body paragraph |
| `text-2xl` | 24px | Floating stat number, footer brand names |
| `text-[32px]` | 32px | Section H2 headings |
| `text-[40px]` / `text-[48px]` | 40–48px | Hero H1 (mobile/desktop), CTA H2 |
| `text-[48px]` | 48px | Stats section numbers |

### Font Weights

| Weight | Usage |
|---|---|
| `font-medium` | Nav links (inactive) |
| `font-semibold` | Buttons, card labels |
| `font-bold` | Section H2, card headings, badges, prices |
| `font-extrabold` | Hero H1, CTA H2, stats numbers |

### Heading Styles

| Level | Classes | Example |
|---|---|---|
| H1 (hero) | `text-[40px] lg:text-[48px] font-extrabold text-[#1b1c1c] leading-tight` | "Find Your Perfect Paying Guest Home" |
| H2 (light section) | `text-[32px] font-bold text-[#1b1c1c] leading-tight` | "Premium PG Spaces" |
| H2 (dark section) | `text-[32px] font-bold text-white leading-tight` | "Discover PGs Designed…" |
| H2 (CTA) | `text-[40px] lg:text-[48px] font-extrabold text-white leading-tight` | "Let Your Team Work…" |
| Eyebrow | `text-xs font-bold text-[#e98a76] uppercase tracking-wider` | "Featured", "What Residents Say" |
| Eyebrow (dark) | `text-xs font-bold text-[#ffdbd0] uppercase tracking-widest` | "For Students & Guests" |

---

## Spacing

Tailwind's default 4px-base scale. No custom spacing tokens.

### Container

```jsx
// All sections use:
className="max-w-[1280px] mx-auto px-6 lg:px-16"
```

### Section Vertical Padding

| Section | Mobile | Desktop |
|---|---|---|
| Hero | `py-12` | `lg:py-24` |
| Trust Bar | `py-12` | same |
| Value Prop | `py-16` | `lg:py-32` |
| Featured PGs | `py-12` | `lg:py-24` |
| Testimonials | `py-12` | `lg:py-24` |
| Owner | `py-16` | `lg:py-32` |
| CTA | `py-12` | `lg:py-24` |
| Stats | `py-12` | same |
| Footer | `pt-24 pb-12` | same |

---

## Layout & Grid

### Breakpoints (Tailwind defaults)

| Prefix | Min-width |
|---|---|
| `md` | 768px |
| `lg` | 1024px |

### Grid Patterns

| Pattern | Classes | Usage |
|---|---|---|
| Two-column split | `grid-cols-1 lg:grid-cols-2 gap-12` | Hero section |
| Two-column split (wide gap) | `grid-cols-1 lg:grid-cols-2 gap-20` | Value Prop, Owner sections |
| Three-column cards | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` | PG cards, Testimonials |
| Two-column features | `grid-cols-2 gap-x-12 gap-y-6` | Owner feature checklist |
| Three-column stats | `grid-cols-1 md:grid-cols-3 gap-12` | Stats section |
| Four-column footer | `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12` | Footer |

### Fixed Dimensions

| Element | Value |
|---|---|
| Navbar height | `h-20` (80px) |
| Main top offset | `pt-20` |
| Container max-width | `max-w-[1280px]` |
| Hero image aspect ratio | `4/5` (portrait) |
| Value prop image aspect ratio | `aspect-square` |
| PG card image height | `h-64` |

---

## Borders & Radius

### Border Radius

| Class | Value | Usage |
|---|---|---|
| `rounded-xl` | 12px | Navbar "Sign In" button, search "Search" button |
| `rounded-2xl` | 16px | Search bar, PG cards, testimonial cards, owner dashboard, floating badges, dashboard cards |
| `rounded-[2rem]` | 32px | Owner dashboard mockup |
| `rounded-[2.5rem]` | 40px | Hero portrait image |
| `rounded-[3rem]` | 48px | Value prop image, CTA section container |
| `rounded-full` | 9999px | Eyebrow badge, trust badge pills, status pills, avatar circles |
| `rounded-lg` | 8px | Mobile hamburger hover, newsletter send button |

### Border Styles

| Context | Value |
|---|---|
| Standard card / section divider | `border-[#E5E7EB]` |
| Navbar bottom | `border-b border-[#E5E7EB]` |
| Ghost button | `border border-[#73787a]` |
| Ghost CTA (dark bg) | `border border-[#c3c7c9]` |
| Owner sign-in button | `border border-[#E5E7EB]` |

---

## Shadows

### Custom Shadow Tokens (from tailwind.config.js)

```js
card:    'rgba(0,0,0,0.08) 0px 4px 10px 0px'       // cards, search bar
ambient: 'rgba(42,54,59,0.12) 0px 12px 32px 0px'   // value prop image
```

### Elevation Map

| Level | Shadow | Usage |
|---|---|---|
| 0 — flat | none | Section backgrounds |
| 1 — card | `shadow-card` | PG cards, search bar, floating badge, dashboard cards |
| 2 — elevated | `shadow-ambient` | Value prop image |
| 3 — overlay | `shadow-lg` | Mobile menu dropdown |

### Hover Elevation (PG Card)

```jsx
className="hover:shadow-card transition-all duration-300"
```

---

## Components

### Navbar (Universal — glass blur)

```jsx
<nav
  className="fixed top-0 left-0 right-0 z-50 border-b border-[#E5E7EB]"
  style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(251,249,248,0.85)' }}
>
  // Height: h-20
  // Container: max-w-[1280px] mx-auto px-6 lg:px-16
  // Active nav link: text-[#e98a76] border-b-2 border-[#e98a76] font-bold
  // Inactive nav link: text-[#434849] hover:text-black font-medium
```

### Buttons

#### Primary — Salmon CTA
```jsx
className="bg-[#e98a76] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
// Large variant (CTA section):
className="bg-[#e98a76] text-white px-10 py-5 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all"
// Owner / dashboard section:
className="bg-[#e98a76] text-white px-8 py-4 rounded-2xl text-sm font-semibold hover:opacity-90 transition-all"
```

#### Secondary — Ghost outline
```jsx
className="px-6 py-2.5 rounded-xl border border-[#73787a] text-black text-sm font-semibold hover:bg-[#f0eded] transition-all"
```

#### Ghost — On dark background
```jsx
className="bg-transparent border border-[#c3c7c9] text-white px-10 py-5 rounded-2xl text-sm font-semibold hover:bg-white/10 transition-all"
```

#### Search button (inside search bar)
```jsx
className="bg-black text-white px-8 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-[#e98a76] transition-colors"
```

#### Secondary surface button
```jsx
className="bg-[#f0eded] text-[#1b1c1c] px-8 py-4 rounded-2xl text-sm font-semibold border border-[#E5E7EB] hover:bg-[#eae8e7] transition-all"
```

#### Value prop CTA (on dark)
```jsx
className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl text-sm font-semibold hover:bg-[#ffdbd0] transition-colors"
```

### Form Elements

```jsx
// Input
className="w-full border border-[#E5E7EB] rounded-2xl px-4 py-3 text-sm text-[#1b1c1c] bg-[#fbf9f8] placeholder-[#73787a] focus:outline-none focus:ring-2 focus:ring-[#e98a76] focus:border-[#e98a76] transition-colors"

// Label
className="block text-sm font-semibold text-[#1b1c1c] mb-2"

// Error
className="bg-[#ffdbd0] border border-[#e98a76]/30 text-[#3a0b00] px-4 py-3 rounded-2xl text-sm"
```

### Search Bar

```jsx
// Container
className="bg-white p-2 rounded-2xl shadow-card border border-[#E5E7EB] flex flex-col md:flex-row items-center gap-2 max-w-2xl"

// Divider between fields
<div className="h-8 w-px bg-[#E5E7EB] hidden md:block" />

// Icons inside fields
<span className="material-symbols-outlined text-[#73787a]">location_on</span>

// Input
className="w-full border-none focus:ring-0 bg-transparent text-sm outline-none"
```

### PG Listing Card

```jsx
// Outer
className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden group hover:shadow-card transition-all duration-300"
style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 4px 10px 0px' }}

// Image container
className="relative h-64 overflow-hidden"
// Image hover: group-hover:scale-105 transition-transform duration-500

// Rating badge (top-right overlay)
className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1"

// Status pill
// Available: bg-green-100 text-green-700
// Filling Fast: bg-yellow-100 text-yellow-700
className="px-3 py-1 rounded-full text-xs font-bold"

// Price
className="text-2xl font-bold text-[#e98a76]"
// Unit: text-sm font-normal text-[#73787a]
```

### Testimonial Card

```jsx
className="bg-white p-8 rounded-2xl border border-[#E5E7EB] hover:shadow-card transition-all"
// Stars: text-[#e98a76], fontVariationSettings: "'FILL' 1"
// Quote: text-sm text-[#434849] italic leading-relaxed
// Avatar circle: w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm
```

### Floating Stat Badge (Hero)

```jsx
className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-card border border-[#E5E7EB] flex items-center gap-4"
// Icon wrapper: w-12 h-12 bg-[#ffdbd0] rounded-xl flex items-center justify-center
// Icon: text-[#e98a76]
// Number: text-2xl font-bold
// Label: text-xs font-bold text-[#73787a]
```

### Dashboard Stat Card

```jsx
// Neutral tile
className="p-5 bg-[#f6f3f2] rounded-2xl border border-[#E5E7EB]"
// Label: text-sm text-[#73787a] font-medium
// Value: text-2xl font-bold text-[#1b1c1c]

// Accent tile (highlight)
className="p-5 bg-[#ffdbd0] rounded-2xl border border-[#E5E7EB]"
// Label / value: text-[#3a0b00]
```

### Dashboard Activity Row

```jsx
className="flex items-center justify-between py-3 border-b border-[#E5E7EB]"
// Positive amount: text-green-600 font-bold
// Status pill: bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold
```

### Owner Dashboard Mockup

```jsx
// Outer card
className="bg-white rounded-[2rem] border border-[#E5E7EB] shadow-card overflow-hidden"

// Titlebar
className="bg-[#eae8e7] p-4 flex items-center justify-between"
// Traffic light dots: w-3 h-3 rounded-full (red-400, yellow-400, green-400)
```

### Toast Notifications

```jsx
className="pointer-events-auto flex items-start gap-3 bg-white border border-[#E5E7EB] shadow-card rounded-2xl px-4 py-3 min-w-[260px] max-w-sm animate-slide-in"
// Icons: green-500 (success), red-500 (error), text-[#e98a76] (info)
// Duration: 3500ms auto-dismiss
```

### CTA Section (Dark)

```jsx
// Section container
className="bg-[#101e22] rounded-[3rem] p-12 lg:p-24 text-center text-white relative overflow-hidden"

// Decorative glow
className="absolute top-0 right-0 w-64 h-64 bg-[#e98a76] opacity-10 blur-3xl pointer-events-none"

// Eyebrow: text-[#ffdbd0] text-xs font-bold uppercase tracking-widest
// Heading: text-[40px] lg:text-[48px] font-extrabold text-white
// Body: text-lg text-[#bac9ce] leading-relaxed
```

### Newsletter Input (Footer)

```jsx
className="flex items-center p-1 border border-[#c3c7c9] rounded-xl bg-[#f6f3f2]"
// Input: flex-1 bg-transparent border-none focus:ring-0 px-4 text-sm outline-none
// Send button: w-10 h-10 bg-[#e98a76] text-white rounded-lg hover:opacity-90
```

### Section Eyebrow Label

```jsx
// Light section
className="text-[#e98a76] text-xs font-bold uppercase tracking-wider mb-2 block"

// Dark section
className="text-[#ffdbd0] text-xs font-bold uppercase tracking-widest mb-4 block"
```

### Trust Bar

```jsx
className="py-12 bg-[#f6f3f2] border-y border-[#E5E7EB]"
// Label: text-xs font-bold text-[#73787a] uppercase tracking-widest
// Brand names: text-2xl font-bold text-[#1b1c1c] opacity-50
```

### Stats Row

```jsx
// Section
className="py-12 border-y border-[#E5E7EB]"
// Number: text-[48px] font-extrabold text-black
// Label: text-sm font-semibold text-[#73787a]
```

### Footer

```jsx
// Background: bg-[#e4e2e1]
// Divider: border-t border-[#E5E7EB]
// Section label: text-sm font-bold text-[#1b1c1c] mb-8
// Links: text-sm text-[#434849] hover:text-black
// Contact icons: text-[20px] text-[#73787a]
// Social icons: w-10 h-10 rounded-full border border-[#c3c7c9] hover:bg-black hover:text-white
// Copyright: text-xs text-[#73787a]
```

---

## Images

| Context | Source |
|---|---|
| Landing hero | `https://picsum.photos/seed/neststay-hero/600/750` |
| Value prop | `https://picsum.photos/seed/neststay-coliving/600/600` |
| PG card 1 | `https://picsum.photos/seed/pg-collective/600/400` |
| PG card 2 | `https://picsum.photos/seed/pg-zenith/600/400` |
| PG card 3 | `https://picsum.photos/seed/pg-loft/600/400` |
| Real PG images | Served from `pg.images[0]` URL |
| Fallback | `https://placehold.co/400x220/f6f3f2/73787a?text=No+Image` |

All images use `object-cover` inside fixed-height containers.

---

## Motion

### Custom Keyframes (tailwind.config.js)

```js
'slide-in': {
  from: { opacity: '0', transform: 'translateY(8px)' },
  to:   { opacity: '1', transform: 'translateY(0)' },
}
'fade-up': {
  from: { opacity: '0', transform: 'translateY(24px)' },
  to:   { opacity: '1', transform: 'translateY(0)' },
}
```

### Transition Conventions

| Pattern | Usage |
|---|---|
| `transition-colors` | Buttons, links (color-only changes) |
| `transition-all` | Ghost buttons, nav links |
| `transition-all duration-300` | Card hover (shadow) |
| `transition-transform duration-500` | Image zoom on card hover |
| `hover:opacity-90` | Primary salmon CTA buttons |
| `active:scale-95` | "Book a Tour" button press feedback |

### Scroll Behavior

```css
html { scroll-behavior: smooth; }  /* index.css */
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Tooling

| Concern | Choice |
|---|---|
| CSS framework | Tailwind CSS v3 |
| Component library | None — all hand-crafted JSX |
| Design tokens | `tailwind.config.js` (`theme.extend`) + arbitrary values |
| Icon system | Material Symbols Outlined (Google Fonts, variable font) |
| Fonts | Montserrat (primary), Plus Jakarta Sans (imported, available) |
| Animation | Tailwind `keyframes` + `animation` in config |
| Build tool | Vite 5 |
| Framework | React 18 |

### Key File Locations

```
frontend/tailwind.config.js     ← all design tokens
frontend/src/index.css          ← font imports, Tailwind directives, global resets
frontend/public/nest-stay-logo.png  ← brand logo (512×512 PNG)
frontend/index.html             ← favicon, meta tags
frontend/src/platforms/unified/pages/LandingPage.jsx  ← landing page
design.md                       ← this file
```