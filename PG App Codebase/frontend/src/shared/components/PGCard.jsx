import { Link } from 'react-router-dom'

function ShieldIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
    </svg>
  )
}

const PLACEHOLDER = 'https://placehold.co/400x220/e2e8f0/94a3b8?text=No+Image'

const FOOD_LABELS = {
  veg: { label: 'Veg', color: 'bg-green-100 text-green-700' },
  'non-veg': { label: 'Non-veg', color: 'bg-red-100 text-red-700' },
  both: { label: 'Veg & Non-veg', color: 'bg-amber-100 text-amber-700' },
}

function MapPinIcon() {
  return (
    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  )
}

export default function PGCard({ pg, basePath = '/pgs' }) {
  const image = pg.images?.[0]?.url || PLACEHOLDER
  const city = pg.location?.city || '—'
  const area = pg.location?.area || ''
  const rent = pg.pricing?.rent
  const food = pg.foodType ? FOOD_LABELS[pg.foodType] : null
  const remaining = pg.remainingCapacity
  const coords = pg.location?.coordinates
  const mapsUrl = coords?.lat && coords?.lng
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : pg.location?.address
    ? `https://www.google.com/maps/search/${encodeURIComponent([pg.location.address, city].filter(Boolean).join(', '))}`
    : null

  return (
    <Link
      to={`${basePath}/${pg._id}`}
      className="group block bg-white rounded-[20px] border border-[#e0e0e0] overflow-hidden hover:shadow-md hover:border-[#d0d0d0] transition-all"
      style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 4px 10px 0px' }}
    >
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={pg.name}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          onError={(e) => { e.target.src = PLACEHOLDER }}
        />
        {pg.isVerified && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-xs bg-green-600 text-white rounded-full px-2 py-0.5 font-semibold shadow-sm">
            <ShieldIcon /> Verified
          </span>
        )}
        {pg.accommodation?.gender && (
          <span className="absolute top-2 right-2 text-xs bg-white/90 text-[#222121] border border-[#e0e0e0] rounded-full px-2 py-0.5 capitalize font-medium">
            {pg.accommodation.gender}
          </span>
        )}
      </div>

      <div className="p-4 space-y-2">
        <div>
          <h3 className="font-semibold text-[#222121] text-sm leading-snug line-clamp-1">
            {pg.name}
          </h3>
          <div className="flex items-center gap-1 mt-0.5">
            <p className="text-xs text-[#6c757d] truncate">
              {area ? `${area}, ` : ''}{city}
            </p>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 inline-flex items-center gap-0.5 text-xs text-[#027fff] hover:underline"
              >
                <MapPinIcon /> Map
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            {rent ? (
              <span className="text-[#222121] font-bold text-sm">
                &#8377;{rent.toLocaleString('en-IN')}
                <span className="text-[#6c757d] font-normal text-xs">/mo</span>
              </span>
            ) : (
              <span className="text-[#6c757d] text-xs">Rent not listed</span>
            )}
          </div>
          {food && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${food.color}`}>
              {food.label}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1 pt-1">
          {pg.amenities?.slice(0, 3).map((a) => (
            <span key={a} className="text-xs bg-gray-100 text-[#6c757d] rounded px-1.5 py-0.5 capitalize">
              {a}
            </span>
          ))}
          {pg.amenities?.length > 3 && (
            <span className="text-xs text-[#6c757d]">+{pg.amenities.length - 3} more</span>
          )}
          {remaining != null && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ml-auto ${remaining === 0 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
              {remaining === 0 ? 'Full' : `${remaining} beds left`}
            </span>
          )}
        </div>
        {pg.meta != null && (
          <div className="flex items-center gap-2 pt-1 border-t border-gray-100 mt-1">
            {pg.meta.trustScore > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-100 rounded px-1.5 py-0.5 font-medium">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
                Trust {pg.meta.trustScore}
              </span>
            )}
            {pg.meta.complaintCount > 0 && (
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 font-medium">
                {pg.meta.complaintCount} complaint{pg.meta.complaintCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
