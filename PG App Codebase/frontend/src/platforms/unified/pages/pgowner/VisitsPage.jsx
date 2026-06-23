import { useState, useEffect } from 'react'
import { getOwnerVisits } from '@shared/api/visits'
import { useToast } from '@shared/components/Toast'
import PageHeader from '../../components/PageHeader'
import PageContainer from '../../components/PageContainer'
import { SkeletonBase } from '@shared/components/Skeleton'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const m = parseInt(parts[1], 10) - 1
  return `${parseInt(parts[2], 10)} ${months[m] || '?'} ${parts[0]}`
}

function formatTime(timeStr) {
  if (!timeStr) return '—'
  const [h, m] = timeStr.split(':').map(Number)
  if (isNaN(h)) return timeStr
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function OwnerVisitsPage() {
  const toast = useToast()
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOwnerVisits()
      .then(res => setVisits(res.data || []))
      .catch(() => toast('Failed to load visits', 'error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageContainer size="lg">
      <PageHeader
        title="Visit Requests"
        subtitle="Students who requested an in-person visit to your PG"
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBase key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : visits.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl py-16 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#f6f3f2] flex items-center justify-center mb-4 text-[#73787a]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#1b1c1c] mb-1">No visit requests yet</p>
          <p className="text-xs text-[#73787a]">Students can request a visit from your PG detail page.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#e0e0e0] rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f6f3f2] border-b border-[#e5e5e5]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">PG</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {visits.map(v => (
                  <tr key={v._id} className="hover:bg-[#fbf9f8] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#1b1c1c]">{v.userId?.name || '—'}</td>
                    <td className="px-4 py-3 text-[#434849]">{v.userId?.phoneNumber || v.userId?.email || '—'}</td>
                    <td className="px-4 py-3 text-[#434849]">{v.pgId?.name || '—'}</td>
                    <td className="px-4 py-3 text-[#434849] whitespace-nowrap">{formatDate(v.visitDate)}</td>
                    <td className="px-4 py-3 text-[#434849] whitespace-nowrap">{formatTime(v.visitTime)}</td>
                    <td className="px-4 py-3 text-[#73787a] text-xs whitespace-nowrap">
                      {new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
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
