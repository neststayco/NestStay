import { useState, useEffect } from 'react'
import { getPGDetails, updateMyPGCapacity } from '@shared/api/pgs'
import { useAuth } from '@shared/context/AuthContext'
import { useToast } from '@shared/components/Toast'
import OfflineBanner from '@shared/components/OfflineBanner'
import PageHeader from '../../components/PageHeader'
import PageContainer from '../../components/PageContainer'
import DataCard from '../../components/DataCard'
import StatCard from '../../components/StatCard'
import { SkeletonBase } from '@shared/components/Skeleton'

const inputCls =
  'w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e98a76] focus:border-[#e98a76] bg-white h-[42px]'

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
      setError(err.response?.data?.message || 'Failed to update capacity.')
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
      <PageHeader
        title="Capacity"
        subtitle="Set total beds to control how many residents can be admitted"
      />

      {loading ? (
        <div className="animate-pulse space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <SkeletonBase key={i} className="h-20 rounded-2xl" />)}
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-4">
            <SkeletonBase className="h-10 rounded-xl w-48" />
            <SkeletonBase className="h-10 rounded-xl w-32" />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {currentTotal != null && (
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Total beds" value={currentTotal} compact />
              <StatCard label="Admitted" value={admitted} compact />
              <StatCard label="Available" value={remainingCapacity} compact accent={remainingCapacity === 0} />
            </div>
          )}

          <DataCard title="Update capacity">
            <form onSubmit={handleSave} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="max-w-xs">
                <label className="block text-xs font-semibold text-[#434849] mb-2">
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
                <p className="text-xs text-[#73787a] mt-1.5">
                  Must be ≥ current admitted residents ({admitted ?? 0}).
                </p>
              </div>

              <button
                type="submit"
                disabled={saving || totalCapacity === ''}
                className="inline-flex items-center gap-2 bg-[#1b1c1c] hover:bg-[#2d2d2d] disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                {saving ? 'Saving…' : 'Save capacity'}
              </button>
            </form>
          </DataCard>
        </div>
      )}
    </PageContainer>
  )
}
