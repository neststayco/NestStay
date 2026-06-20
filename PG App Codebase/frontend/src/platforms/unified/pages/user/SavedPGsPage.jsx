import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import UserNavbar from '../../components/UserNavbar'
import OfflineBanner from '@shared/components/OfflineBanner'
import PGCard from '@shared/components/PGCard'
import { getSavedPGs } from '@shared/api/user'
import { useAuth } from '@shared/context/AuthContext'
import { SkeletonGridCard } from '@shared/components/Skeleton'

export default function SavedPGsPage() {
  const { savedPGIds, toggleSave } = useAuth()
  const [pgs, setPgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getSavedPGs()
      .then(res => setPgs(res.data || []))
      .catch(() => setError('Failed to load saved PGs'))
      .finally(() => setLoading(false))
  }, [])

  function handleUnsave(pgId) {
    toggleSave(pgId)
    setPgs(prev => prev.filter(pg => pg._id !== pgId))
  }

  return (
    <div className="min-h-screen bg-[#fbf9f8]">
      <OfflineBanner />
      <UserNavbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1b1c1c]">Saved PGs</h1>
          <p className="text-sm text-[#73787a] mt-1">PGs you've bookmarked for later</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 mb-6">{error}</div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => <SkeletonGridCard key={i} />)}
          </div>
        ) : pgs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-[#f6f3f2] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[#73787a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3-7 3V5z" />
              </svg>
            </div>
            <p className="font-semibold text-[#1b1c1c] mb-1">No saved PGs yet</p>
            <p className="text-sm text-[#73787a] mb-5">Tap the bookmark icon on any PG to save it here</p>
            <Link
              to="/user"
              className="inline-flex items-center gap-2 bg-[#e98a76] hover:opacity-90 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
            >
              Browse PGs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pgs.map(pg => (
              <PGCard
                key={pg._id}
                pg={pg}
                basePath="/user/pgs"
                isSaved={savedPGIds.has(pg._id)}
                onSave={handleUnsave}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
