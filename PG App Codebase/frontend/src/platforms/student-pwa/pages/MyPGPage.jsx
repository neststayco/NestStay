import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '@shared/context/AuthContext'
import { getPGDetails } from '@shared/api/pgs'
import client from '@shared/api/client'

const STATUS_COLORS = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-48 bg-gray-200 rounded-xl" />
      <div className="h-6 bg-gray-200 rounded w-1/2" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  )
}

export default function MyPGPage() {
  const { currentAdmission, isAdmitted } = useAuth()
  const navigate = useNavigate()

  const [pg, setPg] = useState(null)
  const [myComplaints, setMyComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const pgId = currentAdmission?.pgId?._id || currentAdmission?.pgId

  useEffect(() => {
    if (!isAdmitted || !pgId) {
      navigate('/', { replace: true })
      return
    }

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [pgRes, complaintsRes] = await Promise.all([
          getPGDetails(pgId),
          client.get('/complaints/mine').then(r => r.data),
        ])
        setPg(pgRes.pg)
        setMyComplaints(complaintsRes.data || [])
      } catch {
        setError('Failed to load your PG details.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [pgId, isAdmitted, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8"><Skeleton /></main>
      </div>
    )
  }

  if (error || !pg) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-red-600 mb-4">{error || 'PG not found'}</p>
          <button onClick={() => navigate('/')} className="text-sm text-action underline">
            &larr; Back to listings
          </button>
        </main>
      </div>
    )
  }

  const myComplaintsAtThisPG = myComplaints.filter(c => {
    const cPgId = c.pgId?._id || c.pgId
    return String(cPgId) === String(pgId)
  })

  const admittedDate = currentAdmission?.updatedAt || currentAdmission?.createdAt
  const processedByLabel = currentAdmission?.processedBy?.role === 'owner' ? 'PG Owner' : 'Platform Admin'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {pg.images?.length > 0 && (
          <div className="h-48 rounded-xl overflow-hidden">
            <img src={pg.images[0]} alt={pg.name} className="w-full h-full object-cover"
              onError={(e) => { e.target.src = 'https://placehold.co/800x400/e2e8f0/94a3b8?text=No+Image' }} />
          </div>
        )}

        <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{pg.name}</h1>
              <p className="text-gray-500 text-sm mt-1">
                {[pg.location?.area, pg.location?.city].filter(Boolean).join(', ')}
              </p>
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0">
              You live here
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
            Admitted {new Date(admittedDate).toLocaleDateString()} &middot; via {processedByLabel}
          </div>
        </div>

        <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">Have an issue?</p>
            <p className="text-xs text-gray-400 mt-0.5">Your complaint will carry verified-resident weight.</p>
          </div>
          <Link
            to={`/pgs/${pgId}/complaint`}
            className="bg-brand hover:bg-brand-light text-black text-sm font-semibold px-4 py-2 rounded-[10px] transition-colors"
          >
            Raise a Complaint
          </Link>
        </div>

        <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">My Complaints</h2>
          </div>
          {myComplaintsAtThisPG.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              You haven&apos;t raised any complaints at this PG yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {myComplaintsAtThisPG.map(c => (
                <div key={c._id} className="px-5 py-3.5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800 capitalize">{c.type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
