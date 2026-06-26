import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'

function ChevronDown() {
  return (
    <svg className="w-3.5 h-3.5 text-[#6c757d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

const navLink = ({ isActive }) =>
  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'text-[#e98a76] bg-[#fff3ee]'
      : 'text-[#6c757d] hover:text-[#222121] hover:bg-gray-50'
  }`

export default function UserNavbar() {
  const { user, isAdmitted, currentAdmission, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef(null)

  const hasPending = currentAdmission?.status === 'pending'
  const initial = user?.name?.[0]?.toUpperCase() || 'U'

  useEffect(() => {
    function handleOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav
      className="border-b border-[#E5E7EB] sticky top-0 z-30"
      style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(251,249,248,0.88)' }}
    >
      <div className="max-w-6xl mx-auto px-4 h-[72px] flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/user" className="flex-shrink-0">
          <img src="/logo2.png" alt="Nest Stay" className="h-12 w-auto" />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-1 flex-1 pl-4">
          <NavLink to="/user" end className={navLink}>
            Browse PGs
          </NavLink>

          {hasPending && (
            <NavLink to="/user" className={navLink}>
              <span className="relative inline-flex items-center gap-1.5">
                My Application
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              </span>
            </NavLink>
          )}

          <NavLink to="/user/saved" className={navLink}>
            Saved
          </NavLink>

          {isAdmitted && (
            <NavLink to="/user/my-pg" className={navLink}>
              My PG
            </NavLink>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg text-[#6c757d] hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          {/* Avatar pill + dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-[#E5E7EB] hover:border-[#c8c2bc] hover:shadow-sm transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-[#e98a76] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {initial}
              </div>
              <span className="hidden sm:block text-sm font-medium text-[#222121] max-w-[96px] truncate">
                {user?.name?.split(' ')[0]}
              </span>
              <ChevronDown />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-[#E5E7EB] py-1 z-50 animate-slide-in"
                style={{ boxShadow: 'rgba(0,0,0,0.10) 0px 12px 40px, rgba(0,0,0,0.04) 0px 2px 8px' }}
              >
                <div className="px-4 py-3 border-b border-[#f0f0f0]">
                  <p className="text-sm font-semibold text-[#222121] truncate">{user?.name}</p>
                  <p className="text-xs text-[#6c757d] truncate mt-0.5">{user?.email}</p>
                </div>
                <Link
                  to="/user/saved"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#6c757d] hover:text-[#222121] hover:bg-gray-50 transition-colors"
                >
                  Saved PGs
                </Link>
                {isAdmitted && (
                  <Link
                    to="/user/my-pg"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#6c757d] hover:text-[#222121] hover:bg-gray-50 transition-colors"
                  >
                    My PG
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-[#6c757d] hover:text-[#222121] hover:bg-gray-50 transition-colors"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav panel */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-[#f0f0f0] px-4 py-3 space-y-1 bg-white">
          <NavLink
            to="/user"
            end
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'text-[#e98a76] bg-[#fff3ee]' : 'text-[#6c757d]'
              }`
            }
          >
            Browse PGs
          </NavLink>

          {hasPending && (
            <Link
              to="/user"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6c757d]"
            >
              My Application
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            </Link>
          )}

          <NavLink
            to="/user/saved"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'text-[#e98a76] bg-[#fff3ee]' : 'text-[#6c757d]'
              }`
            }
          >
            Saved
          </NavLink>

          {isAdmitted && (
            <NavLink
              to="/user/my-pg"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'text-[#e98a76] bg-[#fff3ee]' : 'text-[#6c757d]'
                }`
              }
            >
              My PG
            </NavLink>
          )}

          <div className="pt-2 border-t border-[#f0f0f0] mt-1">
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#6c757d]"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
