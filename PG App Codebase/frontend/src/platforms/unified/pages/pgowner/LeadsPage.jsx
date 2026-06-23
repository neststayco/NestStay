import { useState, useEffect } from 'react'
import { getOwnerLeads } from '@shared/api/leads'
import { useToast } from '@shared/components/Toast'
import PageHeader from '../../components/PageHeader'
import PageContainer from '../../components/PageContainer'
import { SkeletonBase } from '@shared/components/Skeleton'

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function LeadsPage() {
  const toast = useToast()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOwnerLeads()
      .then(res => setLeads(res.data || []))
      .catch(() => toast('Failed to load leads', 'error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageContainer size="lg">
      <PageHeader
        title="Interested Leads"
        subtitle="People who spent time browsing your PG listing"
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBase key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl py-16 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#f6f3f2] flex items-center justify-center mb-4 text-[#73787a]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#1b1c1c] mb-1">No leads yet</p>
          <p className="text-xs text-[#73787a]">When logged-in users browse your PG for 5+ seconds, they appear here.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#e0e0e0] rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f6f3f2] border-b border-[#e5e5e5]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">PG</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Visits</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Last Viewed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {leads.map(l => (
                  <tr key={l._id} className="hover:bg-[#fbf9f8] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#1b1c1c]">{l.userId?.name || '—'}</td>
                    <td className="px-4 py-3 text-[#434849]">{l.userId?.phoneNumber || l.userId?.email || '—'}</td>
                    <td className="px-4 py-3 text-[#434849]">{l.pgId?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 bg-[#fff3ee] text-[#e98a76] text-xs font-semibold rounded-full px-2.5 py-0.5">
                        {l.visitCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#73787a] text-xs whitespace-nowrap">{timeAgo(l.lastViewedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
