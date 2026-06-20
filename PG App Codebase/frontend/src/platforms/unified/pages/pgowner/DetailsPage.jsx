import { useState, useEffect } from 'react'
import { getPGDetails, updateMyPGDetails, updateMyPGCapacity } from '@shared/api/pgs'
import { useAuth } from '@shared/context/AuthContext'
import { useToast } from '@shared/components/Toast'
import OfflineBanner from '@shared/components/OfflineBanner'
import PageHeader from '../../components/PageHeader'
import PageContainer from '../../components/PageContainer'
import DataCard from '../../components/DataCard'
import StatCard from '../../components/StatCard'
import { SkeletonBase } from '@shared/components/Skeleton'

const AMENITY_OPTIONS = [
  'WiFi', 'AC', 'Laundry', 'Hot Water', 'Gym', 'Parking', 'Security',
  'CCTV', 'Power Backup', 'Meals Included', 'Housekeeping', 'Attached Bathroom',
  'Study Table', 'Wardrobe', 'Refrigerator', 'Water Purifier',
]

const inputCls =
  'w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e98a76] focus:border-[#e98a76] bg-white'

export default function OwnerSettingsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const pgId = user?.pgId

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingCapacity, setSavingCapacity] = useState(false)
  const [error, setError] = useState('')
  const [capacityError, setCapacityError] = useState('')

  const [description, setDescription] = useState('')
  const [rent, setRent] = useState('')
  const [deposit, setDeposit] = useState('')
  const [maintenance, setMaintenance] = useState('')
  const [foodType, setFoodType] = useState('')
  const [amenities, setAmenities] = useState([])
  const [customAmenity, setCustomAmenity] = useState('')

  const [totalCapacity, setTotalCapacity] = useState('')
  const [remainingCapacity, setRemainingCapacity] = useState(null)
  const [currentTotal, setCurrentTotal] = useState(null)

  useEffect(() => {
    if (!pgId) { setLoading(false); return }
    getPGDetails(pgId)
      .then(res => {
        const pg = res.pg
        setDescription(pg?.description || '')
        setRent(pg?.pricing?.rent != null ? String(pg.pricing.rent) : '')
        setDeposit(pg?.pricing?.deposit != null ? String(pg.pricing.deposit) : '')
        setMaintenance(pg?.pricing?.maintenance != null ? String(pg.pricing.maintenance) : '')
        setFoodType(pg?.foodType || '')
        setAmenities(pg?.amenities || [])
        const cap = pg?.accommodation?.totalCapacity
        if (cap != null) {
          setTotalCapacity(String(cap))
          setCurrentTotal(cap)
        }
        setRemainingCapacity(res.remainingCapacity)
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
    if (trimmed && !amenities.includes(trimmed)) setAmenities(prev => [...prev, trimmed])
    setCustomAmenity('')
  }

  async function handleSaveDetails(e) {
    e.preventDefault()
    setError('')
    if (description.trim().length < 10) { setError('Description must be at least 10 characters.'); return }
    const body = {
      description: description.trim(),
      pricing: {
        ...(rent !== '' && { rent: Number(rent) }),
        ...(deposit !== '' && { deposit: Number(deposit) }),
        ...(maintenance !== '' && { maintenance: Number(maintenance) }),
      },
      foodType: foodType || null,
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

  async function handleSaveCapacity(e) {
    e.preventDefault()
    setCapacityError('')
    const parsed = parseInt(totalCapacity, 10)
    if (isNaN(parsed) || parsed < 0) { setCapacityError('Total capacity must be a non-negative whole number.'); return }
    setSavingCapacity(true)
    try {
      const res = await updateMyPGCapacity(parsed)
      const updated = res.data?.accommodation?.totalCapacity ?? parsed
      setCurrentTotal(updated)
      setTotalCapacity(String(updated))
      toast('Capacity updated successfully', 'success')
    } catch (err) {
      setCapacityError(err.response?.data?.message || 'Failed to update capacity.')
    } finally {
      setSavingCapacity(false)
    }
  }

  const admitted = currentTotal != null && remainingCapacity != null
    ? currentTotal - remainingCapacity : null

  if (!pgId && !loading) {
    return (
      <PageContainer size="sm">
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          No PG linked to your account yet. Contact an admin.
        </p>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="sm">
      <OfflineBanner />
      <PageHeader title="Settings" subtitle="Manage your PG description, pricing, amenities, and capacity" />

      {loading ? (
        <div className="animate-pulse space-y-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-4">
              <SkeletonBase className="h-4 w-24" />
              <SkeletonBase className="h-10 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <form onSubmit={handleSaveDetails} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            <DataCard title="Description">
              <textarea
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe your PG — location highlights, rules, what makes it unique…"
                className={`${inputCls} resize-none h-auto`}
                required
              />
              <p className="text-xs text-[#73787a] mt-1.5">{description.trim().length} characters (min 10)</p>
            </DataCard>

            <DataCard title="Pricing">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#434849] mb-1.5">Rent (₹/mo)</label>
                  <input type="number" min="0" value={rent} onChange={e => setRent(e.target.value)} placeholder="e.g. 12000" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#434849] mb-1.5">Deposit (₹)</label>
                  <input type="number" min="0" value={deposit} onChange={e => setDeposit(e.target.value)} placeholder="e.g. 24000" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#434849] mb-1.5">Maintenance (₹/mo)</label>
                  <input type="number" min="0" value={maintenance} onChange={e => setMaintenance(e.target.value)} placeholder="e.g. 500" className={inputCls} />
                </div>
              </div>
            </DataCard>

            <DataCard title="Food">
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'veg', label: 'Veg only' },
                  { value: 'non-veg', label: 'Non-veg' },
                  { value: 'both', label: 'Veg & Non-veg' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFoodType(prev => prev === opt.value ? '' : opt.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      foodType === opt.value
                        ? 'bg-[#1b1c1c] border-[#1b1c1c] text-white'
                        : 'bg-[#f6f3f2] border-[#E5E7EB] text-[#434849] hover:border-[#1b1c1c]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#73787a] mt-2">Click again to unset</p>
            </DataCard>

            <DataCard title="Amenities">
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      amenities.includes(a)
                        ? 'bg-[#1b1c1c] border-[#1b1c1c] text-white'
                        : 'bg-[#f6f3f2] border-[#E5E7EB] text-[#434849] hover:border-[#1b1c1c] hover:text-[#1b1c1c]'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
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
                  className="px-4 py-2 bg-[#f6f3f2] hover:bg-[#eae8e7] text-[#434849] text-sm font-medium rounded-xl disabled:opacity-40 transition-colors"
                >
                  Add
                </button>
              </div>
              {amenities.filter(a => !AMENITY_OPTIONS.includes(a)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {amenities.filter(a => !AMENITY_OPTIONS.includes(a)).map(a => (
                    <span key={a} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1b1c1c] text-white">
                      {a}
                      <button type="button" onClick={() => toggleAmenity(a)} className="ml-0.5 hover:opacity-70">×</button>
                    </span>
                  ))}
                </div>
              )}
            </DataCard>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#1b1c1c] hover:bg-[#2d2d2d] disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              {saving ? 'Saving…' : 'Save details'}
            </button>
          </form>

          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-[#f0f0f0]" />
            <span className="text-[10px] font-semibold text-[#73787a] uppercase tracking-wider">Capacity</span>
            <div className="flex-1 h-px bg-[#f0f0f0]" />
          </div>

          {currentTotal != null && (
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Total beds" value={currentTotal} compact />
              <StatCard label="Admitted" value={admitted} compact />
              <StatCard label="Available" value={remainingCapacity} compact accent={remainingCapacity === 0} />
            </div>
          )}

          <form onSubmit={handleSaveCapacity} className="space-y-5">
            {capacityError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{capacityError}</div>
            )}
            <DataCard title="Total capacity">
              <div className="max-w-xs">
                <label className="block text-xs font-semibold text-[#434849] mb-2">
                  Total beds <span className="text-red-500">*</span>
                </label>
                <input
                  type="number" min="0" step="1" value={totalCapacity}
                  onChange={e => setTotalCapacity(e.target.value)}
                  placeholder="e.g. 20" className={inputCls} required
                />
                <p className="text-xs text-[#73787a] mt-1.5">
                  Must be ≥ current admitted residents ({admitted ?? 0}).
                </p>
              </div>
            </DataCard>
            <button
              type="submit"
              disabled={savingCapacity || totalCapacity === ''}
              className="inline-flex items-center gap-2 bg-[#1b1c1c] hover:bg-[#2d2d2d] disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              {savingCapacity ? 'Saving…' : 'Save capacity'}
            </button>
          </form>
        </div>
      )}
    </PageContainer>
  )
}
