import { useState, useEffect } from 'react'
import { getPGDetails, updateMyPGCapacity } from '@shared/api/pgs'
import { useAuth } from '@shared/context/AuthContext'
import { useToast } from '@shared/components/Toast'
import OfflineBanner from '@shared/components/OfflineBanner'

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 rounded w-40" />
      <div className="bg-white border border-[#e0e0e0] rounded-[20px] p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-[10px]" />
          ))}
        </div>
        <div className="h-10 bg-gray-200 rounded-[10px] w-48" />
        <div className="h-10 bg-gray-200 rounded-[10px] w-32" />
      </div>
    </div>
  )
}

const inputCls =
  'w-full border border-[#e0e0e0] rounded-[10px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action focus:border-action bg-gray-50 h-[42px]'

function StatTile({ label, value, accent }) {
  return (
    <div
      className={`rounded-[10px] p-4 ${accent ? 'bg-[#ffdbd0]' : 'bg-gray-50'} border border-[#e0e0e0]`}
    >
      <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${accent ? 'text-[#3a0b00]' : 'text-gray-500'}`}>
        {label}
      </p>
      <p className={`text-2xl font-bold ${accent ? 'text-[#3a0b00]' : 'text-gray-900'}`}>
        {value ?? '—'}
      </p>
    </div>
  )
}

export default function OwnerCapacityPage() {
  const { user } = useAuth()
  const toast = useToast()
  const pgId = user?.pgId

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [pgData, setPgData] = useState(null)
  const [remainingCapacity, setRemainingCapacity] = useState(null)
  const [totalCapacity, setTotalCapacity] = useState('')

  useEffect(() => {
    if (!pgId) { setLoading(false); return }
    getPGDetails(pgId)
      .then(res => {
        setPgData(res.pg)
        setRemainingCapacity(res.remainingCapacity)
        const current = res.pg?.accommodation?.totalCapacity
        if (current != null) setTotalCapacity(String(current))
      })
      .catch(() => setError('Failed to load PG data.'))
      .finally(() => setLoading(false))
  }, [pgId])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    const parsed = parseInt(totalCapacity, 10)
    if (isNaN(parsed) || parsed < 0) {
      setError('Total capacity must be a non-negative whole number.')
      return
    }
    setSaving(true)
    try {
      const res = await updateMyPGCapacity(parsed)
      const updatedCapacity = res.data?.accommodation?.totalCapacity ?? parsed
      setPgData(prev => ({
        ...prev,
        accommodation: { ...prev?.accommodation, totalCapacity: updatedCapacity },
      }))
      toast('Capacity updated successfully', 'success')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update capacity.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const currentTotal = pgData?.accommodation?.totalCapacity
  const admitted = currentTotal != null && remainingCapacity != null
    ? currentTotal - remainingCapacity
    : null

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
        <h1 className="text-2xl font-bold text-gray-900">Capacity</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Set the total number of beds in your PG. This determines how many residents can be admitted.
        </p>
      </div>

      {loading ? (
        <Skeleton />
      ) : (
        <div className="space-y-5">
          {currentTotal != null && (
            <div className="grid grid-cols-3 gap-4">
              <StatTile label="Total beds" value={currentTotal} />
              <StatTile label="Admitted" value={admitted} />
              <StatTile label="Available" value={remainingCapacity} accent={remainingCapacity === 0} />
            </div>
          )}

          <form
            onSubmit={handleSave}
            className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card p-6 space-y-5"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="max-w-xs">
              <label className="block text-sm font-medium text-[#222121] mb-2">
                Total capacity (beds) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={totalCapacity}
                onChange={e => setTotalCapacity(e.target.value)}
                placeholder="e.g. 20"
                className={inputCls}
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Must be ≥ current admitted residents ({admitted ?? 0}).
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || totalCapacity === ''}
                className="bg-brand hover:bg-brand-light disabled:opacity-50 text-black text-sm font-semibold px-6 py-2.5 rounded-[10px] transition-colors"
              >
                {saving ? 'Saving…' : 'Save capacity'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
