import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'

function SvgIcon({ children }) {
  return (
    <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {children}
    </svg>
  )
}

const ICONS = {
  grid: (
    <SvgIcon>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </SvgIcon>
  ),
  clipboard: (
    <SvgIcon>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </SvgIcon>
  ),
  alert: (
    <SvgIcon>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </SvgIcon>
  ),
  home: (
    <SvgIcon>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} points="9 22 9 12 15 12 15 22" />
    </SvgIcon>
  ),
  user: (
    <SvgIcon>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </SvgIcon>
  ),
  users: (
    <SvgIcon>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0zM3 7a3 3 0 116 0 3 3 0 01-6 0z" />
    </SvgIcon>
  ),
  chat: (
    <SvgIcon>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </SvgIcon>
  ),
  logout: (
    <SvgIcon>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </SvgIcon>
  ),
}

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: 'grid', exact: true },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/admin/residency', label: 'Admissions Queue', icon: 'clipboard' },
      { to: '/admin/complaints', label: 'Complaints', icon: 'alert' },
    ],
  },
  {
    label: 'Property Management',
    items: [
      { to: '/admin/pgs', label: 'PG Listings', icon: 'home' },
      { to: '/admin/owners', label: 'PG Owners', icon: 'user' },
      { to: '/admin/onboarding-review', label: 'Listing Review', icon: 'clipboard' },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/admin/users', label: 'Users', icon: 'users' },
    ],
  },
  {
    label: 'Content Moderation',
    items: [
      { to: '/admin/testimonials', label: 'Testimonials', icon: 'chat' },
    ],
  },
]

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function isActive(item) {
    if (item.matchFn) return item.matchFn(location.pathname, location.search)
    if (item.exact) return location.pathname === item.to
    return location.pathname.startsWith(item.to)
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'A'

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col h-screen" style={{ backgroundColor: '#101e22' }}>
      {/* Brand header */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Nest Stay" className="h-9 w-9 rounded-lg object-cover flex-shrink-0" />
            <div>
              <p className="text-white text-sm font-bold leading-none">Nest Stay</p>
              <p className="text-[10px] mt-0.5 font-semibold uppercase tracking-widest" style={{ color: '#ffdbd0' }}>
                Platform Admin
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: '#bac9ce' }}
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p
              className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2"
              style={{ color: '#bac9ce', opacity: 0.5 }}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = isActive(item)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active ? 'bg-[#e98a76] text-white' : 'hover:bg-white/5'
                    }`}
                    style={{ color: active ? '#ffffff' : '#bac9ce' }}
                  >
                    <span style={{ color: active ? '#ffffff' : '#ffdbd0', opacity: active ? 1 : 0.7 }}>
                      {ICONS[item.icon]}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: '#ffdbd0', color: '#3a0b00' }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-[10px] truncate" style={{ color: '#bac9ce' }}>{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
          style={{ color: '#bac9ce' }}
        >
          {ICONS.logout}
          Sign out
        </button>
      </div>
    </aside>
  )
}
