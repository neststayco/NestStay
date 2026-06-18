import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'
import { login } from '@shared/api/auth'
import { normalizeError } from '@shared/api/client'
import { getMyAdmission } from '@shared/api/admissions'
import { normalizeAdmission } from '@shared/utils/normalizeAdmission'
import OfflineBanner from '@shared/components/OfflineBanner'
import { useOnline } from '@shared/hooks/useOnline'

const EyeOpenIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EyeOffIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
)

const inputOk  = 'w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#1b1c1c] placeholder:text-[#73787a] focus:outline-none focus:ring-2 focus:ring-[#e98a76]/40 focus:border-[#e98a76] bg-white transition-colors'
const inputErr = 'w-full border border-red-400 rounded-xl px-4 py-3 text-sm text-[#1b1c1c] placeholder:text-[#73787a] focus:outline-none focus:ring-2 focus:ring-red-300/50 focus:border-red-400 bg-white transition-colors'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0)
  const countdownRef = useRef(null)
  const { login: authLogin, setCurrentAdmission } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isOnline = useOnline()

  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current) }, [])

  function startCountdown(seconds) {
    setRateLimitSeconds(seconds)
    if (countdownRef.current) clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setRateLimitSeconds(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  function validateField(field, value) {
    setFieldErrors(prev => {
      const next = { ...prev }
      if (field === 'email') {
        if (!value.trim()) next.email = 'Email is required.'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) next.email = 'Enter a valid email address.'
        else delete next.email
      }
      if (field === 'password') {
        if (!value) next.password = 'Password is required.'
        else delete next.password
      }
      return next
    })
  }

  async function handleSubmit() {
    setError('')

    const errs = {}
    if (!email.trim()) errs.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email address.'
    if (!password) errs.password = 'Password is required.'
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setLoading(true)
    try {
      const res = await login(email.trim(), password)
      authLogin(res.token, res.data)

      let isAdmitted = false
      try {
        const admRes = await getMyAdmission()
        setCurrentAdmission(normalizeAdmission(admRes.data))
        isAdmitted = admRes.data?.status === 'admitted'
      } catch { /* guest — no active admission */ }

      const next = searchParams.get('next')
      navigate(next || (isAdmitted ? '/my-pg' : '/'))
    } catch (err) {
      const normalized = normalizeError(err)
      if (normalized.code === 'RATE_LIMITED') startCountdown(normalized.retryAfter || 900)
      setError(normalized.message)
    } finally {
      setLoading(false)
    }
  }

  const isRateLimited = rateLimitSeconds > 0

  return (
    <>
      <OfflineBanner />
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f8] px-4 py-12">
        <div className="w-full max-w-md">

          <div className="flex justify-center mb-8">
            <img src="/nest-stay-logo.png" alt="Nest Stay" className="h-10 w-auto" />
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-card">
            <div className="mb-6">
              <h1 className="text-[28px] font-bold text-[#1b1c1c] leading-tight">Welcome back</h1>
              <p className="text-sm text-[#434849] mt-1">Sign in to your Nest Stay account</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
                {isRateLimited
                  ? <span>{error} Retry in <strong>{rateLimitSeconds}s</strong>.</span>
                  : error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#1b1c1c] mb-2" htmlFor="spwa-login-email">
                  Email address
                </label>
                <input
                  id="spwa-login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) validateField('email', e.target.value) }}
                  onBlur={(e) => validateField('email', e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={fieldErrors.email ? inputErr : inputOk}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'spwa-login-email-err' : undefined}
                />
                {fieldErrors.email && (
                  <p id="spwa-login-email-err" className="mt-1.5 text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1b1c1c] mb-2" htmlFor="spwa-login-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="spwa-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) validateField('password', e.target.value) }}
                    onBlur={(e) => validateField('password', e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`${fieldErrors.password ? inputErr : inputOk} pr-11`}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? 'spwa-login-password-err' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#73787a] hover:text-[#1b1c1c] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeOpenIcon />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="spwa-login-password-err" className="mt-1.5 text-xs text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !isOnline || isRateLimited}
                className="w-full bg-[#e98a76] hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-white font-semibold py-3 rounded-xl transition-all text-sm"
              >
                {loading
                  ? 'Signing in…'
                  : isRateLimited
                    ? `Try again in ${rateLimitSeconds}s`
                    : 'Sign in'}
              </button>
            </div>

            <p className="text-sm text-center mt-6 text-[#434849]">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-[#e98a76] hover:opacity-80 font-semibold transition-opacity">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
