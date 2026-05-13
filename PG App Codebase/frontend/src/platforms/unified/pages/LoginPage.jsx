import { useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'
import { login } from '@shared/api/auth'

function roleRedirect(role) {
  if (role === 'admin') return '/admin'
  if (role === 'pg_owner') return '/pgowner'
  return '/user'
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(email, password)
      flushSync(() => authLogin(res.token, res.data))
      navigate(roleRedirect(res.data.role), { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4">
      <div className="bg-white rounded-[20px] border border-[#e0e0e0] p-8 w-full max-w-md" style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 4px 10px 0px' }}>
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand rounded-[10px] mb-3">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#222121]">Sign in to PG Finder</h1>
          <p className="text-[#6c757d] text-sm mt-1">Enter your credentials to continue</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-[#f44336]/30 text-[#f44336] px-4 py-3 rounded-[10px] mb-5 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#222121] mb-2">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full border border-[#e0e0e0] rounded-[10px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action focus:border-action bg-white h-[42px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222121] mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-[#e0e0e0] rounded-[10px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action focus:border-action bg-white h-[42px]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-light disabled:bg-[#e0e0e0] disabled:text-[#6c757d] text-black font-semibold py-2.5 rounded-[10px] transition-colors text-sm h-[42px]"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-center mt-5 text-[#6c757d]">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-action hover:underline font-medium">
            Create one
          </Link>
        </p>

        <p className="text-center text-sm text-[#6c757d] mt-3">
          <Link to="/" className="hover:text-[#222121] transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
