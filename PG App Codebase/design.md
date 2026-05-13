# Design System

## Overview

**Theme name:** Warm Minimalism (named in `tailwind.config.js` comments).

The design system is built on **Tailwind CSS v3** with a custom theme extension. No third-party component library is used — all UI components are hand-crafted JSX with inline Tailwind classes. There is no CSS-in-JS, no CSS Modules, and no design-token JSON file; all tokens live in `tailwind.config.js` and are consumed as utility classes or occasional inline `style` props.

The UI has two distinct visual registers:

- **Landing page / public surface** — warm earth tones (canvas, coral, charcoal), large typography, rounded pill buttons, dark "deep charcoal" hero/CTA sections.
- **App shell (admin, owner, user)** — neutral whites and slate, tighter spacing, a left sidebar, and the `action` (blue) token for interactive states.

---

## Colors

### Custom Design Tokens

All tokens are defined in `frontend/tailwind.config.js → theme.extend.colors`.

#### Brand & Action

| Token | Value | Usage |
|---|---|---|
| `brand` | `#ffe785` | Admin/Login primary CTA button, logo icon background |
| `brand-light` | `#ffd94d` | Hover state for brand button |
| `brand-50` | `#ffefba` | Tint |
| `brand-100` | `#fff3ee` | Soft tint |
| `action` | `#027fff` | Active sidebar nav items, badge counts, focus rings, links |
| `action-light` | `#0d6efd` | Hover variant |
| `action-50` | `#e8f4ff` | Stat card background (blue) |
| `action-100` | `#c7e2ff` | Stat card border (blue) |

#### Warm Minimalism Palette

| Token | Value | Usage |
|---|---|---|
| `canvas` | `#FECEA1` | Owner section background, avatar gradient end |
| `charcoal` | `#2A363B` | Primary text on light surfaces |
| `charcoal-dark` | `#1A2328` | Search button hover |
| `charcoal-deep` | `#0C1A1E` | Navbar, CTA section, footer background |
| `coral` | `#F5847C` | Accent color — section eyebrows, CTA buttons, icons, highlights |
| `coral-hover` | `#E8736B` | Coral hover state |
| `warm-50` | `#FFF8F5` | Lightest warm surface |
| `warm-100` | `#F9F3EE` | Section backgrounds (Promo, WorkspaceGrid, CTA) |
| `warm-200` | `#F5ECE7` | Card borders on warm backgrounds |

#### Hero Gradients (inline styles)

```jsx
// Hero section background
background: 'radial-gradient(circle at top right, #F9DCC4 0%, #FECEA1 40%, #F5ECE7 100%)'

// Testimonial avatar
background: 'linear-gradient(135deg, #F5847C 0%, #FECEA1 100%)'
```

### Semantic Colors (Tailwind stock)

| Semantic | Tailwind classes | Usage |
|---|---|---|
| Success / Verified | `green-600`, `green-100`, `green-700` | Verified badge, success stat card |
| Error / Danger | `red-50`, `red-100`, `red-200`, `red-500`, `red-600`, `red-700` | Error alerts, full-seats badge |
| Warning | `amber-50`, `amber-100`, `amber-200`, `amber-700`, `amber-800` | Escalation alerts, attention banners |
| Info | `blue-50`, `blue-600` | Beds-left badge, info stat card |
| Rating | `yellow-400` | Star icons |
| Stats | `purple-50`, `purple-100`, `purple-700` | Dashboard stat card variant |
| Neutral | `gray-100`–`gray-900` | Text, borders, skeleton loaders |

### App Shell Colors (Sidebar)

| Class | Usage |
|---|---|
| `slate-900` | Sidebar background |
| `slate-700` | Sidebar section borders |
| `slate-800` | Nav item hover background |
| `slate-400` | Inactive nav icon/text |
| `slate-500` | User email in sidebar footer |

### Legacy / Hardcoded App Colors

Used in `PGCard`, `LoginPage`, `UserNavbar` — these predate the Warm Minimalism palette and have not yet been migrated to tokens.

| Value | Role |
|---|---|
| `#222121` | Primary text color |
| `#6c757d` | Secondary / muted text |
| `#e0e0e0` | Default border, disabled button |
| `#f8f9fa` | Page background (auth screens) |
| `#027fff` | Link color (= `action` token) |
| `#f44336` | Inline error color |

---

## Typography

### Font Family

```js
// tailwind.config.js
fontFamily: {
  sans: ["Montserrat", "'Helvetica Neue'", "Helvetica", "Arial", "sans-serif"],
}
```

Montserrat is loaded via Google Fonts at weights 400, 500, 600, 700. Applied globally via `font-sans` on the root `<div>` in `LandingPage.jsx` and by Tailwind's base reset everywhere else.

### Font Size Scale

| Class | Size | Usage |
|---|---|---|
| `text-[10px]` | 10px | Micro-captions: stat labels, floating card subtitles |
| `text-xs` | 12px | Badges, footer links, captions, eyebrow labels, form hints |
| `text-sm` | 14px | Body text, nav links, card content, form inputs, buttons (most) |
| `text-base` | 16px | Section body paragraphs, CTA primary button |
| `text-lg` | 18px | Subheadings, logo wordmark, brand names |
| `text-xl` | 20px | Trusted-by brand names (lg breakpoint) |
| `text-2xl` | 24px | Floating stat numbers, login page heading |
| `text-3xl` | 30px | Section headings (default/mobile) |
| `text-4xl` | 36px | Section headings (desktop), CTA heading |
| `text-5xl` | 48px | Hero heading (mobile/tablet) |
| `text-[64px]` | 64px | Hero heading (desktop, `lg:text-[64px]`) |

### Font Weights

| Class | Weight | Usage |
|---|---|---|
| `font-normal` | 400 | Body copy, muted text |
| `font-medium` | 500 | Nav links, labels, user greeting |
| `font-semibold` | 600 | Button text, column headings, footer section labels |
| `font-bold` | 700 | All headings, stat numbers, prices, logo wordmark |

### Line Heights

| Class | Value | Usage |
|---|---|---|
| `leading-none` | 1 | Stat numbers in floating cards |
| `leading-[1.1]` | 1.1 | Hero H1, CTA H2 |
| `leading-tight` | 1.25 | Section H2 headings |
| `leading-snug` | 1.375 | Card titles |
| `leading-relaxed` | 1.625 | Body paragraphs, feature list items |

### Letter Spacing

| Class | Value | Usage |
|---|---|---|
| `tracking-tight` | -0.025em | All headings, logo text |
| `tracking-wide` | 0.025em | Dashboard stat labels |
| `tracking-wider` | 0.05em | Section eyebrow labels |
| `tracking-widest` | 0.1em | Coral uppercase section labels |
| `tracking-[0.2em]` | 0.2em | "Trusted by professionals at" label |

### Heading Styles (as used)

| Level | Classes | Example |
|---|---|---|
| H1 (hero) | `text-5xl lg:text-[64px] font-bold text-charcoal leading-[1.1] tracking-tight` | "Find Your Perfect Paying Guest Home" |
| H2 (section) | `text-3xl lg:text-4xl font-bold text-charcoal tracking-tight` | "Premium PG Spaces" |
| H2 (dark) | `text-4xl font-bold text-white leading-tight tracking-tight` | "Discover PGs…" |
| H3 (card) | `font-bold text-charcoal text-base` | PG card name |
| H3 (login) | `text-2xl font-bold text-[#222121]` | "Sign in to Nest Stay" |

---

## Spacing

Tailwind's default 4px-base spacing scale is used throughout. No custom spacing tokens are defined.

### Common Padding / Margin Values

| Value | px | Common use |
|---|---|---|
| `1` | 4px | Fine adjustments, icon nudges |
| `1.5` | 6px | Badge vertical padding |
| `2` | 8px | Small gaps, button padding (tight) |
| `2.5` | 10px | Form input vertical padding |
| `3` | 12px | Badge padding, sidebar item gap |
| `3.5` | 14px | Card padding-bottom for price area |
| `4` | 16px | Card internal padding, gap between elements |
| `5` | 20px | Sidebar padding, card padding |
| `6` | 24px | Page horizontal padding (mobile), section margins |
| `7` | 28px | Button horizontal padding |
| `8` | 32px | Section margin-bottom, horizontal padding (desktop) |
| `9` | 36px | Feature list bottom margin |
| `10` | 40px | Footer column gap |
| `12` | 48px | Section heading margin-bottom |
| `16` | 64px | Footer top padding |
| `20` | 80px | Section vertical padding (mobile) |
| `24` | 96px | CTA section vertical padding |
| `28` | 112px | Section vertical padding (desktop) |
| `32` | 128px | Promo section vertical padding |

### Container Max-Widths

| Class | Max-width | Usage |
|---|---|---|
| `max-w-md` | 448px | Search bar, body copy blocks |
| `max-w-lg` | 512px | CTA subtext paragraph |
| `max-w-5xl` | 1024px | CTA section, admin dashboard |
| `max-w-6xl` | 1152px | User area navbar |
| `max-w-7xl` | 1280px | Primary page container (landing, all main sections) |

### Section Vertical Padding Conventions

| Section | Mobile | Desktop |
|---|---|---|
| TrustedBy | `py-12` | same |
| Promo | `py-20` | `lg:py-32` |
| WorkspaceGrid | `py-20` | `lg:py-28` |
| Testimonials | `py-20` | `lg:py-28` |
| Owner | `py-20` | `lg:py-28` |
| CTA | `py-20` | `lg:py-24` |
| Footer | `pt-16 pb-8` | same |

---

## Layout & Grid

### Breakpoints (Tailwind defaults)

| Prefix | Min-width |
|---|---|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |

`xl` is present in Tailwind but not actively used in custom classes. The design is effectively `mobile → md → lg`.

### Grid Patterns

| Pattern | Classes | Usage |
|---|---|---|
| Two-column split | `grid-cols-1 lg:grid-cols-2` | Hero, Promo, Owner sections |
| Three-column cards | `grid-cols-1 md:grid-cols-3` | PG listings, Testimonials |
| Four-column footer | `grid-cols-1 sm:grid-cols-2 md:grid-cols-4` | Footer |
| Three-column stats | `grid-cols-3` | CTA stats row |

### Fixed Dimensions

| Element | Value |
|---|---|
| Landing navbar height | `h-[72px]` |
| User app navbar height | `h-[84px]` |
| Admin/Owner sidebar width | `w-56` (224px) |
| Hero section top offset | `pt-[72px]` (matches navbar) |

### Layout Patterns

- **Landing public pages**: full-width sections stacked vertically, each with `max-w-7xl mx-auto px-6` inner container.
- **Admin / Owner app**: `flex h-screen` shell — `w-56` fixed sidebar + `flex-1 overflow-y-auto` main area; sidebar is collapsible on mobile via a drawer overlay.
- **User app**: no sidebar; sticky top navbar + `max-w-6xl mx-auto px-4` content area.

---

## Borders & Radius

### Border Radius Scale

| Class | Value | Usage |
|---|---|---|
| `rounded` | 4px | Amenity tags, small chips |
| `rounded-lg` | 8px | Sidebar nav items, footer social icons, logo icon |
| `rounded-xl` | 12px | Toast, stat cards, alert boxes, newsletter input |
| `rounded-2xl` | 16px | PG listing cards (landing), floating stat cards, testimonial cards, search bar, newsletter send button |
| `rounded-3xl` | 24px | CTA section container, owner image frame |
| `rounded-[20px]` | 20px | PGCard (shared component), login/register card |
| `rounded-[32px]` | 32px | Hero portrait images |
| `rounded-[40px]` | 40px | Dark promo section container |
| `rounded-[10px]` | 10px | Form inputs, admin/login buttons, logo icon (admin) |
| `rounded-full` | 9999px | Pill CTA buttons, avatar circles, badge pills, nav badge counts |

### Border Styles

| Context | Classes |
|---|---|
| Dark surface dividers | `border-white/10` |
| Ghost button (dark bg) | `border-white/25` |
| Hero search bar / badge | `border-white/60` |
| Cards on warm bg | `border-warm-200` |
| Legacy form inputs | `border-[#e0e0e0]` |
| Sidebar borders | `border-slate-700` |
| PGCard | `border-[#e0e0e0]` |

---

## Shadows

### Custom Shadow Tokens

Defined in `tailwind.config.js → theme.extend.boxShadow`:

```js
card:    'rgba(0,0,0,0.08) 0px 4px 10px 0px'       // default card elevation
ambient: 'rgba(42,54,59,0.12) 0px 12px 32px 0px'   // elevated cards, floating elements
warm:    'rgba(245,132,124,0.25) 0px 8px 24px 0px'  // coral accent button glow
```

### Elevation Map

| Level | Shadow | Usage |
|---|---|---|
| 0 — flat | none | Section backgrounds |
| 1 — card | `shadow-card` | PG listing cards, PGCards, form cards |
| 2 — elevated | `shadow-ambient` | Floating stat cards, hero images, owner image, hover state |
| 3 — deep | `shadow-2xl` | Promo dark container |
| 4 — notification | `shadow-lg` (stock) | Toast notifications |
| Accent | `shadow-warm` | Coral primary button, owner-section CTA |

### Hover Elevation Pattern

Cards typically promote one level on hover:
```jsx
// Landing PG card
className="shadow-card hover:shadow-ambient hover:-translate-y-2 transition-all duration-300"

// PGCard (shared)
className="hover:shadow-md hover:border-[#d0d0d0] transition-all"
```

---

## Motion

### Custom Keyframes

```js
// tailwind.config.js
'slide-in': {
  from: { opacity: '0', transform: 'translateY(8px)' },
  to:   { opacity: '1', transform: 'translateY(0)' },
}

'fade-up': {
  from: { opacity: '0', transform: 'translateY(24px)' },
  to:   { opacity: '1', transform: 'translateY(0)' },
}
```

### Animation Utilities

| Utility | Definition | Usage |
|---|---|---|
| `animate-slide-in` | `slide-in 0.2s ease-out` | Mobile menu drawer, Toast notifications |
| `animate-fade-up` | `fade-up 0.6s ease-out both` | Hero left and right columns |

### Transition Utilities

| Pattern | Usage |
|---|---|
| `transition-colors` | All interactive links and buttons (default) |
| `transition-all duration-300` | Card hover (lift + shadow) |
| `transition-all` | Testimonial card shadow |
| `transition-transform duration-500` | Image zoom on card hover |

### Animation Stagger

The hero section uses an inline delay on the right column:
```jsx
style={{ animationDelay: '0.2s' }}
```

No systematic stagger system exists beyond this single instance.

### Reduced Motion

```css
/* index.css */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Scroll Behavior

```css
html { scroll-behavior: smooth; }
```

---

## Components

### Buttons

#### Primary — Coral (main CTA)
```jsx
className="bg-coral hover:bg-coral-hover text-white font-semibold px-6 py-3.5 rounded-full transition-colors text-sm"
// With glow: add shadow-warm
```

#### Primary — Coral Large (hero CTA)
```jsx
className="bg-coral hover:bg-coral-hover text-white font-semibold px-8 py-4 rounded-full transition-colors text-base shadow-warm"
```

#### Primary — Brand Yellow (admin/login)
```jsx
className="w-full bg-brand hover:bg-brand-light disabled:bg-[#e0e0e0] disabled:text-[#6c757d] text-black font-semibold py-2.5 rounded-[10px] transition-colors text-sm h-[42px]"
```

#### Primary — Dark (search)
```jsx
className="bg-charcoal hover:bg-charcoal-dark text-white font-semibold px-8 py-4 transition-colors text-sm"
// No border-radius — attaches to search bar container's overflow-hidden
```

#### Secondary — White on dark
```jsx
className="bg-white hover:bg-warm-50 text-charcoal font-semibold px-7 py-3.5 rounded-full transition-colors text-sm"
```

#### Ghost — Dark border
```jsx
className="border border-charcoal/25 text-charcoal hover:border-charcoal/50 font-semibold px-6 py-3.5 rounded-full transition-colors text-sm"
```

#### Ghost — White on dark
```jsx
className="border border-white/25 text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-full transition-colors text-base"
```

#### Text link (inline accent)
```jsx
className="text-coral text-sm font-semibold hover:underline flex items-center gap-1.5"
```

#### Icon button (footer social)
```jsx
className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
```

#### Icon button (newsletter send)
```jsx
className="w-10 h-10 bg-coral hover:bg-coral-hover rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
```

---

### Cards

#### PG Listing Card (Landing)
```jsx
className="group bg-white rounded-2xl overflow-hidden hover:-translate-y-2 transition-all duration-300 shadow-card hover:shadow-ambient block"
// Image: h-52, Body: p-5
```

#### PGCard (Shared component)
```jsx
className="group block bg-white rounded-[20px] border border-[#e0e0e0] overflow-hidden hover:shadow-md hover:border-[#d0d0d0] transition-all"
style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 4px 10px 0px' }}
// Image: h-44, Body: p-4
```

#### Testimonial Card
```jsx
className="bg-warm-50 rounded-2xl p-6 border border-warm-200 hover:shadow-ambient transition-all flex flex-col"
```

#### Floating Info Card (Hero stats)
```jsx
className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-ambient border border-white z-10 flex items-center gap-3"
```

#### Auth / Form Card
```jsx
className="bg-white rounded-[20px] border border-[#e0e0e0] p-8 w-full max-w-md"
style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 4px 10px 0px' }}
```

#### Admin Stat Card
```jsx
// color prop maps to one of: blue | yellow | green | red | purple
className={`rounded-xl border p-5 ${colorClass}`}
// e.g. blue: 'bg-action-50 border-action-100 text-action'
```

---

### Badges & Tags

#### Section Eyebrow Label
```jsx
className="text-xs font-bold text-coral uppercase tracking-widest mb-3"
// Used above every major section H2
```

#### Verified Badge
```jsx
className="inline-flex items-center gap-1 text-xs bg-green-600 text-white rounded-full px-2 py-0.5 font-semibold shadow-sm"
```

#### Available / Status Pill
```jsx
// Available (coral)
className="text-xs bg-coral/10 text-coral font-semibold px-2.5 py-1 rounded-full"

// Full (red)
className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium"

// Beds left (blue)
className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium"
```

#### Food Type Pill
```jsx
// Veg:     'bg-green-100 text-green-700'
// Non-veg: 'bg-red-100 text-red-700'
// Both:    'bg-amber-100 text-amber-700'
className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}
```

#### Amenity Tag
```jsx
className="text-xs bg-gray-100 text-[#6c757d] rounded px-1.5 py-0.5 capitalize"
```

#### Gender Badge
```jsx
className="text-xs bg-white/90 text-[#222121] border border-[#e0e0e0] rounded-full px-2 py-0.5 capitalize font-medium"
```

#### Rating Badge (card overlay)
```jsx
className="bg-white/90 backdrop-blur-sm text-charcoal text-xs font-semibold px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-sm"
```

#### Nav Count Badge (sidebar)
```jsx
className="bg-action text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center"
```

#### Hero Trust Badge
```jsx
className="inline-flex items-center gap-2 bg-white/50 border border-white/60 text-charcoal text-xs font-semibold px-3.5 py-1.5 rounded-full"
```

---

### Form Elements

#### Text / Email / Password Input
```jsx
className="w-full border border-[#e0e0e0] rounded-[10px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action focus:border-action bg-white h-[42px]"
```

#### Search Bar Input (borderless, inside container)
```jsx
className="flex-1 outline-none text-sm text-charcoal placeholder:text-charcoal/40 bg-transparent"
```

#### Newsletter Input (dark surface)
```jsx
className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-coral/50 transition-colors min-w-0"
```

#### Form Label
```jsx
className="block text-sm font-medium text-[#222121] mb-2"
```

#### Error Message
```jsx
className="bg-red-50 border border-[#f44336]/30 text-[#f44336] px-4 py-3 rounded-[10px] text-sm"
```

---

### Navigation

#### Landing Navbar (fixed, dark)
```jsx
className="fixed inset-x-0 top-0 z-50 bg-[#0C1A1E]/90 backdrop-blur-xl border-b border-white/10"
// Height: h-[72px], Container: max-w-7xl mx-auto px-6
// Nav links: text-white/70 hover:text-white text-sm font-medium transition-colors
```

#### User App Navbar (sticky, light)
```jsx
className="bg-white border-b border-[#e0e0e0] sticky top-0 z-10"
style={{ boxShadow: 'rgba(33,37,41,0.05) 0px 2px 8px' }}
// Height: h-[84px], Container: max-w-6xl mx-auto px-4
```

#### Admin/Owner Sidebar
```jsx
className="w-56 flex-shrink-0 bg-slate-900 flex flex-col h-screen"
// Active item:   bg-action text-white
// Inactive item: text-slate-400 hover:text-white hover:bg-slate-800
// Item shape:    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
```

---

### Toast Notifications

```jsx
// Container
className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none"

// Individual toast
className="pointer-events-auto flex items-start gap-3 bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 min-w-[260px] max-w-sm animate-slide-in"
// Text: text-sm text-gray-700
// Icons: green-500 (success), red-500 (error), blue-500 (info)
// Duration: 3500ms auto-dismiss
```

---

## Icons & Assets

### Icon System

All icons are custom inline SVGs — no external icon library.

| Property | Value |
|---|---|
| ViewBox | `0 0 24 24` |
| Default style | `fill="none" stroke="currentColor"` |
| Stroke caps | `strokeLinecap="round" strokeLinejoin="round"` |
| Default stroke width | `2` |
| Sidebar icons | `1.8` |
| Emphasis check | `2.5` |

**Filled exceptions** (use `fill="currentColor"`, no stroke):
- `StarIcon` — star rating
- `ShieldIcon` (PGCard) — verified badge
- `MapPinIcon` (PGCard) — map link

### Icon Sizes

| Class | px | Usage |
|---|---|---|
| `w-3 h-3` | 12px | Inline micro icons (map pin, star in badge) |
| `w-3.5 h-3.5` | 14px | Verified shield in PGCard |
| `w-4 h-4` | 16px | Most UI icons (arrows, check, search, location, send) |
| `w-5 h-5` | 20px | Sidebar nav icons, shield-check in floating card |
| `w-6 h-6` | 24px | Login page logo icon |

### Logo

The Nest Stay logo is a house SVG icon inside a colored rounded square, paired with the wordmark "Nest Stay":

```jsx
// Landing / footer (coral)
<div className="w-8 h-8 bg-coral rounded-lg flex items-center justify-center">
  <HouseIcon className="w-4 h-4 text-white" />
</div>
<span className="text-white font-bold text-lg tracking-tight">Nest Stay</span>

// Admin sidebar (brand yellow)
<div className="w-7 h-7 bg-brand rounded-[10px] flex items-center justify-center">
  // Uses ShieldCheck icon instead of House
</div>
```

### Images

- All images in the landing page use `picsum.photos` placeholder seeds.
- Real PG images are served from whatever URL is in `pg.images[0]`.
- Fallback: `https://placehold.co/400x220/e2e8f0/94a3b8?text=No+Image`
- All images use `object-cover` within fixed-height containers.
- Hero portrait images use `rounded-[32px]` with `border-4 border-white/50`.

---

## Tooling

| Concern | Choice |
|---|---|
| CSS framework | Tailwind CSS v3 |
| Component library | None — all hand-crafted JSX |
| CSS methodology | Utility-first (Tailwind classes inline in JSX) |
| CSS-in-JS | None |
| CSS Modules | None |
| Design tokens format | `tailwind.config.js` (`theme.extend`) |
| Icon library | Custom inline SVG components |
| Fonts | Google Fonts (Montserrat, `@import` in `index.css`) |
| Animation | Tailwind `keyframes` + `animation` in config |
| Build tool | Vite 5 |
| Framework | React 18 |

### Tailwind Config Location

```
frontend/tailwind.config.js
```

### Global CSS

```
frontend/src/index.css
```
— imports Google Fonts, Tailwind directives, smooth scroll, and reduced-motion media query. No custom utility classes defined here.

---

_Generated from codebase analysis of `frontend/tailwind.config.js`, `frontend/src/index.css`, `LandingPage.jsx`, `PGCard.jsx`, `Toast.jsx`, `LoginPage.jsx`, `DashboardPage.jsx`, `Sidebar.jsx`, `OwnerSidebar.jsx`, and `UserNavbar.jsx`._
