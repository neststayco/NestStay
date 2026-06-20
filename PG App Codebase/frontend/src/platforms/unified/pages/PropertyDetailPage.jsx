import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import PublicNavbar from '../components/PublicNavbar'
import { getPGDetails } from '@shared/api/pgs'
import { SkeletonPGDetail } from '@shared/components/Skeleton'

function WhatsAppIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.38 1.26 4.8L2 22l5.44-1.37a9.9 9.9 0 004.6 1.16c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.49 0-2.93-.4-4.18-1.16l-.3-.18-3.12.79.82-3.02-.2-.31A8.16 8.16 0 013.87 12c0-4.54 3.69-8.23 8.17-8.23 4.47 0 8.16 3.69 8.16 8.17s-3.69 8.21-8.16 8.21zm4.49-6.12c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.97-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-.12-.73-.66-1.23-1.47-1.37-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.44.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.12.16 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.46-.6 1.67-1.18.21-.57.21-1.07.14-1.18-.07-.1-.23-.16-.48-.28z" />
    </svg>
  )
}

function ImageGallery({ images, name }) {
  const [active, setActive] = useState(0)
  const [errors, setErrors] = useState({})

  if (images.length === 0) {
    return (
      <div className="bg-[#f6f3f2] rounded-2xl h-64 sm:h-80 flex flex-col items-center justify-center gap-3 border border-[#E5E7EB]">
        <span className="material-symbols-outlined text-[64px] text-[#d1d5db]">apartment</span>
        <p className="text-sm text-[#9ca3af]">No photos available</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative bg-[#f6f3f2] rounded-2xl overflow-hidden h-64 sm:h-80 border border-[#E5E7EB]">
        {!errors[active] ? (
          <img
            src={images[active]}
            alt={`${name} — photo ${active + 1}`}
            className="w-full h-full object-cover"
            onError={() => setErrors(prev => ({ ...prev, [active]: true }))}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[64px] text-[#d1d5db]">apartment</span>
            <span className="text-sm text-[#9ca3af]">Photo unavailable</span>
          </div>
        )}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActive(a => Math.max(0, a - 1))}
              disabled={active === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow disabled:opacity-30 hover:bg-white transition-all"
              aria-label="Previous photo"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button
              onClick={() => setActive(a => Math.min(images.length - 1, a + 1))}
              disabled={active === images.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow disabled:opacity-30 hover:bg-white transition-all"
              aria-label="Next photo"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
              {active + 1} / {images.length}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-16 h-12 rounded-xl overflow-hidden border-2 transition-all ${i === active ? 'border-[#e98a76]' : 'border-transparent opacity-70 hover:opacity-100'}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ErrorState({ error, onBack }) {
  return (
    <div className="min-h-screen bg-[#fbf9f8]">
      <PublicNavbar />
      <main className="pt-14 flex items-center justify-center min-h-[60vh] px-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-[#fef3f0] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[28px] text-[#e98a76]">error_outline</span>
          </div>
          <p className="font-semibold text-[#1b1c1c] mb-2">Property not found</p>
          <p className="text-sm text-[#73787a] mb-6">{error}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={onBack}
              className="w-full h-[44px] bg-[#e98a76] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
            >
              Back to Properties
            </button>
            <Link to="/" className="text-sm text-[#73787a] hover:text-[#1b1c1c] transition-colors">
              Go to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

function ContactCard({ pg, whatsappMsg }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sticky top-20 space-y-3">
      <h2 className="font-bold text-[#1b1c1c] text-base">Interested in this PG?</h2>
      <p className="text-sm text-[#73787a] leading-relaxed">
        Contact NestStay to enquire about <strong className="text-[#1b1c1c]">{pg.name}</strong>. Zero brokerage.
      </p>
      <a
        href={`https://wa.me/919970114079?text=${whatsappMsg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full h-[48px] bg-[#25d366] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
      >
        <WhatsAppIcon />
        WhatsApp Us
      </a>
      <a
        href="tel:+919970114079"
        className="flex items-center justify-center gap-2 w-full h-[44px] border border-[#d1d5db] rounded-xl text-sm font-semibold text-[#1b1c1c] hover:bg-[#f3f4f6] transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">call</span>
        +91 99701 14079
      </a>
      <Link
        to="/register"
        className="flex items-center justify-center w-full h-[48px] bg-[#e98a76] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-[0_4px_12px_rgba(233,138,118,0.35)]"
      >
        Register &amp; Apply
      </Link>
      <p className="text-[11px] text-[#73787a] text-center leading-relaxed">
        Create a free account to save listings, apply for admission, and track your application.
      </p>
    </div>
  )
}

export default function PropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getPGDetails(id)
      .then(res => setData(res))
      .catch(err => {
        const status = err.response?.status
        if (status === 404) setError('This property is no longer available or does not exist.')
        else if (status === 400) setError('Invalid property ID.')
        else setError('Failed to load property details. Please try again.')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (error) return <ErrorState error={error} onBack={() => navigate(-1)} />

  const pg = data?.pg
  const remainingCapacity = data?.remainingCapacity
  const images = pg?.images?.length > 0 ? pg.images.map(img => img?.url || img) : []
  const locationStr = [pg?.location?.area, pg?.location?.city, pg?.location?.state].filter(Boolean).join(', ')
  const whatsappMsg = pg ? encodeURIComponent(
    `Hi! I'm interested in ${pg.name}${pg.location?.area ? ` in ${pg.location.area}` : ''}. Can you share more details? (via NestStay)`
  ) : ''

  return (
    <div className="min-h-screen bg-[#fbf9f8]">
      <PublicNavbar />

      <main className="pt-14 pb-28 lg:pb-8">
        {loading ? (
          <div className="max-w-[1280px] mx-auto px-4 lg:px-16 py-8">
            <SkeletonPGDetail />
          </div>
        ) : (<>
        <div className="max-w-[1280px] mx-auto px-4 lg:px-16 pt-5 pb-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-[#73787a] hover:text-[#1b1c1c] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to properties
          </button>
        </div>

        <div className="max-w-[1280px] mx-auto px-4 lg:px-16 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column: main content */}
          <div className="lg:col-span-2 space-y-5">

            <ImageGallery images={images} name={pg.name} />

            {/* Title + location + key stats */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="bg-[#e98a76] text-white px-2.5 py-0.5 rounded-full text-xs font-semibold">VERIFIED</span>
                    {pg.accommodation?.gender && (
                      <span className="border border-[#E5E7EB] text-[#434849] px-2.5 py-0.5 rounded-full text-xs capitalize">
                        {pg.accommodation.gender}
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl font-bold text-[#1b1c1c] mb-1">{pg.name}</h1>
                  <div className="flex items-center gap-1 text-[#73787a] text-sm">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    <span>{locationStr || 'Pune'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                {pg.pricing?.rent && (
                  <div className="bg-[#fef3f0] rounded-xl p-3">
                    <p className="text-[10px] font-bold text-[#73787a] uppercase tracking-wide mb-1">Monthly Rent</p>
                    <p className="text-lg font-bold text-[#e98a76]">&#8377;{pg.pricing.rent.toLocaleString('en-IN')}</p>
                  </div>
                )}
                {pg.pricing?.deposit && (
                  <div className="bg-[#f6f3f2] rounded-xl p-3">
                    <p className="text-[10px] font-bold text-[#73787a] uppercase tracking-wide mb-1">Security Deposit</p>
                    <p className="text-lg font-bold text-[#1b1c1c]">&#8377;{pg.pricing.deposit.toLocaleString('en-IN')}</p>
                  </div>
                )}
                {remainingCapacity != null && (
                  <div className={`rounded-xl p-3 ${remainingCapacity === 0 ? 'bg-red-50' : 'bg-[#f0fdf4]'}`}>
                    <p className="text-[10px] font-bold text-[#73787a] uppercase tracking-wide mb-1">Availability</p>
                    <p className={`text-lg font-bold ${remainingCapacity === 0 ? 'text-red-600' : 'text-green-700'}`}>
                      {remainingCapacity === 0 ? 'Full' : `${remainingCapacity} beds`}
                    </p>
                  </div>
                )}
                {pg.pricing?.maintenance && (
                  <div className="bg-[#f6f3f2] rounded-xl p-3">
                    <p className="text-[10px] font-bold text-[#73787a] uppercase tracking-wide mb-1">Maintenance</p>
                    <p className="text-lg font-bold text-[#1b1c1c]">&#8377;{pg.pricing.maintenance.toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Room details */}
            {(pg.accommodation?.roomTypes?.length > 0 || pg.foodType || pg.accommodation?.totalCapacity) && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
                <h2 className="text-sm font-bold text-[#1b1c1c] uppercase tracking-wide mb-3">Room & Food Details</h2>
                <div className="flex flex-wrap gap-2">
                  {pg.accommodation?.roomTypes?.map(rt => (
                    <span key={rt} className="inline-flex items-center gap-1.5 text-sm bg-[#f6f3f2] text-[#434849] border border-[#E5E7EB] rounded-xl px-3 py-1.5 capitalize">
                      <span className="material-symbols-outlined text-[14px]">bed</span>
                      {rt}
                    </span>
                  ))}
                  {pg.foodType && (
                    <span className="inline-flex items-center gap-1.5 text-sm bg-[#f6f3f2] text-[#434849] border border-[#E5E7EB] rounded-xl px-3 py-1.5">
                      <span className="material-symbols-outlined text-[14px]">restaurant</span>
                      {pg.foodType === 'non-veg' ? 'Non-veg' : pg.foodType === 'both' ? 'Veg & Non-veg' : 'Veg only'}
                    </span>
                  )}
                  {pg.accommodation?.totalCapacity && (
                    <span className="inline-flex items-center gap-1.5 text-sm bg-[#f6f3f2] text-[#434849] border border-[#E5E7EB] rounded-xl px-3 py-1.5">
                      <span className="material-symbols-outlined text-[14px]">group</span>
                      {pg.accommodation.totalCapacity} total beds
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Amenities */}
            {pg.amenities?.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
                <h2 className="text-sm font-bold text-[#1b1c1c] uppercase tracking-wide mb-3">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {pg.amenities.map(a => (
                    <span key={a} className="inline-flex items-center text-sm bg-gray-100 text-gray-700 border border-[#E5E7EB] rounded-xl px-3 py-1.5 capitalize">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {pg.description && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
                <h2 className="text-sm font-bold text-[#1b1c1c] uppercase tracking-wide mb-3">About this PG</h2>
                <p className="text-sm text-[#434849] leading-relaxed">{pg.description}</p>
              </div>
            )}

            {/* Map */}
            {pg.location?.coordinates?.lat && (
              <a
                href={`https://www.google.com/maps?q=${pg.location.coordinates.lat},${pg.location.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-white rounded-2xl border border-[#E5E7EB] p-4 text-sm font-medium text-[#1b1c1c] hover:bg-[#f6f3f2] transition-colors"
              >
                <span className="material-symbols-outlined text-[#e98a76] text-[20px]">map</span>
                View Location on Google Maps
                <span className="material-symbols-outlined text-[#73787a] text-[16px]">open_in_new</span>
              </a>
            )}


            {/* Register CTA strip */}
            <div className="bg-[#101e22] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-white mb-0.5">Want to apply for this PG?</p>
                <p className="text-sm text-[#bac9ce]">Create a free NestStay account to apply, track your application, and move in hassle-free.</p>
              </div>
              <Link
                to="/register"
                className="flex-shrink-0 bg-[#e98a76] text-white px-6 h-[44px] rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                Register Free
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Right column: contact sidebar (desktop only) */}
          <div className="hidden lg:block">
            <ContactCard pg={pg} whatsappMsg={whatsappMsg} />
          </div>
        </div>
        </>)}
      </main>

      {/* Mobile sticky contact bar */}
      {!loading && <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-[#E5E7EB] px-4 py-3">
        <div className="flex gap-2 max-w-[1280px] mx-auto">
          <a
            href={`https://wa.me/919970114079?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 h-[48px] bg-[#25d366] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
          >
            <WhatsAppIcon />
            WhatsApp
          </a>
          <a
            href="tel:+919970114079"
            className="flex items-center justify-center gap-1.5 h-[48px] px-4 border border-[#d1d5db] rounded-xl text-sm font-semibold text-[#1b1c1c] hover:bg-[#f3f4f6] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">call</span>
            Call
          </a>
          <Link
            to="/register"
            className="flex-1 flex items-center justify-center h-[48px] bg-[#e98a76] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-[0_4px_12px_rgba(233,138,118,0.35)]"
          >
            Enquire
          </Link>
        </div>
      </div>}
    </div>
  )
}
