import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'
import { getPGAdmissions } from '@shared/api/admissions'
import { getComplaints } from '@shared/api/complaints'
import { getPGDetails } from '@shared/api/pgs'

// design.md Owner Dashboard Mockup tokens:
// neutral tile:  bg-[#f6f3f2], text-[#1b1c1c] / label text-[#73787a]
// accent tile:   bg-[#ffdbd0], text-[#3a0b00]  ("New Requests" card bg per design.md)
// danger tile:   red-50/red-700 (full-seats state — semantic colors per design.md)
// card titlebar: bg-[#eae8e7]

function StatTile({ label, value, sub, accent, danger }) {
  if (danger) {
    return (
      <div className="p-5 bg-red-50 rounded-xl border border-red-100">
        <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold text-red-700 mt-1">{value ?? '—'}</p>
        {sub && <p className="text-xs text-red-400 mt-1">{sub}</p>}
      </div>
    )
  }
  if (accent) {
    return (
      <div className="p-5 bg-[#ffdbd0] rounded-xl border border-[#E5E7EB]">
        <p className="text-xs font-semibold text-[#3a0b00] uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold text-[#3a0b00] mt-1">{value ?? '—'}</p>
        {sub && <p className="text-xs text-[#3a0b00]/60 mt-1">{sub}</p>}
      </div>
    )
  }
  return (
    <div className="p-5 bg-[#f6f3f2] rounded-xl border border-[#E5E7EB]">
      <p className="text-xs font-semibold text-[#73787a] uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-[#1b1c1c] mt-1">{value ?? '—'}</p>
      {sub && <p className="text-xs text-[#73787a] mt-1">{sub}</p>}
    </div>
  )
}

function TileSkeleton() {
  return <div className="rounded-xl border border-[#E5E7EB] p-5 animate-pulse bg-[#f6f3f2]/60 h-24" />
}

function InfoRow({ label, value, highlight, capitalize }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#73787a] uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-sm ${highlight ? 'font-bold text-[#1b1c1c]' : 'text-[#434849]'} ${capitalize ? 'capitalize' : ''}`}>
        {value || '—'}
      </p>
    </div>
  )
}

function QuickLink({ to, label, icon, urgent }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-[10px] border text-sm font-medium transition-colors ${
        urgent
          ? 'bg-[#ffdbd0] border-[#E5E7EB] text-[#3a0b00] hover:bg-[#ffd0c0]'
          : 'bg-white border-[#e0e0e0] text-[#434849] hover:border-action hover:text-action'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

export default function OwnerDashboardPage() {
  const { user } = useAuth()
  const pgId = user?.pgId

  const [pg, setPg] = useState(null)
  const [admitted, setAdmitted] = useState(0)
  const [pending, setPending] = useState(0)
  const [totalComplaints, setTotalComplaints] = useState(0)
  const [remainingCapacity, setRemainingCapacity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
          getComplaints({ limit: 1 }),
        ])
        setAdmitted(admittedRes.pagination?.totalItems ?? 0)
        setPending(pendingRes.pagination?.totalItems ?? 0)
        setPg(pgRes.pg)
        setRemainingCapacity(pgRes.remainingCapacity)
        setTotalComplaints(complaintsRes.pagination?.totalItems ?? 0)
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
        <h1 className="text-2xl font-bold text-[#1b1c1c]">Dashboard</h1>
        <p className="text-[#73787a] text-sm mt-0.5">Overview of your PG property</p>
      </div>

      {!pgId && !loading && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-[10px] mb-6 text-sm">
          No PG is linked to your account yet. Contact the platform admin to get your property set up.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[10px] mb-6 text-sm">{error}</div>
      )}

      {/* KPI tiles — warm palette per design.md Owner Dashboard Mockup */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <TileSkeleton key={i} />)
        ) : (
          <>
            <StatTile
              label="Admitted Guests"
              value={admitted}
              sub={admitted > 0 ? 'Current residents' : 'No residents yet'}
            />
            <StatTile
              label="New Requests"
              value={pending}
              sub={pending > 0 ? 'Awaiting review' : 'All clear'}
              accent
            />
            <StatTile
              label="Total Complaints"
              value={totalComplaints}
              sub={totalComplaints > 0 ? 'On your PG' : 'None yet'}
            />
            <StatTile
              label="Available Beds"
              value={remainingCapacity ?? '—'}
              sub={
                remainingCapacity === 0 ? 'No vacancies'
                : remainingCapacity != null ? 'Beds free'
                : 'Capacity not set'
              }
              danger={remainingCapacity === 0}
            />
          </>
        )}
      </div>

      {/* PG info card — bg-[#eae8e7] titlebar per design.md */}
      {!loading && pg && (
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] shadow-card overflow-hidden">
          <div className="bg-[#eae8e7] px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[#1b1c1c]">{pg.name}</h2>
              <p className="text-xs text-[#73787a] mt-0.5">
                {[pg.location?.area, pg.location?.city, pg.location?.state].filter(Boolean).join(', ')}
              </p>
            </div>
            <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0">
              Active
            </span>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              <InfoRow
                label="Monthly Rent"
                value={pg.pricing?.rent ? `₹${pg.pricing.rent.toLocaleString('en-IN')}` : null}
                highlight
              />
              <InfoRow
                label="Deposit"
                value={pg.pricing?.deposit ? `₹${pg.pricing.deposit.toLocaleString('en-IN')}` : null}
              />
              <InfoRow
                label="Maintenance"
                value={pg.pricing?.maintenance ? `₹${pg.pricing.maintenance.toLocaleString('en-IN')}/mo` : null}
              />
              <InfoRow label="Gender" value={pg.accommodation?.gender} capitalize />
              <InfoRow
                label="Total Capacity"
                value={pg.accommodation?.totalCapacity ? `${pg.accommodation.totalCapacity} beds` : null}
              />
              <InfoRow label="Food Type" value={pg.accommodation?.foodType} capitalize />
            </div>

            {pg.amenities?.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#E5E7EB]">
                <p className="text-xs font-semibold text-[#73787a] uppercase tracking-wide mb-2">Amenities</p>
                <div className="flex flex-wrap gap-1.5">
                  {pg.amenities.map(a => (
                    <span
                      key={a}
                      className="text-xs bg-[#f6f3f2] text-[#434849] border border-[#E5E7EB] rounded-full px-2.5 py-0.5 capitalize"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-[#E5E7EB]">
              <p className="text-xs font-semibold text-[#73787a] uppercase tracking-wide mb-2">Quick Actions</p>
              <div className="flex flex-wrap gap-2">
                <QuickLink
                  to="/pgowner/details"
                  label="Edit settings"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  }
                />
                <QuickLink
                  to="/pgowner/location"
                  label="Update location"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                />
                <QuickLink
                  to="/pgowner/photos"
                  label="Manage photos"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                />
                {pending > 0 && (
                  <QuickLink
                    to="/pgowner/admissions"
                    label={`Review ${pending} pending request${pending !== 1 ? 's' : ''}`}
                    urgent
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
