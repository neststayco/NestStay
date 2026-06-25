import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'
import { useToast } from '@shared/components/Toast'
import {
  getMyOnboardingPG,
  createOnboardingPG,
  updateOnboardingPG,
  submitOnboardingPG,
} from '@shared/api/onboarding'
import { normalizeError } from '@shared/api/client'

const WIZARD_STEPS = [
  { n: 1, label: 'Basic Info' },
  { n: 2, label: 'Location' },
  { n: 3, label: 'Pricing' },
  { n: 4, label: 'Rooms' },
  { n: 5, label: 'Amenities' },
  { n: 6, label: 'Review' },
]

const AMENITY_OPTIONS = [
  'WiFi', 'AC', 'Geyser', 'Laundry', 'Meals', 'Parking',
  'CCTV', 'Power Backup', 'Hot Water', 'Kitchen', 'TV', 'Gym', 'Housekeeping',
]

const ROOM_TYPE_OPTIONS = ['Single', 'Double', 'Triple', 'Dormitory']

const GENDER_OPTIONS = ['male', 'female', 'other']

const inputOk = 'w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e98a76]/40 focus:border-[#e98a76] bg-white'
const inputErr = 'w-full border border-red-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300/50 focus:border-red-400 bg-white'

function FieldError({ msg }) {
  if (!msg) return null
  return <p className="mt-1.5 text-xs text-red-600">{msg}</p>
}

function SectionLabel({ children, required }) {
  return (
    <label className="block text-sm font-semibold text-[#1b1c1c] mb-2">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

// ─── Step 1: Basic Info ───────────────────────────────────────────────────────

function Step1({ name, setName, description, setDescription, errors, clearError }) {
  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-[#1b1c1c]">Basic Information</h2>
        <p className="text-sm text-[#73787a] mt-0.5">Tell us about your PG accommodation</p>
      </div>
      <div>
        <SectionLabel required>PG Name</SectionLabel>
        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); clearError('name') }}
          placeholder="e.g. Sunrise Boys PG"
          className={errors.name ? inputErr : inputOk}
        />
        <FieldError msg={errors.name} />
      </div>
      <div>
        <SectionLabel required>Description</SectionLabel>
        <textarea
          rows={5}
          value={description}
          onChange={e => { setDescription(e.target.value); clearError('description') }}
          placeholder="Describe your PG — location highlights, rules, what makes it unique…"
          className={`${errors.description ? inputErr : inputOk} resize-none`}
        />
        <div className="flex justify-between mt-1">
          <FieldError msg={errors.description} />
          <span className={`text-xs ml-auto ${description.trim().length >= 20 ? 'text-[#73787a]' : 'text-amber-600'}`}>
            {description.trim().length} / 20 min
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Location ─────────────────────────────────────────────────────────

function Step2({ city, setCity, area, setArea, state, setState, address, setAddress, errors, clearError }) {
  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-[#1b1c1c]">Location Details</h2>
        <p className="text-sm text-[#73787a] mt-0.5">Where is your PG located?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <SectionLabel required>City</SectionLabel>
          <input
            type="text"
            value={city}
            onChange={e => { setCity(e.target.value); clearError('city') }}
            placeholder="e.g. Pune"
            className={errors.city ? inputErr : inputOk}
          />
          <FieldError msg={errors.city} />
        </div>
        <div>
          <SectionLabel required>Area / Locality</SectionLabel>
          <input
            type="text"
            value={area}
            onChange={e => { setArea(e.target.value); clearError('area') }}
            placeholder="e.g. Hinjewadi"
            className={errors.area ? inputErr : inputOk}
          />
          <FieldError msg={errors.area} />
        </div>
      </div>
      <div>
        <SectionLabel required>State</SectionLabel>
        <input
          type="text"
          value={state}
          onChange={e => { setState(e.target.value); clearError('state') }}
          placeholder="e.g. Maharashtra"
          className={errors.state ? inputErr : inputOk}
        />
        <FieldError msg={errors.state} />
      </div>
      <div>
        <SectionLabel required>Full Address</SectionLabel>
        <textarea
          rows={3}
          value={address}
          onChange={e => { setAddress(e.target.value); clearError('address') }}
          placeholder="Plot no., Street, Landmark…"
          className={`${errors.address ? inputErr : inputOk} resize-none`}
        />
        <FieldError msg={errors.address} />
      </div>
    </div>
  )
}

// ─── Step 3: Pricing ──────────────────────────────────────────────────────────

function Step3({ rent, setRent, deposit, setDeposit, maintenance, setMaintenance, errors, clearError }) {
  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-[#1b1c1c]">Pricing</h2>
        <p className="text-sm text-[#73787a] mt-0.5">Set the monthly charges for your PG</p>
      </div>
      <div>
        <SectionLabel required>Monthly Rent (₹)</SectionLabel>
        <input
          type="number"
          min="1"
          value={rent}
          onChange={e => { setRent(e.target.value); clearError('rent') }}
          placeholder="e.g. 8000"
          className={errors.rent ? inputErr : inputOk}
        />
        <FieldError msg={errors.rent} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <SectionLabel>Security Deposit (₹)</SectionLabel>
          <input
            type="number"
            min="0"
            value={deposit}
            onChange={e => setDeposit(e.target.value)}
            placeholder="e.g. 16000"
            className={inputOk}
          />
        </div>
        <div>
          <SectionLabel>Maintenance (₹/mo)</SectionLabel>
          <input
            type="number"
            min="0"
            value={maintenance}
            onChange={e => setMaintenance(e.target.value)}
            placeholder="e.g. 500"
            className={inputOk}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: Capacity & Rooms ─────────────────────────────────────────────────

function Step4({ totalCapacity, setTotalCapacity, roomTypes, toggleRoomType, gender, setGender, errors, clearError }) {
  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-[#1b1c1c]">Capacity &amp; Rooms</h2>
        <p className="text-sm text-[#73787a] mt-0.5">How many residents can your PG accommodate?</p>
      </div>
      <div>
        <SectionLabel required>Total Capacity (beds)</SectionLabel>
        <input
          type="number"
          min="1"
          step="1"
          value={totalCapacity}
          onChange={e => { setTotalCapacity(e.target.value); clearError('totalCapacity') }}
          placeholder="e.g. 20"
          className={`${errors.totalCapacity ? inputErr : inputOk} max-w-xs`}
        />
        <FieldError msg={errors.totalCapacity} />
      </div>
      <div>
        <SectionLabel>Room Types</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {ROOM_TYPE_OPTIONS.map(rt => (
            <button
              key={rt}
              type="button"
              onClick={() => toggleRoomType(rt)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                roomTypes.includes(rt)
                  ? 'bg-[#1b1c1c] border-[#1b1c1c] text-white'
                  : 'bg-[#f6f3f2] border-[#E5E7EB] text-[#434849] hover:border-[#1b1c1c]'
              }`}
            >
              {rt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>Gender</SectionLabel>
        <div className="flex gap-2 flex-wrap">
          {GENDER_OPTIONS.map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                gender === g
                  ? 'bg-[#e98a76] border-[#e98a76] text-white'
                  : 'bg-[#f6f3f2] border-[#E5E7EB] text-[#434849] hover:border-[#e98a76]'
              }`}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 5: Amenities ────────────────────────────────────────────────────────

function Step5({ amenities, toggleAmenity }) {
  const [customInput, setCustomInput] = useState('')
  const inputRef = useRef(null)

  const customAmenities = amenities.filter(a => !AMENITY_OPTIONS.includes(a))

  function handleAddCustom() {
    const val = customInput.trim()
    if (!val) return
    const normalized = val.charAt(0).toUpperCase() + val.slice(1)
    if (amenities.map(a => a.toLowerCase()).includes(normalized.toLowerCase())) {
      setCustomInput('')
      return
    }
    toggleAmenity(normalized)
    setCustomInput('')
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-[#1b1c1c]">Amenities</h2>
        <p className="text-sm text-[#73787a] mt-0.5">Select from common amenities or add your own</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {AMENITY_OPTIONS.map(a => (
          <button
            key={a}
            type="button"
            onClick={() => toggleAmenity(a)}
            className={`px-3 py-2 rounded-full text-xs font-semibold border transition-all ${
              amenities.includes(a)
                ? 'bg-[#1b1c1c] border-[#1b1c1c] text-white'
                : 'bg-[#f6f3f2] border-[#E5E7EB] text-[#434849] hover:border-[#1b1c1c] hover:text-[#1b1c1c]'
            }`}
          >
            {a}
          </button>
        ))}
        {customAmenities.map(a => (
          <span
            key={a}
            className="inline-flex items-center gap-1.5 pl-3 pr-2 py-2 rounded-full text-xs font-semibold bg-[#1b1c1c] border border-[#1b1c1c] text-white"
          >
            {a}
            <button
              type="button"
              onClick={() => toggleAmenity(a)}
              className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
              aria-label={`Remove ${a}`}
            >
              <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold text-[#1b1c1c] mb-2">Custom amenity</p>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustom() } }}
            placeholder="e.g. Rooftop Access, Study Room…"
            maxLength={40}
            className={`${inputOk} flex-1`}
          />
          <button
            type="button"
            onClick={handleAddCustom}
            disabled={!customInput.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#f6f3f2] border border-[#E5E7EB] text-[#434849] hover:border-[#1b1c1c] hover:text-[#1b1c1c] disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
          >
            + Add
          </button>
        </div>
      </div>

      {amenities.length > 0 && (
        <p className="text-xs text-[#73787a]">{amenities.length} amenit{amenities.length === 1 ? 'y' : 'ies'} selected</p>
      )}
    </div>
  )
}

// ─── Step 6: Review & Submit ──────────────────────────────────────────────────

function Step6({ name, description, city, area, state, address, rent, deposit, maintenance, totalCapacity, roomTypes, gender, amenities }) {
  function Row({ label, value }) {
    return (
      <div className="flex justify-between py-2.5 border-b border-[#f0f0f0] last:border-0">
        <span className="text-xs font-semibold text-[#73787a] uppercase tracking-wide">{label}</span>
        <span className="text-sm text-[#1b1c1c] font-medium text-right max-w-[60%]">{value || '—'}</span>
      </div>
    )
  }

  const location = [area, city, state].filter(Boolean).join(', ')

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-[#1b1c1c]">Review Your Listing</h2>
        <p className="text-sm text-[#73787a] mt-0.5">Check everything before submitting for review</p>
      </div>

      <div className="bg-[#fbf9f8] rounded-xl border border-[#E5E7EB] p-4 space-y-0">
        <Row label="PG Name" value={name} />
        <Row label="Description" value={description ? description.trim().slice(0, 100) + (description.trim().length > 100 ? '…' : '') : ''} />
        <Row label="Location" value={location || '—'} />
        <Row label="Address" value={address} />
        <Row label="Monthly Rent" value={rent ? `₹${Number(rent).toLocaleString('en-IN')}` : ''} />
        <Row label="Deposit" value={deposit ? `₹${Number(deposit).toLocaleString('en-IN')}` : ''} />
        <Row label="Maintenance" value={maintenance ? `₹${Number(maintenance).toLocaleString('en-IN')}/mo` : ''} />
        <Row label="Total Capacity" value={totalCapacity ? `${totalCapacity} beds` : ''} />
        <Row label="Room Types" value={roomTypes.length ? roomTypes.join(', ') : ''} />
        <Row label="Gender" value={gender} />
        <Row label="Amenities" value={amenities.length ? amenities.join(', ') : 'None selected'} />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        You&apos;re one step away from reaching students looking for their next stay.
        We&apos;ll review your listing and publish it soon.
      </div>
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ currentStep }) {
  return (
    <div className="max-w-2xl mx-auto mb-8 px-2">
      <div className="flex items-center">
        {WIZARD_STEPS.map((s, i) => (
          <div key={s.n} className={`flex items-center ${i < WIZARD_STEPS.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex flex-col items-center">
              <div className={`transition-all ${
                currentStep === s.n
                  ? 'w-2.5 h-2.5 rounded-full bg-[#e98a76] ring-4 ring-[#e98a76]/20'
                  : currentStep > s.n
                  ? 'w-2 h-2 rounded-full bg-[#e98a76]'
                  : 'w-2 h-2 rounded-full bg-[#E5E7EB]'
              }`} />
              <span className={`text-[10px] mt-1.5 font-semibold whitespace-nowrap hidden sm:block transition-colors ${
                currentStep === s.n ? 'text-[#e98a76]' : currentStep > s.n ? 'text-[#e98a76]/60' : 'text-[#B0B5B7]'
              }`}>
                {s.label}
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 sm:mb-0 transition-all ${
                currentStep > s.n ? 'bg-[#e98a76]' : 'bg-[#E5E7EB]'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { updateUser } = useAuth()

  const [step, setStep] = useState(1)
  const [pgId, setPgId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  // Step 1
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  // Step 2
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')
  const [state, setState] = useState('')
  const [address, setAddress] = useState('')

  // Step 3
  const [rent, setRent] = useState('')
  const [deposit, setDeposit] = useState('')
  const [maintenance, setMaintenance] = useState('')

  // Step 4
  const [totalCapacity, setTotalCapacity] = useState('')
  const [roomTypes, setRoomTypes] = useState([])
  const [gender, setGender] = useState('other')

  // Step 5
  const [amenities, setAmenities] = useState([])

  useEffect(() => {
    getMyOnboardingPG()
      .then(res => {
        const pg = res?.data
        if (pg?.verificationStatus === 'pending_review') {
          updateUser({ onboardingStatus: 'pending_review' })
          navigate('/pgowner/waiting-approval', { replace: true })
          return
        }
        if (pg?.verificationStatus === 'approved') {
          updateUser({ onboardingStatus: 'approved' })
          navigate('/pgowner', { replace: true })
          return
        }
        if (pg?._id) {
          setPgId(pg._id)
          setName(pg.name || '')
          setDescription(pg.description || '')
          setCity(pg.location?.city || '')
          setArea(pg.location?.area || '')
          setState(pg.location?.state || '')
          setAddress(pg.location?.address || '')
          setRent(pg.pricing?.rent != null ? String(pg.pricing.rent) : '')
          setDeposit(pg.pricing?.deposit != null ? String(pg.pricing.deposit) : '')
          setMaintenance(pg.pricing?.maintenance != null ? String(pg.pricing.maintenance) : '')
          setTotalCapacity(pg.accommodation?.totalCapacity != null ? String(pg.accommodation.totalCapacity) : '')
          setRoomTypes(pg.accommodation?.roomTypes || [])
          setGender(pg.gender || 'other')
          setAmenities(pg.amenities || [])
        }
      })
      .catch(err => {
        const normalized = normalizeError(err)
        if (normalized.status !== 404) {
          toast('Failed to load draft. Starting fresh.', 'error')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function clearError(field) {
    if (errors[field]) setErrors(prev => { const next = { ...prev }; delete next[field]; return next })
  }

  function toggleAmenity(amenity) {
    setAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity])
  }

  function toggleRoomType(rt) {
    setRoomTypes(prev => prev.includes(rt) ? prev.filter(r => r !== rt) : [...prev, rt])
  }

  function validateCurrentStep() {
    const errs = {}
    if (step === 1) {
      if (!name.trim()) errs.name = 'PG name is required.'
      if (description.trim().length < 20) errs.description = 'Description must be at least 20 characters.'
    } else if (step === 2) {
      if (!city.trim()) errs.city = 'City is required.'
      if (!area.trim()) errs.area = 'Area is required.'
      if (!state.trim()) errs.state = 'State is required.'
      if (!address.trim()) errs.address = 'Address is required.'
    } else if (step === 3) {
      if (!rent || Number(rent) <= 0) errs.rent = 'Rent must be greater than 0.'
    } else if (step === 4) {
      if (!totalCapacity || parseInt(totalCapacity, 10) < 1) errs.totalCapacity = 'Total capacity must be at least 1.'
    }
    return errs
  }

  async function handleNext() {
    const errs = validateCurrentStep()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setSaving(true)

    try {
      if (step === 1) {
        let id = pgId
        if (!id) {
          const res = await createOnboardingPG({ name: name.trim(), description: description.trim() })
          id = res?.data?._id
          setPgId(id)
        } else {
          await updateOnboardingPG(id, { name: name.trim(), description: description.trim() })
        }
      } else if (step === 2) {
        await updateOnboardingPG(pgId, {
          location: {
            city: city.trim(),
            area: area.trim(),
            state: state.trim(),
            address: address.trim(),
          },
        })
      } else if (step === 3) {
        const pricing = { rent: Number(rent) }
        if (deposit !== '') pricing.deposit = Number(deposit)
        if (maintenance !== '') pricing.maintenance = Number(maintenance)
        await updateOnboardingPG(pgId, { pricing })
      } else if (step === 4) {
        await updateOnboardingPG(pgId, {
          accommodation: {
            totalCapacity: parseInt(totalCapacity, 10),
            roomTypes,
          },
          gender,
        })
      } else if (step === 5) {
        await updateOnboardingPG(pgId, { amenities })
      }

      setStep(s => s + 1)
    } catch (err) {
      const normalized = normalizeError(err)
      toast(normalized.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      await submitOnboardingPG()
      toast('Your PG has been submitted for review!', 'success')
      navigate('/pgowner/waiting-approval', { replace: true })
    } catch (err) {
      const normalized = normalizeError(err)
      toast(normalized.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const STEP_MESSAGES = [
    "Let's start with the basics",
    "Nice — now pin your location",
    "Almost halfway — set your pricing",
    "Good progress — tell us about your rooms",
    "Nearly done — what amenities do you offer?",
    "One last look before you submit",
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf9f8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#e98a76] border-t-transparent animate-spin" />
          <p className="text-sm text-[#73787a]">Loading your draft…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fbf9f8] px-4 py-8">
      {/* Header */}
      <div className="flex justify-center mb-8">
        <Link to="/">
          <img src="/logo.png" alt="Nest Stay" className="h-12 w-auto" />
        </Link>
      </div>

      <div className="max-w-2xl mx-auto mb-2 text-center">
        <h1 className="text-xl font-bold text-[#1b1c1c]">List Your PG</h1>
        <p className="text-sm text-[#73787a] mt-1">You&apos;re almost there — add a few details to get your PG ready for verified tenants.</p>
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <ProgressBar currentStep={step} />
      </div>

      {/* Step card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 lg:p-8 max-w-2xl w-full mx-auto">
        {step === 1 && (
          <Step1
            name={name} setName={setName}
            description={description} setDescription={setDescription}
            errors={errors} clearError={clearError}
          />
        )}
        {step === 2 && (
          <Step2
            city={city} setCity={setCity}
            area={area} setArea={setArea}
            state={state} setState={setState}
            address={address} setAddress={setAddress}
            errors={errors} clearError={clearError}
          />
        )}
        {step === 3 && (
          <Step3
            rent={rent} setRent={setRent}
            deposit={deposit} setDeposit={setDeposit}
            maintenance={maintenance} setMaintenance={setMaintenance}
            errors={errors} clearError={clearError}
          />
        )}
        {step === 4 && (
          <Step4
            totalCapacity={totalCapacity} setTotalCapacity={setTotalCapacity}
            roomTypes={roomTypes} toggleRoomType={toggleRoomType}
            gender={gender} setGender={setGender}
            errors={errors} clearError={clearError}
          />
        )}
        {step === 5 && (
          <Step5 amenities={amenities} toggleAmenity={toggleAmenity} />
        )}
        {step === 6 && (
          <Step6
            name={name} description={description}
            city={city} area={area} state={state} address={address}
            rent={rent} deposit={deposit} maintenance={maintenance}
            totalCapacity={totalCapacity} roomTypes={roomTypes}
            gender={gender} amenities={amenities}
          />
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#f0f0f0]">
          <button
            type="button"
            onClick={() => { setErrors({}); setStep(s => s - 1) }}
            disabled={step === 1}
            className="px-5 py-2.5 text-sm font-semibold text-[#73787a] hover:text-[#1b1c1c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Back
          </button>

          <div className="text-xs text-[#73787a] italic">
            {STEP_MESSAGES[step - 1]}
          </div>

          {step < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="bg-[#e98a76] hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-7 py-2.5 rounded-xl text-sm transition-all"
            >
              {saving ? 'Saving…' : 'Save & Continue →'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="bg-[#1b1c1c] hover:bg-[#2d2d2d] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-7 py-2.5 rounded-xl text-sm transition-all"
            >
              {saving ? 'Submitting…' : 'Submit for Review'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
