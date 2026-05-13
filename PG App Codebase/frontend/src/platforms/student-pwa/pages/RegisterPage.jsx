import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'
import { register } from '@shared/api/auth'

const inputCls = 'w-full border border-[#e0e0e0] rounded-[10px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action focus:border-action bg-white h-[42px]'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const res = await register(name, email, password)
      authLogin(res.token, res.data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4">
      <div className="bg-white rounded-[20px] border border-[#e0e0e0] p-8 w-full max-w-md" style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 4px 10px 0px' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#222121]">Create account</h1>
          <p className="text-[#6c757d] text-sm mt-1">Join Nest Stay to discover and review PGs</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-[#f44336]/30 text-[#f44336] px-4 py-3 rounded-[10px] mb-5 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#222121] mb-2">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Rahul Sharma"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222121] mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
              required
              placeholder="Min. 6 characters"
              className={inputCls}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-light disabled:bg-[#e0e0e0] disabled:text-[#6c757d] text-black font-semibold py-2.5 rounded-[10px] transition-colors text-sm h-[42px]"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-center mt-5 text-[#6c757d]">
          Already have an account?{' '}
          <Link to="/login" className="text-action hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
