import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'
import { login } from '@shared/api/auth'
import { getMyAdmission } from '@shared/api/admissions'

const inputCls = 'w-full border border-[#e0e0e0] rounded-[10px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action focus:border-action bg-white h-[42px]'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: authLogin, setCurrentAdmission } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      const res = await login(email, password)
      authLogin(res.token, res.data)
      let isAdmitted = false
      try {
        const admRes = await getMyAdmission()
        setCurrentAdmission(admRes.data)
        isAdmitted = admRes.data?.status === 'admitted'
      } catch { /* guest */ }

      const next = searchParams.get('next')
      if (next) {
        navigate(next)
      } else {
        navigate(isAdmitted ? '/my-pg' : '/')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4">
      <div className="bg-white rounded-[20px] border border-[#e0e0e0] p-8 w-full max-w-md" style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 4px 10px 0px' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#222121]">Welcome back</h1>
          <p className="text-[#6c757d] text-sm mt-1">Sign in to your PG Finder account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-[#f44336]/30 text-[#f44336] px-4 py-3 rounded-[10px] mb-5 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#222121] mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#222121] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-light disabled:bg-[#e0e0e0] disabled:text-[#6c757d] text-black font-semibold py-2.5 rounded-[10px] transition-colors text-sm h-[42px]"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>

        <p className="text-sm text-center mt-5 text-[#6c757d]">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-action hover:underline font-medium">Create one</Link>
        </p>
      </div>
    </div>
  )
}
