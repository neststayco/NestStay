import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'
import { getPGAdmissions } from '@shared/api/admissions'
import { getComplaints } from '@shared/api/complaints'
import { getPGDetails } from '@shared/api/pgs'
import PageContainer from '../../components/PageContainer'
import StatCard from '../../components/StatCard'
import { SkeletonCard } from '@shared/components/Skeleton'

const PLACEHOLDER = 'https://placehold.co/400x220/e2e8f0/94a3b8?text=No+Image'
const SHADOW_CARD = 'rgba(0,0,0,0.08) 0px 4px 10px 0px'
const SHADOW_ELEVATED = 'rgba(0,0,0,0.10) 0px 8px 24px, rgba(0,0,0,0.04) 0px 2px 6px'

function InfoRow({ label, value, highlight, capitalize }) {
  return (
    <div className="bg-[#fbf9f8] rounded-xl px-3.5 py-3 border border-[#E5E7EB]">
      <p className="text-[10px] font-semibold text-[#73787a] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm ${highlight ? 'font-bold text-[#1b1c1c]' : 'text-[#434849] font-medium'} ${capitalize ? 'capitalize' : ''}`}>
        {value || '—'}
      </p>
    </div>
  )
}

function QuickAction({ to, label, icon, accent }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
        accent
          ? 'bg-[#e98a76] border-[#e98a76] text-white hover:opacity-90'
          : 'bg-[#f6f3f2] border-[#E5E7EB] text-[#434849] hover:bg-[#eae8e7] hover:border-[#c8c2bc] hover:text-[#1b1c1c]'
      }`}
      style={{ boxShadow: accent ? 'rgba(233,138,118,0.25) 0px 4px 12px' : 'rgba(0,0,0,0.04) 0px 2px 6px' }}
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
          getPGAdmissions({ residentStatus: 'active', limit: 1 }),
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

  const coverImage = pg?.images?.[0]?.url

  return (
    <PageContainer size="lg">
      {/* Page header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-1 h-8 rounded-full bg-[#e98a76]" />
        <div>
          <p className="text-[10px] font-semibold text-[#73787a] uppercase tracking-widest mb-0.5">PG Owner Portal</p>
          <h1 className="text-xl font-bold text-[#1b1c1c] tracking-tight">Overview</h1>
        </div>
      </div>

      {!pgId && !loading && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-6 text-sm">
          No PG linked to your account. Contact the platform admin to set up your property.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              label="Admitted"
              value={admitted}
              sub={admitted > 0 ? 'Current residents' : 'No residents yet'}
              colorClass="bg-green-100 text-green-600"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
            />
            <StatCard
              label="Pending"
              value={pending}
              sub={pending > 0 ? 'Awaiting review' : 'All clear'}
              colorClass={pending > 0 ? 'bg-[#ffdbd0] text-[#e98a76]' : 'bg-[#f6f3f2] text-[#73787a]'}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="Complaints"
              value={totalComplaints}
              sub={totalComplaints > 0 ? 'On your PG' : 'None yet'}
              colorClass={totalComplaints > 0 ? 'bg-red-50 text-red-500' : 'bg-[#f6f3f2] text-[#73787a]'}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
            <StatCard
              label="Available Beds"
              value={remainingCapacity ?? '—'}
              sub={
                remainingCapacity === 0 ? 'No vacancies'
                : remainingCapacity != null ? 'Beds free'
                : 'Capacity not set'
              }
              colorClass={remainingCapacity === 0 ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
            />
          </>
        )}
      </div>

      {/* Property card */}
      {!loading && pg && (
        <div
          className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden"
          style={{ boxShadow: SHADOW_ELEVATED }}
        >
          {/* Cover / header */}
          {coverImage ? (
            <div className="h-36 overflow-hidden relative">
              <img
                src={coverImage}
                alt={pg.name}
                className="w-full h-full object-cover"
                onError={e => { e.target.src = PLACEHOLDER }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                <div>
                  <h2 className="font-bold text-white text-base leading-tight drop-shadow">{pg.name}</h2>
                  <p className="text-white/75 text-xs mt-0.5">
                    {[pg.location?.area, pg.location?.city].filter(Boolean).join(', ')}
                  </p>
                </div>
                <span className="text-[10px] bg-green-500 text-white font-bold px-2.5 py-1 rounded-full flex-shrink-0 shadow">
                  Active
                </span>
              </div>
            </div>
          ) : (
            <div
              className="px-5 py-4 flex items-center justify-between border-b border-[#E5E7EB]"
              style={{ background: 'linear-gradient(135deg, #f6f3f2 0%, #fbf9f8 100%)' }}
            >
              <div>
                <h2 className="font-bold text-[#1b1c1c] text-sm">{pg.name}</h2>
                <p className="text-xs text-[#73787a] mt-0.5">
                  {[pg.location?.area, pg.location?.city, pg.location?.state].filter(Boolean).join(', ')}
                </p>
              </div>
              <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full border border-green-200">
                Active
              </span>
            </div>
          )}

          {/* Details grid */}
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <InfoRow label="Monthly Rent" value={pg.pricing?.rent ? `₹${pg.pricing.rent.toLocaleString('en-IN')}` : null} highlight />
              <InfoRow label="Deposit" value={pg.pricing?.deposit ? `₹${pg.pricing.deposit.toLocaleString('en-IN')}` : null} />
              <InfoRow label="Maintenance" value={pg.pricing?.maintenance ? `₹${pg.pricing.maintenance.toLocaleString('en-IN')}/mo` : null} />
              <InfoRow label="Gender" value={pg.accommodation?.gender} capitalize />
              <InfoRow label="Total Capacity" value={pg.accommodation?.totalCapacity ? `${pg.accommodation.totalCapacity} beds` : null} />
              <InfoRow label="Food Type" value={pg.accommodation?.foodType} capitalize />
            </div>

            {/* Amenities */}
            {pg.amenities?.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#f0f0f0]">
                <p className="text-[10px] font-semibold text-[#73787a] uppercase tracking-wider mb-2.5">Amenities</p>
                <div className="flex flex-wrap gap-1.5">
                  {pg.amenities.map(a => (
                    <span
                      key={a}
                      className="text-xs bg-[#f6f3f2] text-[#434849] border border-[#E5E7EB] rounded-full px-3 py-1 capitalize font-medium"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="mt-5 pt-4 border-t border-[#f0f0f0]">
              <p className="text-[10px] font-semibold text-[#73787a] uppercase tracking-wider mb-3">Quick actions</p>
              <div className="flex flex-wrap gap-2">
                {pending > 0 && (
                  <QuickAction
                    to="/pgowner/admissions"
                    label={`Review ${pending} request${pending !== 1 ? 's' : ''}`}
                    accent
                    icon={
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                      </svg>
                    }
                  />
                )}
                <QuickAction
                  to="/pgowner/details"
                  label="Edit settings"
                  icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                />
                <QuickAction
                  to="/pgowner/photos"
                  label="Manage photos"
                  icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                />
                <QuickAction
                  to="/pgowner/location"
                  label="Update location"
                  icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
