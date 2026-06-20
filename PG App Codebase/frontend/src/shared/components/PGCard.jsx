import { Link } from 'react-router-dom'

const PLACEHOLDER = 'https://placehold.co/400x220/f6f3f2/73787a?text=No+Image'

const FOOD_LABELS = {
  veg:      { label: 'Veg',          color: 'bg-green-50 text-green-700 border-green-100' },
  'non-veg':{ label: 'Non-veg',      color: 'bg-red-50 text-red-700 border-red-100' },
  both:     { label: 'Veg & Non-veg',color: 'bg-amber-50 text-amber-700 border-amber-100' },
}

const AMENITY_ICONS = {
  wifi:            'wifi',
  food:            'restaurant',
  ac:              'ac_unit',
  laundry:         'local_laundry_service',
  gym:             'fitness_center',
  cctv:            'videocam',
  parking:         'local_parking',
  'power backup':  'power',
  'water purifier':'water_drop',
  housekeeping:    'cleaning_services',
  'study room':    'menu_book',
}

function ShieldCheck() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
    </svg>
  )
}

function BookmarkIcon({ filled }) {
  return filled ? (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
    </svg>
  ) : (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3-7 3V5z" />
    </svg>
  )
}

export default function PGCard({ pg, basePath = '/pgs', isSaved = false, onSave }) {
  const image = pg.images?.[0]?.url || PLACEHOLDER
  const city = pg.location?.city || '—'
  const area = pg.location?.area || ''
  const rent = pg.pricing?.rent
  const food = pg.foodType ? FOOD_LABELS[pg.foodType] : null
  const remaining = pg.remainingCapacity
  const coords = pg.location?.coordinates
  const mapsUrl =
    coords?.lat && coords?.lng
      ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
      : pg.location?.address
      ? `https://www.google.com/maps/search/${encodeURIComponent(
          [pg.location.address, city].filter(Boolean).join(', ')
        )}`
      : null

  return (
    <Link
      to={`${basePath}/${pg._id}`}
      className="group card-lift block bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden"
      style={{ boxShadow: 'rgba(0,0,0,0.05) 0px 2px 8px, rgba(0,0,0,0.02) 0px 0px 1px' }}
    >
      {/* Image */}
      <div className="relative h-56 overflow-hidden bg-[#f6f3f2]">
        <img
          src={image}
          alt={pg.name}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
          onError={e => { e.target.src = PLACEHOLDER }}
        />

        {/* Layered bottom gradient for text contrast */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none" />

        {/* Verified badge — top left */}
        {pg.isVerified && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-xs bg-white/95 backdrop-blur-sm text-green-700 rounded-full px-2.5 py-1 font-semibold border border-green-100"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
            <ShieldCheck /> Verified
          </span>
        )}

        {/* Gender badge — top right */}
        {pg.accommodation?.gender && (
          <span className="absolute top-3 right-3 text-xs bg-white/90 backdrop-blur-sm text-[#222121] rounded-full px-2.5 py-1 capitalize font-medium"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}>
            {pg.accommodation.gender}
          </span>
        )}

        {/* Availability pill — bottom left, over gradient */}
        {remaining != null && (
          <span className={`absolute bottom-3 left-3 text-xs rounded-full px-2.5 py-1 font-semibold ${
            remaining === 0
              ? 'bg-red-500 text-white'
              : remaining <= 2
              ? 'bg-amber-400 text-white'
              : 'bg-white/90 backdrop-blur-sm text-[#222121]'
          }`}
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
            {remaining === 0 ? 'Fully Booked' : remaining <= 2 ? `Only ${remaining} left!` : `${remaining} bed${remaining !== 1 ? 's' : ''} left`}
          </span>
        )}

        {/* Save — bottom right, only when handler provided */}
        {onSave && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onSave(pg._id) }}
            className={`absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 ${
              isSaved
                ? 'bg-[#e98a76] text-white scale-110'
                : 'bg-white/90 text-[#6c757d] hover:text-[#e98a76] hover:bg-white hover:scale-110'
            }`}
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
            title={isSaved ? 'Unsave' : 'Save'}
          >
            <BookmarkIcon filled={isSaved} />
          </button>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">

        {/* Name */}
        <h3 className="font-bold text-[#1b1c1c] text-[15px] leading-snug line-clamp-1 mb-1 group-hover:text-[#e98a76] transition-colors duration-200">
          {pg.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 mb-3">
          <svg className="w-3 h-3 text-[#9ca3af] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span className="text-xs text-[#73787a] truncate">
            {area ? `${area}, ` : ''}{city}
          </span>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex-shrink-0 text-[10px] text-[#e98a76] hover:underline font-semibold ml-auto"
            >
              Map ↗
            </a>
          )}
        </div>

        {/* Price + food type */}
        <div className="flex items-end justify-between gap-2 mb-3">
          <div className="leading-none">
            {rent ? (
              <>
                <span className="text-[22px] font-bold text-[#1b1c1c] tracking-tight">
                  &#8377;{rent.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-[#9ca3af] ml-0.5">/mo</span>
              </>
            ) : (
              <span className="text-sm text-[#9ca3af]">Price on request</span>
            )}
          </div>
          {food && (
            <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border flex-shrink-0 ${food.color}`}>
              {food.label}
            </span>
          )}
        </div>

        {/* Amenities with icons */}
        {pg.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pg.amenities.slice(0, 4).map(a => {
              const icon = AMENITY_ICONS[a.toLowerCase()] || 'check_circle'
              return (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 text-[11px] bg-[#f6f3f2] text-[#6c757d] rounded-lg px-2 py-0.5 capitalize font-medium"
                >
                  <span
                    className="material-symbols-outlined text-[#e98a76]"
                    style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}
                  >{icon}</span>
                  {a}
                </span>
              )
            })}
            {pg.amenities.length > 4 && (
              <span className="text-[11px] text-[#9ca3af] py-0.5 self-center">
                +{pg.amenities.length - 4}
              </span>
            )}
          </div>
        )}

      </div>
    </Link>
  )
}
