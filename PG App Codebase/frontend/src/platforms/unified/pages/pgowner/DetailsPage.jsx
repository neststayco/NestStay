import { useState, useEffect } from 'react'
import { getPGDetails, updateMyPGDetails } from '@shared/api/pgs'
import { useAuth } from '@shared/context/AuthContext'
import { useToast } from '@shared/components/Toast'
import OfflineBanner from '@shared/components/OfflineBanner'

const AMENITY_OPTIONS = [
  'WiFi', 'AC', 'Laundry', 'Hot Water', 'Gym', 'Parking', 'Security',
  'CCTV', 'Power Backup', 'Meals Included', 'Housekeeping', 'Attached Bathroom',
  'Study Table', 'Wardrobe', 'Refrigerator', 'Water Purifier',
]

const inputCls =
  'w-full border border-[#e0e0e0] rounded-[10px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action focus:border-action bg-gray-50'

function Skeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-6 bg-gray-200 rounded w-48" />
      <div className="bg-white border border-[#e0e0e0] rounded-[20px] p-6 space-y-4">
        {[120, 80, 60, 60, 60].map((w, i) => (
          <div key={i} className={`h-10 bg-gray-200 rounded-[10px] w-${w}`} />
        ))}
      </div>
    </div>
  )
}

export default function OwnerDetailsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const pgId = user?.pgId

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [description, setDescription] = useState('')
  const [rent, setRent] = useState('')
  const [deposit, setDeposit] = useState('')
  const [maintenance, setMaintenance] = useState('')
  const [amenities, setAmenities] = useState([])
  const [customAmenity, setCustomAmenity] = useState('')

  useEffect(() => {
    if (!pgId) { setLoading(false); return }
    getPGDetails(pgId)
      .then(res => {
        const pg = res.pg
        setDescription(pg?.description || '')
        setRent(pg?.pricing?.rent != null ? String(pg.pricing.rent) : '')
        setDeposit(pg?.pricing?.deposit != null ? String(pg.pricing.deposit) : '')
        setMaintenance(pg?.pricing?.maintenance != null ? String(pg.pricing.maintenance) : '')
        setAmenities(pg?.amenities || [])
      })
      .catch(() => setError('Failed to load PG data.'))
      .finally(() => setLoading(false))
  }, [pgId])

  function toggleAmenity(amenity) {
    setAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    )
  }

  function addCustomAmenity() {
    const trimmed = customAmenity.trim()
    if (trimmed && !amenities.includes(trimmed)) {
      setAmenities(prev => [...prev, trimmed])
    }
    setCustomAmenity('')
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')

    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters.')
      return
    }

    const body = {
      description: description.trim(),
      pricing: {
        ...(rent !== '' && { rent: Number(rent) }),
        ...(deposit !== '' && { deposit: Number(deposit) }),
        ...(maintenance !== '' && { maintenance: Number(maintenance) }),
      },
      amenities,
    }

    setSaving(true)
    try {
      await updateMyPGDetails(body)
      toast('Details updated successfully', 'success')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update details.')
    } finally {
      setSaving(false)
    }
  }

  if (!pgId && !loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          No PG is linked to your account yet. Contact an admin to link a PG.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <OfflineBanner />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">PG Details</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Update your PG description, pricing, and amenities.
        </p>
      </div>

      {loading ? (
        <Skeleton />
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Description */}
          <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Description</h2>
            <div>
              <textarea
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe your PG — location highlights, rules, what makes it unique…"
                className={`${inputCls} resize-none h-auto`}
                required
              />
              <p className="text-xs text-gray-400 mt-1">{description.trim().length} characters (min 10)</p>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pricing</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Rent (₹/mo)</label>
                <input
                  type="number"
                  min="0"
                  value={rent}
                  onChange={e => setRent(e.target.value)}
                  placeholder="e.g. 12000"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Deposit (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={deposit}
                  onChange={e => setDeposit(e.target.value)}
                  placeholder="e.g. 24000"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Maintenance (₹/mo)</label>
                <input
                  type="number"
                  min="0"
                  value={maintenance}
                  onChange={e => setMaintenance(e.target.value)}
                  placeholder="e.g. 500"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    amenities.includes(a)
                      ? 'bg-brand border-brand text-black'
                      : 'bg-gray-50 border-[#e0e0e0] text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>

            {/* Custom amenity input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customAmenity}
                onChange={e => setCustomAmenity(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomAmenity() } }}
                placeholder="Add custom amenity…"
                className={`${inputCls} flex-1`}
              />
              <button
                type="button"
                onClick={addCustomAmenity}
                disabled={!customAmenity.trim()}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-[10px] disabled:opacity-40"
              >
                Add
              </button>
            </div>

            {/* Custom amenities not in the standard list */}
            {amenities.filter(a => !AMENITY_OPTIONS.includes(a)).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {amenities.filter(a => !AMENITY_OPTIONS.includes(a)).map(a => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-brand border border-brand text-black"
                  >
                    {a}
                    <button
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className="ml-0.5 hover:opacity-70"
                      aria-label={`Remove ${a}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand hover:bg-brand-light disabled:opacity-50 text-black text-sm font-semibold px-6 py-2.5 rounded-[10px] transition-colors"
            >
              {saving ? 'Saving…' : 'Save details'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
