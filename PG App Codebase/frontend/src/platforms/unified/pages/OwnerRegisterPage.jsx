import { useState, useRef, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'
import { registerOwnerInitiate, registerOwnerVerify } from '@shared/api/auth'
import { normalizeError } from '@shared/api/client'
import OfflineBanner from '@shared/components/OfflineBanner'
import { useToast } from '@shared/components/Toast'
import { useOnline } from '@shared/hooks/useOnline'

const MIN_PASSWORD_LEN = 8
const OTP_COOLDOWN_S = 60

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

export default function OwnerRegisterPage() {
  const [step, setStep] = useState(1)

  // Step 1
  const [email, setEmail]   = useState('')
  const [emailError, setEmailError] = useState('')
  const [step1Loading, setStep1Loading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef(null)

  // Step 2
  const [otp, setOtp]             = useState('')
  const [name, setName]           = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [fieldErrors, setFieldErrors]   = useState({})
  const [step2Loading, setStep2Loading] = useState(false)

  const [error, setError] = useState('')
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const isOnline = useOnline()

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }, [])

  function startCooldown() {
    setResendCooldown(OTP_COOLDOWN_S)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  function validateEmail(v) {
    if (!v.trim()) return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address.'
    return ''
  }

  async function handleSendOTP(e) {
    e.preventDefault()
    setError('')
    const err = validateEmail(email)
    if (err) { setEmailError(err); return }
    setEmailError('')
    setStep1Loading(true)
    try {
      await registerOwnerInitiate(email.trim())
      startCooldown()
      setStep(2)
    } catch (apiErr) {
      const normalized = normalizeError(apiErr)
      if (normalized.status === 409) {
        setEmailError('This email is already registered. Try signing in instead.')
      } else if (normalized.code === 'RATE_LIMITED') {
        startCooldown()
        setEmailError('Please wait before requesting another OTP.')
      } else {
        setError(normalized.message)
      }
    } finally {
      setStep1Loading(false)
    }
  }

  async function handleResendOTP() {
    if (resendCooldown > 0) return
    setError('')
    setStep1Loading(true)
    try {
      await registerOwnerInitiate(email.trim())
      startCooldown()
      toast('New OTP sent.', 'info')
    } catch (apiErr) {
      const normalized = normalizeError(apiErr)
      if (normalized.code === 'RATE_LIMITED') {
        startCooldown()
        setError('Please wait before requesting another OTP.')
      } else {
        setError(normalized.message)
      }
    } finally {
      setStep1Loading(false)
    }
  }

  function validateStep2() {
    const errs = {}
    if (!otp.trim() || !/^\d{6}$/.test(otp.trim())) errs.otp = 'Enter the 6-digit OTP from your email.'
    if (!name.trim()) errs.name = 'Full name is required.'
    if (!password) errs.password = 'Password is required.'
    else if (password.length < MIN_PASSWORD_LEN) errs.password = `Password must be at least ${MIN_PASSWORD_LEN} characters.`
    if (!confirm) errs.confirm = 'Please confirm your password.'
    else if (password !== confirm) errs.confirm = 'Passwords do not match.'
    return errs
  }

  async function handleVerify(e) {
    e.preventDefault()
    setError('')
    const errs = validateStep2()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    setStep2Loading(true)
    try {
      const res = await registerOwnerVerify(email.trim(), otp.trim(), name.trim(), password)
      toast('Account created! Welcome to Nest Stay.', 'success')
      flushSync(() => authLogin(res.accessToken, res.data))
      navigate('/pgowner/onboarding', { replace: true })
    } catch (apiErr) {
      const normalized = normalizeError(apiErr)
      if (normalized.message?.toLowerCase().includes('invalid otp') ||
          normalized.message?.toLowerCase().includes('attempt')) {
        setFieldErrors(prev => ({ ...prev, otp: normalized.message }))
      } else if (normalized.message?.toLowerCase().includes('expired')) {
        setFieldErrors(prev => ({ ...prev, otp: 'OTP expired. Request a new one below.' }))
      } else if (normalized.message?.toLowerCase().includes('already')) {
        setError('This email is already registered. Try signing in instead.')
      } else {
        setError(normalized.message)
      }
    } finally {
      setStep2Loading(false)
    }
  }

  return (
    <>
      <OfflineBanner />
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f8] px-4 py-12">
        <div className="w-full max-w-md">

          <div className="flex justify-center mb-8">
            <Link to="/">
              <img src="/logo.png" alt="Nest Stay" className="h-16 w-auto" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-card">
            <div className="mb-6">
              <h1 className="text-[28px] font-bold text-[#1b1c1c] leading-tight">List Your PG on Nest Stay</h1>
              <p className="text-sm text-[#434849] mt-1">
                {step === 1 ? 'Create your owner account to get started' : `We sent a 6-digit code to ${email}`}
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              <div className={`flex items-center gap-1.5 text-xs font-medium ${step >= 1 ? 'text-[#e98a76]' : 'text-[#73787a]'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 1 ? 'bg-[#e98a76] text-white' : 'bg-[#E5E7EB] text-[#73787a]'}`}>1</span>
                Email
              </div>
              <div className="flex-1 h-px bg-[#E5E7EB]" />
              <div className={`flex items-center gap-1.5 text-xs font-medium ${step >= 2 ? 'text-[#e98a76]' : 'text-[#73787a]'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 2 ? 'bg-[#e98a76] text-white' : 'bg-[#E5E7EB] text-[#73787a]'}`}>2</span>
                Verify &amp; set up
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
                {error}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSendOTP} className="space-y-5" noValidate>
                <div>
                  <label className="block text-sm font-semibold text-[#1b1c1c] mb-2" htmlFor="oreg-email">
                    Email address
                  </label>
                  <input
                    id="oreg-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(validateEmail(e.target.value)) }}
                    onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={emailError ? inputErr : inputOk}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'oreg-email-err' : undefined}
                  />
                  {emailError && (
                    <p id="oreg-email-err" className="mt-1.5 text-xs text-red-600">
                      {emailError === 'Please wait before requesting another OTP.' && resendCooldown > 0
                        ? `Please wait ${resendCooldown}s before requesting another OTP.`
                        : emailError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={step1Loading || resendCooldown > 0 || !isOnline}
                  className="w-full bg-[#e98a76] hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-white font-semibold py-3 rounded-xl transition-all text-sm"
                >
                  {step1Loading ? 'Sending OTP…' : resendCooldown > 0 ? `Try again in ${resendCooldown}s` : 'Continue'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-5" noValidate>
                {/* OTP */}
                <div>
                  <label className="block text-sm font-semibold text-[#1b1c1c] mb-2" htmlFor="oreg-otp">
                    Verification code
                  </label>
                  <input
                    id="oreg-otp"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); if (fieldErrors.otp) setFieldErrors(p => ({ ...p, otp: '' })) }}
                    required
                    autoComplete="one-time-code"
                    placeholder="000000"
                    className={`${fieldErrors.otp ? inputErr : inputOk} text-center tracking-[0.3em] font-mono text-lg`}
                    aria-invalid={!!fieldErrors.otp}
                    aria-describedby={fieldErrors.otp ? 'oreg-otp-err' : undefined}
                  />
                  {fieldErrors.otp && (
                    <p id="oreg-otp-err" className="mt-1.5 text-xs text-red-600">{fieldErrors.otp}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#73787a]">
                    <span>Didn&apos;t receive it?</span>
                    {resendCooldown > 0 ? (
                      <span className="text-[#e98a76] font-medium">Resend in {resendCooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={step1Loading || !isOnline}
                        className="text-[#e98a76] font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                {/* Full name */}
                <div>
                  <label className="block text-sm font-semibold text-[#1b1c1c] mb-2" htmlFor="oreg-name">
                    Full name
                  </label>
                  <input
                    id="oreg-name"
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (fieldErrors.name) setFieldErrors(p => ({ ...p, name: '' })) }}
                    required
                    autoComplete="name"
                    placeholder="Rahul Sharma"
                    className={fieldErrors.name ? inputErr : inputOk}
                    aria-invalid={!!fieldErrors.name}
                    aria-describedby={fieldErrors.name ? 'oreg-name-err' : undefined}
                  />
                  {fieldErrors.name && (
                    <p id="oreg-name-err" className="mt-1.5 text-xs text-red-600">{fieldErrors.name}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-[#1b1c1c] mb-2" htmlFor="oreg-password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="oreg-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: '' })) }}
                      required
                      autoComplete="new-password"
                      placeholder={`Min. ${MIN_PASSWORD_LEN} characters`}
                      className={`${fieldErrors.password ? inputErr : inputOk} pr-11`}
                      aria-invalid={!!fieldErrors.password}
                      aria-describedby={fieldErrors.password ? 'oreg-password-err' : undefined}
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
                    <p id="oreg-password-err" className="mt-1.5 text-xs text-red-600">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-semibold text-[#1b1c1c] mb-2" htmlFor="oreg-confirm">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="oreg-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); if (fieldErrors.confirm) setFieldErrors(p => ({ ...p, confirm: '' })) }}
                      required
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      className={`${fieldErrors.confirm ? inputErr : inputOk} pr-11`}
                      aria-invalid={!!fieldErrors.confirm}
                      aria-describedby={fieldErrors.confirm ? 'oreg-confirm-err' : undefined}
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
                    <p id="oreg-confirm-err" className="mt-1.5 text-xs text-red-600">{fieldErrors.confirm}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={step2Loading || !isOnline}
                  className="w-full bg-[#e98a76] hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-white font-semibold py-3 rounded-xl transition-all text-sm"
                >
                  {step2Loading ? 'Creating account…' : 'Create account'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); setFieldErrors({}); setOtp(''); setName(''); setPassword(''); setConfirm('') }}
                  className="w-full text-sm text-[#73787a] hover:text-[#1b1c1c] transition-colors py-1"
                >
                  ← Change email address
                </button>
              </form>
            )}

            <div className="mt-6 space-y-3 text-sm text-center text-[#434849]">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="text-[#e98a76] hover:opacity-80 font-semibold transition-opacity">
                  Sign in
                </Link>
              </p>
              <p>
                Looking to find a PG?{' '}
                <Link to="/register" className="text-[#e98a76] hover:opacity-80 font-semibold transition-opacity">
                  Register as student
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-[#73787a] mt-6">
            <Link to="/" className="hover:text-[#1b1c1c] transition-colors">← Back to home</Link>
          </p>
        </div>
      </div>
    </>
  )
}
