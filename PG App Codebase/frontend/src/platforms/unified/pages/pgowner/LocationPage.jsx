import { useState, useEffect } from 'react'
import { getPGDetails, updateMyPGLocation } from '@shared/api/pgs'
import { useAuth } from '@shared/context/AuthContext'
import { useToast } from '@shared/components/Toast'
import OfflineBanner from '@shared/components/OfflineBanner'
import PageHeader from '../../components/PageHeader'
import PageContainer from '../../components/PageContainer'
import DataCard from '../../components/DataCard'
import { SkeletonBase } from '@shared/components/Skeleton'

const inputCls =
  'w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e98a76] focus:border-[#e98a76] bg-white h-[42px]'

export default function OwnerLocationPage() {
  const { user } = useAuth()
  const toast = useToast()
  const pgId = user?.pgId

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [currentCoords, setCurrentCoords] = useState(null)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')

  useEffect(() => {
    if (!pgId) { setLoading(false); return }
    getPGDetails(pgId)
      .then(res => {
        const coords = res.pg?.location?.coordinates
        if (coords?.lat != null && coords?.lng != null) {
          setCurrentCoords(coords)
          setLat(String(coords.lat))
          setLng(String(coords.lng))
        }
      })
      .catch(() => setError('Failed to load PG data.'))
      .finally(() => setLoading(false))
  }, [pgId])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    const parsedLat = parseFloat(lat)
    const parsedLng = parseFloat(lng)
    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      setError('Latitude must be between -90 and 90.')
      return
    }
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      setError('Longitude must be between -180 and 180.')
      return
    }
    setSaving(true)
    try {
      await updateMyPGLocation(parsedLat, parsedLng)
      setCurrentCoords({ lat: parsedLat, lng: parsedLng })
      toast('Location saved successfully', 'success')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save location.')
    } finally {
      setSaving(false)
    }
  }

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
        title="Location"
        subtitle="Set map coordinates so residents can find your PG"
      />

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-4">
            <SkeletonBase className="h-14 rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
              <SkeletonBase className="h-10 rounded-xl" />
              <SkeletonBase className="h-10 rounded-xl" />
            </div>
            <SkeletonBase className="h-10 rounded-xl w-36" />
          </div>
        </div>
      ) : (
        <>
          {currentCoords && (
            <div className="mb-5 bg-white border border-[#E5E7EB] rounded-2xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold text-[#73787a] uppercase tracking-wider mb-1">
                  Current coordinates
                </p>
                <p className="text-sm text-[#1b1c1c] font-mono font-semibold">
                  {currentCoords.lat}, {currentCoords.lng}
                </p>
              </div>
              <a
                href={`https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#e98a76] hover:text-[#e98a76] font-semibold border border-[#E5E7EB] bg-[#f6f3f2] hover:bg-[#fff3ee] rounded-xl px-3 py-1.5 transition-colors whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                View on Maps
              </a>
            </div>
          )}

          <DataCard title="Coordinates">
          <form
            onSubmit={handleSave}
            className="space-y-5"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#434849] mb-2">
                  Latitude <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={lat}
                  onChange={e => setLat(e.target.value)}
                  placeholder="e.g. 18.5204"
                  className={inputCls}
                  required
                />
                <p className="text-xs text-[#73787a] mt-1">Range: -90 to 90</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#434849] mb-2">
                  Longitude <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={lng}
                  onChange={e => setLng(e.target.value)}
                  placeholder="e.g. 73.8567"
                  className={inputCls}
                  required
                />
                <p className="text-xs text-[#73787a] mt-1">Range: -180 to 180</p>
              </div>
            </div>

            <p className="text-xs text-[#73787a]">
              Use{' '}
              <a
                href="https://www.google.com/maps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#e98a76] underline"
              >
                Google Maps
              </a>{' '}
              to find coordinates: right-click on your location → coordinates appear in the context menu.
            </p>

            {lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng)) && (
              <a
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#e98a76] hover:underline"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                Preview on Maps
              </a>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={saving || !lat || !lng}
                className="inline-flex items-center gap-2 bg-[#1b1c1c] hover:bg-[#2d2d2d] disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                {saving ? 'Saving…' : 'Save location'}
              </button>
            </div>
          </form>
          </DataCard>
        </>
      )}
    </PageContainer>
  )
}
