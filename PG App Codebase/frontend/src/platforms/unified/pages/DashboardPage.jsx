import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getGlobalStats, getStatsByPG, getAllUsers } from '@shared/api/admin'
import { getPGList } from '@shared/api/pgs'
import { getAdminTestimonials } from '@shared/api/testimonials'
import { getAllAdmissions } from '@shared/api/admissions'
import { absoluteDate } from '@shared/utils/relativeTime'
import { StatusPill } from '../components/StatusBadge'
import { SkeletonCard } from '@shared/components/Skeleton'

function KPICard({ label, value, icon, iconBg, iconColor, dot }) {
  return (
    <div className="card-lift bg-white rounded-xl border border-[#e0e0e0] p-4 shadow-card transition-all duration-200 hover:-translate-y-px">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <span className={`material-symbols-outlined text-xl leading-none ${iconColor}`}
            style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        {dot && value > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-dot" />
            New
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-[#1b1c1c] leading-none tracking-tight">{value ?? '—'}</p>
      <p className="text-xs text-[#73787a] font-medium mt-2">{label}</p>
    </div>
  )
}


export default function DashboardPage() {
  const [stats, setStats]             = useState(null)
  const [pgStats, setPgStats]         = useState([])
  const [totalUsers, setTotalUsers]   = useState(null)
  const [totalPGs, setTotalPGs]       = useState(null)
  const [totalOwners, setTotalOwners] = useState(null)
  const [pendingTestimonials, setPendingTestimonials] = useState(null)
  const [pendingApps, setPendingApps]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [queueLoading, setQueueLoading] = useState(true)
  const [error, setError]             = useState('')
  const [is403, setIs403]             = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setIs403(false)
    try {
      const [statsRes, pgStatsRes, usersRes, pgsRes, testimonialsRes, ownersRes] = await Promise.all([
        getGlobalStats(),
        getStatsByPG(),
        getAllUsers({ limit: 1, role: 'user' }),
        getPGList({ limit: 1 }),
        getAdminTestimonials({ status: 'pending', limit: 1 }),
        getAllUsers({ limit: 1, role: 'pg_owner' }),
      ])
      setStats(statsRes.data)
      setPgStats(pgStatsRes.data)
      setTotalUsers(usersRes.pagination?.totalItems ?? null)
      setTotalPGs(pgsRes.pagination?.totalItems ?? null)
      setPendingTestimonials(testimonialsRes.pagination?.totalItems ?? null)
      setTotalOwners(ownersRes.pagination?.totalItems ?? null)
    } catch (err) {
      if (err.response?.status === 403) {
        setIs403(true)
        setError('Permission denied. Contact your administrator.')
      } else {
        setError('Failed to load stats.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    setQueueLoading(true)
    getAllAdmissions({ status: 'pending', limit: 5 })
      .then(res => setPendingApps(res.data ?? []))
      .catch(() => {})
      .finally(() => setQueueLoading(false))
  }, [])

  const needsAction = stats?.totalPendingAdmissions ?? 0
  const maxComplaints = Math.max(...pgStats.map(p => p.complaintCount), 1)

  return (
    <div className="p-5 max-w-5xl mx-auto">

      {/* Topbar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Dashboard</h1>
          <p className="text-xs text-[#73787a] mt-0.5">Platform overview — operations, complaints, property health</p>
        </div>
        <div className="flex items-center gap-2" />
      </div>

      {error && (
        <div className={`border px-4 py-3 rounded-lg mb-4 text-sm flex items-start justify-between gap-4 ${
          is403 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <span>{error}</span>
          {!is403 && (
            <button onClick={load} className="text-xs font-semibold underline underline-offset-2 hover:no-underline shrink-0">
              Retry
            </button>
          )}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-5 gap-4 mb-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KPICard label="Total Users"      value={totalUsers}           icon="group"            iconBg="bg-blue-100"   iconColor="text-blue-600" />
            <KPICard label="PG Owners"        value={totalOwners}          icon="manage_accounts"  iconBg="bg-purple-100" iconColor="text-purple-600" />
            <KPICard label="Active PGs"       value={totalPGs}             icon="apartment"        iconBg="bg-green-100"  iconColor="text-green-700" />
            <KPICard label="Needs Action"     value={needsAction}          icon="warning"          iconBg="bg-red-100"    iconColor="text-red-600" dot />
            <KPICard label="Open Complaints"  value={stats?.pendingComplaints} icon="report"       iconBg="bg-yellow-100" iconColor="text-yellow-700" />
          </>
        )}
      </div>

      {/* Phase 2: Complaint breakdown pills */}
      {!loading && stats && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-[#73787a] uppercase tracking-widest mr-1">Complaints</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#1b1c1c] bg-[#f5f5f5] border border-[#e0e0e0] rounded-full px-3 py-1">
              {stats.totalComplaints} total
            </span>
            <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1">
              {stats.pendingComplaints} pending
            </span>
            <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              {stats.approvedComplaints} approved
            </span>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
              {stats.verifiedComplaints} verified
            </span>
          </div>
          <Link to="/admin/complaints" className="ml-auto text-xs font-semibold text-[#e98a76]">View all →</Link>
        </div>
      )}

      {/* Phase 2: Admissions breakdown pills */}
      {!loading && stats && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-[#73787a] uppercase tracking-widest mr-1">Admissions</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1">
              {stats.totalPendingAdmissions} pending
            </span>
            <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              {stats.totalAdmitted} admitted
            </span>
          </div>
          <Link to="/admin/residency" className="ml-auto text-xs font-semibold text-[#e98a76]">View all →</Link>
        </div>
      )}

      {/* Admissions queue table + Complaints by PG */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-[#e0e0e0] shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0]">
              <h2 className="text-sm font-semibold text-charcoal">Admissions queue</h2>
              <Link to="/admin/residency?status=pending" className="text-xs font-semibold text-[#e98a76]">View all →</Link>
            </div>
            {queueLoading ? (
              <div className="px-5 py-5 flex justify-center">
                <div className="w-5 h-5 border-2 border-[#e0e0e0] border-t-action rounded-full animate-spin" />
              </div>
            ) : pendingApps.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-5">
                <span className="text-xl">📋</span>
                <p className="text-xs font-medium text-[#1b1c1c]">No pending admissions</p>
                <p className="text-[10px] text-[#73787a]">Queue is clear</p>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto max-h-[260px]">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-[#f6f3f2]">
                  <tr className="border-b border-[#e5e5e5]">
                    <th className="text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest px-5 py-2.5">Applicant</th>
                    <th className="text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest px-4 py-2.5">PG</th>
                    <th className="text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest px-4 py-2.5">Submitted</th>
                    <th className="text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApps.map(a => (
                    <tr key={a._id} className="border-b border-[#e5e5e5] last:border-0 hover:bg-[#fbf9f8] transition-colors duration-150">
                      <td className="px-5 py-3 text-xs font-semibold text-charcoal">{a.userId?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-[#434849]">{a.pgId?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-[#73787a] font-mono whitespace-nowrap">
                        {a.createdAt ? absoluteDate(a.createdAt) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>

        {pgStats.length > 0 && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-[#e0e0e0] p-5">
              <h2 className="text-sm font-semibold text-charcoal mb-4">Top PGs by complaints</h2>
              {pgStats.slice(0, 5).map((pg, i) => (
                <div key={pg._id} className="flex items-center gap-3 py-2 border-b border-[#f5f5f5] last:border-0">
                  <span className="text-xs text-[#73787a] w-4 flex-shrink-0">{i + 1}</span>
                  <span className="text-xs font-medium text-charcoal flex-1 truncate">{pg.pgName || 'Unknown PG'}</span>
                  <div className="w-24 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full"
                      style={{ width: `${(pg.complaintCount / maxComplaints) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-charcoal w-4 text-right">{pg.complaintCount}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
