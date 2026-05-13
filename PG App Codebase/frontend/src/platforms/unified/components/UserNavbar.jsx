import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'

export default function UserNavbar() {
  const { user, isAdmitted, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-[#e0e0e0] sticky top-0 z-10" style={{ boxShadow: 'rgba(33,37,41,0.05) 0px 2px 8px' }}>
      <div className="max-w-6xl mx-auto px-4 h-[84px] flex items-center justify-between">
        <Link to="/user" className="font-bold text-action text-lg tracking-tight">
          PG Finder
        </Link>
        <div className="flex items-center gap-3">
          {isAdmitted && (
            <Link
              to="/user/my-pg"
              className="text-sm text-[#6c757d] hover:text-action font-medium hidden sm:block transition-colors"
            >
              My PG
            </Link>
          )}
          <span className="text-sm text-[#6c757d] hidden sm:block">
            Hi, <span className="font-medium text-[#222121]">{user?.name?.split(' ')[0]}</span>
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-[#6c757d] hover:text-[#222121] border border-[#e0e0e0] rounded-[10px] px-3 py-1.5 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
