import { useState, useEffect } from 'react'
import { getPGDetails, updateMyPGLocation } from '@shared/api/pgs'
import { useAuth } from '@shared/context/AuthContext'
import { useToast } from '@shared/components/Toast'
import OfflineBanner from '@shared/components/OfflineBanner'

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 rounded w-40" />
      <div className="bg-white border border-[#e0e0e0] rounded-[20px] p-6 space-y-4">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-gray-200 rounded-[10px]" />
          <div className="h-10 bg-gray-200 rounded-[10px]" />
        </div>
        <div className="h-10 bg-gray-200 rounded-[10px] w-32" />
      </div>
    </div>
  )
}

const inputCls =
  'w-full border border-[#e0e0e0] rounded-[10px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action focus:border-action bg-gray-50 h-[42px]'

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
      setError('Latitude must be a number between -90 and 90.')
      return
    }
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      setError('Longitude must be a number between -180 and 180.')
      return
    }
    setSaving(true)
    try {
      await updateMyPGLocation(parsedLat, parsedLng)
      setCurrentCoords({ lat: parsedLat, lng: parsedLng })
      toast('Location saved successfully', 'success')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save location.'
      setError(msg)
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
        <h1 className="text-2xl font-bold text-gray-900">Location</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Set the map coordinates so residents can locate your PG.
        </p>
      </div>

      {loading ? (
        <Skeleton />
      ) : (
        <>
          {currentCoords && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-[10px] flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-0.5">
                  Current coordinates
                </p>
                <p className="text-sm text-blue-900 font-mono">
                  {currentCoords.lat}, {currentCoords.lng}
                </p>
              </div>
              <a
                href={`https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold border border-blue-200 bg-white rounded-[10px] px-3 py-1.5 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                View on Maps
              </a>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#222121] mb-2">
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
                <p className="text-xs text-gray-400 mt-1">Range: -90 to 90</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#222121] mb-2">
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
                <p className="text-xs text-gray-400 mt-1">Range: -180 to 180</p>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Use{' '}
              <a
                href="https://www.google.com/maps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-action underline"
              >
                Google Maps
              </a>{' '}
              to find coordinates: right-click on your location → the coordinates appear in the context menu.
            </p>

            {lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng)) && (
              <a
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-action hover:underline"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                Preview this location on Maps
              </a>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || !lat || !lng}
                className="bg-brand hover:bg-brand-light disabled:opacity-50 text-black text-sm font-semibold px-6 py-2.5 rounded-[10px] transition-colors"
              >
                {saving ? 'Saving…' : 'Save location'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
