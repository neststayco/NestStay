import { useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'
import { register } from '@shared/api/auth'
import { normalizeError } from '@shared/api/client'
import OfflineBanner from '@shared/components/OfflineBanner'
import { useToast } from '@shared/components/Toast'
import { useOnline } from '@shared/hooks/useOnline'

function roleRedirect(role) {
  if (role === 'admin') return '/admin'
  if (role === 'pg_owner') return '/pgowner'
  return '/user'
}

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

const MIN_PASSWORD_LEN = 6

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const isOnline = useOnline()

  function validateField(field, value) {
    setFieldErrors(prev => {
      const next = { ...prev }
      if (field === 'name') {
        if (!value.trim()) next.name = 'Full name is required.'
        else delete next.name
      }
      if (field === 'email') {
        if (!value.trim()) next.email = 'Email is required.'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) next.email = 'Enter a valid email address.'
        else delete next.email
      }
      if (field === 'password') {
        if (!value) next.password = 'Password is required.'
        else if (value.length < MIN_PASSWORD_LEN) next.password = `Password must be at least ${MIN_PASSWORD_LEN} characters.`
        else delete next.password
        if (confirm) {
          if (value !== confirm) next.confirm = 'Passwords do not match.'
          else delete next.confirm
        }
      }
      if (field === 'confirm') {
        if (!value) next.confirm = 'Please confirm your password.'
        else if (value !== password) next.confirm = 'Passwords do not match.'
        else delete next.confirm
      }
      return next
    })
  }

  function mapApiError(message) {
    const lower = message.toLowerCase()
    if (lower.includes('already exists') || lower.includes('already registered')) {
      setFieldErrors(prev => ({ ...prev, email: 'This email is already registered. Try signing in instead.' }))
      return true
    }
    if (lower.includes('name')) {
      setFieldErrors(prev => ({ ...prev, name: 'Full name is required.' }))
      return true
    }
    return false
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const errs = {}
    if (!name.trim()) errs.name = 'Full name is required.'
    if (!email.trim()) errs.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email address.'
    if (!password) errs.password = 'Password is required.'
    else if (password.length < MIN_PASSWORD_LEN) errs.password = `Password must be at least ${MIN_PASSWORD_LEN} characters.`
    if (!confirm) errs.confirm = 'Please confirm your password.'
    else if (password !== confirm) errs.confirm = 'Passwords do not match.'
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setLoading(true)
    try {
      const res = await register(name.trim(), email.trim(), password)
      toast('Account created! Welcome to Nest Stay.', 'success')
      flushSync(() => authLogin(res.token, res.data))
      navigate(roleRedirect(res.data.role), { replace: true })
    } catch (err) {
      const normalized = normalizeError(err)
      if (!mapApiError(normalized.message)) setError(normalized.message)
    } finally {
      setLoading(false)
    }
  }

  const showCharCounter = password.length >= Math.floor(MIN_PASSWORD_LEN * 0.75) && !fieldErrors.password

  return (
    <>
      <OfflineBanner />
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f8] px-4 py-12">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link to="/">
              <img src="/nest-stay-logo.png" alt="Nest Stay" className="h-10 w-auto" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-card">
            <div className="mb-6">
              <h1 className="text-[28px] font-bold text-[#1b1c1c] leading-tight">Create your account</h1>
              <p className="text-sm text-[#434849] mt-1">Join Nest Stay to find your perfect PG</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Full name */}
              <div>
                <label className="block text-sm font-semibold text-[#1b1c1c] mb-2" htmlFor="reg-name">
                  Full name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (fieldErrors.name) validateField('name', e.target.value) }}
                  onBlur={(e) => validateField('name', e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Rahul Sharma"
                  className={fieldErrors.name ? inputErr : inputOk}
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? 'reg-name-err' : undefined}
                />
                {fieldErrors.name && (
                  <p id="reg-name-err" className="mt-1.5 text-xs text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-[#1b1c1c] mb-2" htmlFor="reg-email">
                  Email address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) validateField('email', e.target.value) }}
                  onBlur={(e) => validateField('email', e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={fieldErrors.email ? inputErr : inputOk}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'reg-email-err' : undefined}
                />
                {fieldErrors.email && (
                  <p id="reg-email-err" className="mt-1.5 text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-[#1b1c1c] mb-2" htmlFor="reg-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); validateField('password', e.target.value) }}
                    onBlur={(e) => validateField('password', e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder={`Min. ${MIN_PASSWORD_LEN} characters`}
                    className={`${fieldErrors.password ? inputErr : inputOk} pr-11`}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? 'reg-password-err' : undefined}
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
                {showCharCounter && (
                  <p className="mt-1.5 text-xs text-[#73787a]">{password.length} characters</p>
                )}
                {fieldErrors.password && (
                  <p id="reg-password-err" className="mt-1.5 text-xs text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-semibold text-[#1b1c1c] mb-2" htmlFor="reg-confirm">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="reg-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); if (fieldErrors.confirm) validateField('confirm', e.target.value) }}
                    onBlur={(e) => validateField('confirm', e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    className={`${fieldErrors.confirm ? inputErr : inputOk} pr-11`}
                    aria-invalid={!!fieldErrors.confirm}
                    aria-describedby={fieldErrors.confirm ? 'reg-confirm-err' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#73787a] hover:text-[#1b1c1c] transition-colors"
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirm ? <EyeOffIcon /> : <EyeOpenIcon />}
                  </button>
                </div>
                {fieldErrors.confirm && (
                  <p id="reg-confirm-err" className="mt-1.5 text-xs text-red-600">{fieldErrors.confirm}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isOnline}
                className="w-full bg-[#e98a76] hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-white font-semibold py-3 rounded-xl transition-all text-sm"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="text-sm text-center mt-6 text-[#434849]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#e98a76] hover:opacity-80 font-semibold transition-opacity">
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-center text-sm text-[#73787a] mt-6">
            <Link to="/" className="hover:text-[#1b1c1c] transition-colors">← Back to home</Link>
          </p>
        </div>
      </div>
    </>
  )
}
