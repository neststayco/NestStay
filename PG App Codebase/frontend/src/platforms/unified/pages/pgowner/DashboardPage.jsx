import { useState, useEffect } from 'react'
import { useAuth } from '@shared/context/AuthContext'
import { useToast } from '@shared/components/Toast'
import { getPGAdmissions } from '@shared/api/admissions'
import { getComplaints } from '@shared/api/complaints'
import { getPGDetails, updateMyPGCapacity, updateMyPGLocation } from '@shared/api/pgs'

function StatCard({ label, value, color, sub }) {
  const colors = {
    brand:  'bg-action-50 border-action-100 text-action',
    green:  'bg-green-50 border-green-100 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-100 text-yellow-700',
    red:    'bg-red-50 border-red-100 text-red-700',
  }
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-1">{value ?? '—'}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  )
}

function Skeleton() {
  return <div className="rounded-[20px] border border-[#e0e0e0] shadow-card p-5 animate-pulse bg-gray-100 h-24" />
}

function InfoRow({ label, value, highlight, capitalize }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`${highlight ? 'font-bold text-[#222121]' : 'text-gray-700'} ${capitalize ? 'capitalize' : ''}`}>
        {value || '—'}
      </p>
    </div>
  )
}

export default function OwnerDashboardPage() {
  const { user } = useAuth()
  const toast = useToast()
  const pgId = user?.pgId

  const [pg, setPg] = useState(null)
  const [admitted, setAdmitted] = useState(0)
  const [pending, setPending] = useState(0)
  const [totalComplaints, setTotalComplaints] = useState(0)
  const [remainingCapacity, setRemainingCapacity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [capacityInput, setCapacityInput] = useState('')
  const [capacitySaving, setCapacitySaving] = useState(false)
  const [latInput, setLatInput] = useState('')
  const [lngInput, setLngInput] = useState('')
  const [locationSaving, setLocationSaving] = useState(false)

  useEffect(() => {
    if (!pgId) { setLoading(false); return }
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [admittedRes, pendingRes, pgRes, complaintsRes] = await Promise.all([
          getPGAdmissions({ status: 'admitted', limit: 1 }),
          getPGAdmissions({ status: 'pending', limit: 1 }),
          getPGDetails(pgId),
          getComplaints({ limit: 100 }),
        ])
        setAdmitted(admittedRes.pagination?.totalItems ?? 0)
        setPending(pendingRes.pagination?.totalItems ?? 0)
        setPg(pgRes.pg)
        setRemainingCapacity(pgRes.remainingCapacity)
        setCapacityInput(pgRes.pg?.accommodation?.totalCapacity ?? '')
        setLatInput(pgRes.pg?.location?.coordinates?.lat ?? '')
        setLngInput(pgRes.pg?.location?.coordinates?.lng ?? '')
        const complaints = complaintsRes.data || []
        setTotalComplaints(complaintsRes.pagination?.totalItems ?? complaints.length)
      } catch {
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [pgId])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Overview of your PG property</p>
      </div>

      {!pgId && !loading && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 text-sm">
          No PG is linked to your account yet. Contact the platform admin to get your property set up.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
        ) : (
          <>
            <StatCard label="Admitted Guests" value={admitted} color="green" />
            <StatCard label="Pending Requests" value={pending} color="yellow" sub={pending > 0 ? 'Needs review' : 'All clear'} />
            <StatCard label="Total Complaints" value={totalComplaints} color="red" />
            <StatCard
              label="Available Beds"
              value={remainingCapacity ?? '—'}
              color={remainingCapacity === 0 ? 'red' : 'brand'}
              sub={remainingCapacity === 0 ? 'No vacancies' : remainingCapacity != null ? 'Beds free' : 'Capacity not set'}
            />
          </>
        )}
      </div>

      {!loading && pg && (
        <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card p-5">
          <div className="flex items-start justify-between mb-4">
            <h2 className="font-semibold text-gray-900">My PG Info</h2>
            <span className="text-xs text-gray-400 bg-gray-100 rounded px-2 py-1">
              Contact platform admin to update details
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <InfoRow label="Name" value={pg.name} />
            <InfoRow
              label="Location"
              value={[pg.location?.area, pg.location?.city, pg.location?.state].filter(Boolean).join(', ')}
            />
            <InfoRow
              label="Monthly Rent"
              value={pg.pricing?.rent ? `₹${pg.pricing.rent.toLocaleString('en-IN')}` : '—'}
              highlight
            />
            <InfoRow label="Gender" value={pg.accommodation?.gender || '—'} capitalize />
            <InfoRow label="Capacity" value={pg.accommodation?.totalCapacity ? `${pg.accommodation.totalCapacity} beds` : '—'} />
            <InfoRow
              label="Deposit"
              value={pg.pricing?.deposit ? `₹${pg.pricing.deposit.toLocaleString('en-IN')}` : '—'}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Update Total Capacity</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setCapacitySaving(true)
                try {
                  const res = await updateMyPGCapacity(Number(capacityInput))
                  setPg(prev => ({ ...prev, accommodation: { ...prev.accommodation, totalCapacity: res.data.accommodation.totalCapacity } }))
                  setRemainingCapacity(Math.max(0, res.data.accommodation.totalCapacity - admitted))
                  toast('Capacity updated', 'success')
                } catch (err) {
                  toast(err.response?.data?.message || 'Update failed', 'error')
                } finally {
                  setCapacitySaving(false)
                }
              }}
              className="flex items-center gap-3"
            >
              <input
                type="number"
                min="0"
                value={capacityInput}
                onChange={e => setCapacityInput(e.target.value)}
                placeholder="e.g. 20"
                className="w-32 border border-[#e0e0e0] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action bg-gray-50"
              />
              <button
                type="submit"
                disabled={capacitySaving || capacityInput === ''}
                className="bg-brand hover:bg-brand-light disabled:opacity-50 text-black text-sm font-semibold px-4 py-2 rounded-[10px] transition-colors"
              >
                {capacitySaving ? 'Saving…' : 'Save'}
              </button>
            </form>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Map Location</p>
            <p className="text-xs text-gray-400 mb-2">Enter coordinates so users can find your PG on Google Maps.</p>
            {pg.location?.coordinates?.lat && (
              <a
                href={`https://www.google.com/maps?q=${pg.location.coordinates.lat},${pg.location.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#027fff] hover:underline mb-2"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                View current location on map
              </a>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setLocationSaving(true)
                try {
                  const res = await updateMyPGLocation(latInput, lngInput)
                  setPg(prev => ({ ...prev, location: { ...prev.location, coordinates: res.data.location.coordinates } }))
                  toast('Location updated', 'success')
                } catch (err) {
                  toast(err.response?.data?.message || 'Update failed', 'error')
                } finally {
                  setLocationSaving(false)
                }
              }}
              className="flex items-center gap-2 flex-wrap"
            >
              <input
                type="number"
                step="any"
                value={latInput}
                onChange={e => setLatInput(e.target.value)}
                placeholder="Latitude (e.g. 18.5204)"
                className="w-44 border border-[#e0e0e0] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action bg-gray-50"
              />
              <input
                type="number"
                step="any"
                value={lngInput}
                onChange={e => setLngInput(e.target.value)}
                placeholder="Longitude (e.g. 73.8567)"
                className="w-44 border border-[#e0e0e0] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action bg-gray-50"
              />
              <button
                type="submit"
                disabled={locationSaving || latInput === '' || lngInput === ''}
                className="bg-brand hover:bg-brand-light disabled:opacity-50 text-black text-sm font-semibold px-4 py-2 rounded-[10px] transition-colors"
              >
                {locationSaving ? 'Saving…' : 'Save'}
              </button>
            </form>
          </div>

          {pg.amenities?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Amenities</p>
              <div className="flex flex-wrap gap-1.5">
                {pg.amenities.map(a => (
                  <span key={a} className="text-xs bg-gray-100 text-gray-700 border border-gray-200 rounded px-2 py-0.5 capitalize">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
