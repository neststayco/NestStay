import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'

export default function Navbar() {
  const { user, token, logout, isAdmitted } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const loginHref = `/login?next=${encodeURIComponent(location.pathname)}`

  return (
    <nav className="bg-white border-b border-[#e0e0e0] sticky top-0 z-10" style={{ boxShadow: 'rgba(33,37,41,0.05) 0px 2px 8px' }}>
      <div className="max-w-6xl mx-auto px-4 h-[84px] flex items-center justify-between">
        <Link to={isAdmitted ? '/my-pg' : '/'}>
          <img src="/logo.png" alt="Nest Stay" className="h-14 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          {token ? (
            <>
              {isAdmitted && (
                <Link to="/my-pg" className="text-sm text-[#6c757d] hover:text-action font-medium hidden sm:block transition-colors">
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
            </>
          ) : (
            <>
              <Link to={loginHref} className="text-sm text-[#6c757d] hover:text-[#222121] font-medium transition-colors">
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm bg-brand hover:bg-brand-light text-black font-semibold px-4 py-1.5 rounded-[10px] transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
