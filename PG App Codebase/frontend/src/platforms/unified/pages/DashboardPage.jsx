import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getGlobalStats, getStatsByPG } from '@shared/api/admin'

function StatCard({ label, value, color, sub }) {
  const colors = {
    blue:   'bg-action-50 border-action-100 text-action',
    yellow: 'bg-yellow-50 border-yellow-100 text-yellow-700',
    green:  'bg-green-50 border-green-100 text-green-700',
    red:    'bg-red-50   border-red-100   text-red-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
  }
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-1">{value ?? '—'}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  )
}

function StatSkeleton() {
  return <div className="rounded-[20px] border border-[#e0e0e0] shadow-card p-5 animate-pulse bg-gray-100 h-24" />
}

export default function DashboardPage() {
  const [stats, setStats]     = useState(null)
  const [pgStats, setPgStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [s, p] = await Promise.all([getGlobalStats(), getStatsByPG()])
        setStats(s.data)
        setPgStats(p.data)
      } catch {
        setError('Failed to load stats.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const needsAttention = !loading && stats && (
    stats.escalatedAdmissions > 0 || stats.totalPendingAdmissions > 0
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform overview — admissions, complaints, and PG health</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {needsAttention && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Attention Required</p>
          <div className="flex flex-wrap gap-3">
            {stats.totalPendingAdmissions > 0 && (
              <Link
                to="/admin/residency"
                className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800 hover:bg-amber-100 transition-colors"
              >
                <span className="font-bold">{stats.totalPendingAdmissions}</span> pending admission{stats.totalPendingAdmissions !== 1 ? 's' : ''} →
              </Link>
            )}
            {stats.escalatedAdmissions > 0 && (
              <Link
                to="/admin/residency"
                className="flex items-center gap-2 bg-white border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
              >
                <span className="font-bold">{stats.escalatedAdmissions}</span> escalated admission{stats.escalatedAdmissions !== 1 ? 's' : ''} →
              </Link>
            )}
          </div>
        </div>
      )}

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Complaints</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Total"    value={stats?.totalComplaints}    color="blue" />
            <StatCard label="New"      value={stats?.pendingComplaints}  color="yellow"
              sub={stats?.pendingComplaints > 0 ? 'Awaiting owner review' : 'All clear'} />
            <StatCard label="Acknowledged" value={stats?.approvedComplaints} color="green" />
            <StatCard label="Verified" value={stats?.verifiedComplaints} color="purple" sub="From residents" />
          </>
        )}
      </div>

      {!loading && pgStats.length > 0 && (
        <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Complaints by PG</h2>
            <p className="text-xs text-gray-400 mt-0.5">Sorted by total (descending) — read-only view</p>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-5 py-2.5 grid grid-cols-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <span className="col-span-2">PG Name</span>
              <span className="text-center">Total</span>
              <span className="text-center">Verified</span>
            </div>
            {pgStats.slice(0, 10).map((row, i) => (
              <div key={row._id} className="px-5 py-3.5 grid grid-cols-4 items-center hover:bg-gray-50">
                <div className="col-span-2 flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-mono w-5 text-right">{i + 1}</span>
                  <span className="text-sm font-medium text-gray-900 truncate">{row.pgName || 'Unknown PG'}</span>
                </div>
                <div className="text-center">
                  <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                    row.complaintCount >= 5 ? 'bg-red-100 text-red-700' :
                    row.complaintCount >= 2 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {row.complaintCount}
                  </span>
                </div>
                <div className="text-center">
                  <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                    row.verifiedComplaints > 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {row.verifiedComplaints}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Admissions</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Admitted Guests"      value={stats?.totalAdmitted}          color="green" sub="Across all PGs" />
            <StatCard label="Pending Admissions"   value={stats?.totalPendingAdmissions} color="yellow"
              sub={stats?.totalPendingAdmissions > 0 ? 'Awaiting decision' : 'All clear'} />
            <StatCard label="Escalated Admissions" value={stats?.escalatedAdmissions}    color="red"
              sub={stats?.escalatedAdmissions > 0 ? 'Needs attention' : 'All clear'} />
          </>
        )}
      </div>

    </div>
  )
}
