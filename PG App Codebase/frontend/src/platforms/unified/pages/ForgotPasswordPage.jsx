import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPasswordInitiate, forgotPasswordVerify, resetPassword } from '@shared/api/auth'
import { normalizeError } from '@shared/api/client'
import OfflineBanner from '@shared/components/OfflineBanner'
import { useToast } from '@shared/components/Toast'
import { useOnline } from '@shared/hooks/useOnline'

const OTP_COOLDOWN_S = 60
const MIN_PASSWORD_LEN = 8

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

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1)

  // Step 1 — email
  const [email, setEmail]       = useState('')
  const [emailError, setEmailError] = useState('')
  const [step1Loading, setStep1Loading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef(null)

  // Step 2 — OTP
  const [otp, setOtp]           = useState('')
  const [otpError, setOtpError] = useState('')
  const [step2Loading, setStep2Loading] = useState(false)
  const [resetToken, setResetToken] = useState('')

  // Step 3 — new password
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError]   = useState('')
  const [step3Loading, setStep3Loading]   = useState(false)

  const [error, setError] = useState('')
  const toast = useToast()
  const navigate = useNavigate()
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

  function validateEmailVal(v) {
    if (!v.trim()) return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address.'
    return ''
  }

  async function handleSendOTP(e) {
    e.preventDefault()
    setError('')
    const err = validateEmailVal(email)
    if (err) { setEmailError(err); return }
    setEmailError('')
    setStep1Loading(true)
    try {
      await forgotPasswordInitiate(email.trim())
      startCooldown()
      setStep(2)
    } catch (apiErr) {
      const normalized = normalizeError(apiErr)
      if (normalized.code === 'RATE_LIMITED') {
        startCooldown()
        setError('Too many requests. Please wait before trying again.')
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
      await forgotPasswordInitiate(email.trim())
      startCooldown()
      toast('New OTP sent.', 'info')
    } catch (apiErr) {
      const normalized = normalizeError(apiErr)
      if (normalized.code === 'RATE_LIMITED') {
        startCooldown()
      }
      setError(normalized.message)
    } finally {
      setStep1Loading(false)
    }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault()
    setError('')
    if (!otp.trim() || !/^\d{6}$/.test(otp.trim())) {
      setOtpError('Enter the 6-digit OTP from your email.')
      return
    }
    setOtpError('')
    setStep2Loading(true)
    try {
      const res = await forgotPasswordVerify(email.trim(), otp.trim())
      setResetToken(res.resetToken)
      setStep(3)
    } catch (apiErr) {
      const normalized = normalizeError(apiErr)
      if (normalized.message?.toLowerCase().includes('invalid otp') ||
          normalized.message?.toLowerCase().includes('attempt')) {
        setOtpError(normalized.message)
      } else if (normalized.message?.toLowerCase().includes('expired')) {
        setOtpError('OTP expired. Request a new one below.')
      } else {
        setError(normalized.message)
      }
    } finally {
      setStep2Loading(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setError('')
    let hasErr = false
    if (!password) { setPasswordError('Password is required.'); hasErr = true }
    else if (password.length < MIN_PASSWORD_LEN) { setPasswordError(`Must be at least ${MIN_PASSWORD_LEN} characters.`); hasErr = true }
    else setPasswordError('')
    if (!confirm) { setConfirmError('Please confirm your password.'); hasErr = true }
    else if (password !== confirm) { setConfirmError('Passwords do not match.'); hasErr = true }
    else setConfirmError('')
    if (hasErr) return

    setStep3Loading(true)
    try {
      await resetPassword(resetToken, password)
      toast('Password reset successfully. Please sign in.', 'success')
      navigate('/login', { replace: true })
    } catch (apiErr) {
      const normalized = normalizeError(apiErr)
      if (normalized.status === 401) {
        setError('Reset link expired. Please restart the process.')
        setStep(1)
        setOtp('')
        setResetToken('')
      } else {
        setError(normalized.message)
      }
    } finally {
      setStep3Loading(false)
    }
  }

  const stepTitles = ['Reset your password', 'Enter verification code', 'Set new password']
  const stepSubtitles = [
    "Enter your email and we'll send a reset code.",
    `We sent a 6-digit code to ${email}`,
    'Choose a strong password for your account.',
  ]

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
              <h1 className="text-[28px] font-bold text-[#1b1c1c] leading-tight">{stepTitles[step - 1]}</h1>
              <p className="text-sm text-[#434849] mt-1">{stepSubtitles[step - 1]}</p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-1 mb-6">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? 'bg-[#e98a76]' : 'bg-[#E5E7EB]'}`}
                />
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
                {error === 'Too many requests. Please wait before trying again.' && resendCooldown > 0
                  ? `Too many requests. Please wait ${resendCooldown}s before trying again.`
                  : error}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleSendOTP} className="space-y-5" noValidate>
                <div>
                  <label className="block text-sm font-semibold text-[#1b1c1c] mb-2" htmlFor="fp-email">
                    Email address
                  </label>
                  <input
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(validateEmailVal(e.target.value)) }}
                    onBlur={(e) => setEmailError(validateEmailVal(e.target.value))}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={emailError ? inputErr : inputOk}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'fp-email-err' : undefined}
                  />
                  {emailError && (
                    <p id="fp-email-err" className="mt-1.5 text-xs text-red-600">{emailError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={step1Loading || resendCooldown > 0 || !isOnline}
                  className="w-full bg-[#e98a76] hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-white font-semibold py-3 rounded-xl transition-all text-sm"
                >
                  {step1Loading ? 'Sending…' : resendCooldown > 0 ? `Try again in ${resendCooldown}s` : 'Send reset code'}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-5" noValidate>
                <div>
                  <label className="block text-sm font-semibold text-[#1b1c1c] mb-2" htmlFor="fp-otp">
                    Verification code
                  </label>
                  <input
                    id="fp-otp"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); if (otpError) setOtpError('') }}
                    required
                    autoComplete="one-time-code"
                    placeholder="000000"
                    className={`${otpError ? inputErr : inputOk} text-center tracking-[0.3em] font-mono text-lg`}
                    aria-invalid={!!otpError}
                    aria-describedby={otpError ? 'fp-otp-err' : undefined}
                  />
                  {otpError && (
                    <p id="fp-otp-err" className="mt-1.5 text-xs text-red-600">{otpError}</p>
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
                        Resend code
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={step2Loading || !isOnline}
                  className="w-full bg-[#e98a76] hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-white font-semibold py-3 rounded-xl transition-all text-sm"
                >
                  {step2Loading ? 'Verifying…' : 'Verify code'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); setOtp(''); setOtpError('') }}
                  className="w-full text-sm text-[#73787a] hover:text-[#1b1c1c] transition-colors py-1"
                >
                  ← Change email address
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-5" noValidate>
                <div>
                  <label className="block text-sm font-semibold text-[#1b1c1c] mb-2" htmlFor="fp-password">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="fp-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError('') }}
                      required
                      autoComplete="new-password"
                      placeholder={`Min. ${MIN_PASSWORD_LEN} characters`}
                      className={`${passwordError ? inputErr : inputOk} pr-11`}
                      aria-invalid={!!passwordError}
                      aria-describedby={passwordError ? 'fp-password-err' : undefined}
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
                  {passwordError && (
                    <p id="fp-password-err" className="mt-1.5 text-xs text-red-600">{passwordError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1b1c1c] mb-2" htmlFor="fp-confirm">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      id="fp-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); if (confirmError) setConfirmError('') }}
                      required
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      className={`${confirmError ? inputErr : inputOk} pr-11`}
                      aria-invalid={!!confirmError}
                      aria-describedby={confirmError ? 'fp-confirm-err' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#73787a] hover:text-[#1b1c1c] transition-colors"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOffIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                  {confirmError && (
                    <p id="fp-confirm-err" className="mt-1.5 text-xs text-red-600">{confirmError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={step3Loading || !isOnline}
                  className="w-full bg-[#e98a76] hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-white font-semibold py-3 rounded-xl transition-all text-sm"
                >
                  {step3Loading ? 'Saving…' : 'Reset password'}
                </button>
              </form>
            )}

            <p className="text-sm text-center mt-6 text-[#434849]">
              Remembered it?{' '}
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
