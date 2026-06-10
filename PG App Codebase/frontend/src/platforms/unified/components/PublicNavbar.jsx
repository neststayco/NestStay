import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function PublicNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-[#E5E7EB]/60"
      style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(251,249,248,0.95)' }}
    >
      <div className="flex justify-between items-center w-full px-6 lg:px-16 max-w-[1280px] mx-auto h-14">
        <Link to="/">
          <img src="/logo.png" alt="Nest Stay" className="h-9 w-auto" />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/register"
            className="bg-[#e98a76] text-white px-4 py-2 rounded-full text-xs font-semibold hover:opacity-90 active:scale-95 transition-all"
          >
            Register
          </Link>
          <button
            className="sm:hidden text-black p-2.5 rounded-lg hover:bg-[#f0eded] transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-[20px]">{open ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-[#fbf9f8] border-t border-[#E5E7EB] px-6 py-4 shadow-lg space-y-1">
          <Link to="/register" className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>Register</Link>
          <Link to="/" className="block text-sm py-2.5 text-[#434849]" onClick={() => setOpen(false)}>Home</Link>
        </div>
      )}
    </nav>
  )
}
