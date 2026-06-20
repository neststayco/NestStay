import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getPGList, createPG, updatePG, deletePG } from '@shared/api/pgs'
import PGImageUploader from '@shared/components/PGImageUploader'
import { SkeletonTable } from '@shared/components/Skeleton'

function slugify(name) {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

const EMPTY_FORM = {
  name: '', slug: '', description: '',
  location: { city: '', area: '', address: '', state: '', country: '', lat: '', lng: '' },
  pricing: { rent: '', deposit: '', maintenance: '' },
  accommodation: { gender: '', totalCapacity: '' },
  foodType: '',
  amenities: '',
  imageFiles: [],
  existingImages: [],
  owner: { name: '', phone: '', email: '', isVerified: false },
  isVerified: false,
}

function pgToForm(pg) {
  return {
    name: pg.name || '',
    slug: pg.slug || '',
    description: pg.description || '',
    location: {
      city: pg.location?.city || '',
      area: pg.location?.area || '',
      address: pg.location?.address || '',
      state: pg.location?.state || '',
      country: pg.location?.country || '',
      lat: pg.location?.coordinates?.lat ?? '',
      lng: pg.location?.coordinates?.lng ?? '',
    },
    pricing: {
      rent: pg.pricing?.rent ?? '',
      deposit: pg.pricing?.deposit ?? '',
      maintenance: pg.pricing?.maintenance ?? '',
    },
    accommodation: {
      gender: pg.accommodation?.gender || '',
      totalCapacity: pg.accommodation?.totalCapacity ?? '',
    },
    foodType: pg.foodType || '',
    amenities: (pg.amenities || []).join(', '),
    imageFiles: [],
    existingImages: pg.images || [],
    owner: {
      name: pg.owner?.name || '',
      phone: pg.owner?.phone || '',
      email: pg.owner?.email || '',
      isVerified: pg.owner?.isVerified || false,
    },
    isVerified: pg.isVerified || false,
  }
}

function buildTextPayload(f) {
  return {
    name: f.name,
    slug: f.slug,
    description: f.description,
    location: {
      city: f.location.city, area: f.location.area,
      address: f.location.address, state: f.location.state, country: f.location.country,
      coordinates: (f.location.lat !== '' && f.location.lng !== '')
        ? { lat: Number(f.location.lat), lng: Number(f.location.lng) }
        : undefined,
    },
    pricing: {
      rent: f.pricing.rent !== '' ? Number(f.pricing.rent) : undefined,
      deposit: f.pricing.deposit !== '' ? Number(f.pricing.deposit) : undefined,
      maintenance: f.pricing.maintenance !== '' ? Number(f.pricing.maintenance) : undefined,
    },
    accommodation: {
      gender: f.accommodation.gender,
      totalCapacity: f.accommodation.totalCapacity !== '' ? Number(f.accommodation.totalCapacity) : undefined,
    },
    foodType: f.foodType || undefined,
    amenities: f.amenities.split(',').map(s => s.trim()).filter(Boolean),
    owner: { ...f.owner },
    isVerified: f.isVerified,
  }
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-[#e0e0e0] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action focus:border-action bg-gray-50'

function PGFormModal({ editPG, onClose, onSaved }) {
  const isEdit = Boolean(editPG)
  const [form, setForm] = useState(isEdit ? pgToForm(editPG) : EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function setField(path, value) {
    setForm(prev => {
      const parts = path.split('.')
      if (parts.length === 1) return { ...prev, [path]: value }
      return { ...prev, [parts[0]]: { ...prev[parts[0]], [parts[1]]: value } }
    })
  }

  function handleNameChange(val) {
    setField('name', val)
    if (!isEdit) setField('slug', slugify(val))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name || !form.slug || !form.description) {
      setError('Name, slug, and description are required.')
      return
    }
    if (!isEdit && form.imageFiles.length < 3) {
      setError('Minimum 3 images required.')
      return
    }
    if (form.imageFiles.length > 10) {
      setError('Maximum 10 images allowed.')
      return
    }
    setLoading(true)
    try {
      const textPayload = buildTextPayload(form)
      const res = isEdit
        ? await updatePG(editPG._id, textPayload, form.imageFiles)
        : await createPG(textPayload, form.imageFiles)
      onSaved(res.data, isEdit)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save PG.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-900">{isEdit ? 'Edit PG' : 'Add New PG'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Basic Info</p>
            <div className="space-y-3">
              <Field label="Name" required>
                <input className={inputCls} value={form.name}
                  onChange={e => handleNameChange(e.target.value)} placeholder="Sunshine PG" />
              </Field>
              <Field label="Slug" required>
                <input className={inputCls} value={form.slug}
                  onChange={e => setField('slug', e.target.value)} placeholder="sunshine-pg" />
                <p className="text-xs text-gray-400 mt-1">Auto-generated from name. Must be unique.</p>
              </Field>
              <Field label="Description" required>
                <textarea className={`${inputCls} resize-none`} rows={3} value={form.description}
                  onChange={e => setField('description', e.target.value)} placeholder="Describe the PG…" />
              </Field>
            </div>
          </section>

          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Location</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <input className={inputCls} value={form.location.city}
                  onChange={e => setField('location.city', e.target.value)} placeholder="Pune" />
              </Field>
              <Field label="Area">
                <input className={inputCls} value={form.location.area}
                  onChange={e => setField('location.area', e.target.value)} placeholder="Kothrud" />
              </Field>
              <Field label="State">
                <input className={inputCls} value={form.location.state}
                  onChange={e => setField('location.state', e.target.value)} placeholder="Maharashtra" />
              </Field>
              <Field label="Country">
                <input className={inputCls} value={form.location.country}
                  onChange={e => setField('location.country', e.target.value)} placeholder="India" />
              </Field>
              <div className="col-span-2">
                <Field label="Address">
                  <input className={inputCls} value={form.location.address}
                    onChange={e => setField('location.address', e.target.value)} placeholder="123, Main Road…" />
                </Field>
              </div>
              <Field label="Latitude">
                <input type="number" step="any" className={inputCls} value={form.location.lat}
                  onChange={e => setField('location.lat', e.target.value)} placeholder="18.5204" />
              </Field>
              <Field label="Longitude">
                <input type="number" step="any" className={inputCls} value={form.location.lng}
                  onChange={e => setField('location.lng', e.target.value)} placeholder="73.8567" />
              </Field>
            </div>
          </section>

          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Pricing (₹)</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Rent/mo">
                <input type="number" className={inputCls} value={form.pricing.rent}
                  onChange={e => setField('pricing.rent', e.target.value)} placeholder="6000" />
              </Field>
              <Field label="Deposit">
                <input type="number" className={inputCls} value={form.pricing.deposit}
                  onChange={e => setField('pricing.deposit', e.target.value)} placeholder="12000" />
              </Field>
              <Field label="Maintenance">
                <input type="number" className={inputCls} value={form.pricing.maintenance}
                  onChange={e => setField('pricing.maintenance', e.target.value)} placeholder="500" />
              </Field>
            </div>
          </section>

          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Accommodation</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gender">
                <select className={`${inputCls} bg-white`} value={form.accommodation.gender}
                  onChange={e => setField('accommodation.gender', e.target.value)}>
                  <option value="">Any</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="mixed">Mixed</option>
                </select>
              </Field>
              <Field label="Total capacity">
                <input type="number" className={inputCls} value={form.accommodation.totalCapacity}
                  onChange={e => setField('accommodation.totalCapacity', e.target.value)} placeholder="20" />
              </Field>
              <Field label="Food type">
                <select className={`${inputCls} bg-white`} value={form.foodType}
                  onChange={e => setField('foodType', e.target.value)}>
                  <option value="">Not specified</option>
                  <option value="veg">Veg only</option>
                  <option value="non-veg">Non-veg</option>
                  <option value="both">Veg & Non-veg</option>
                </select>
              </Field>
            </div>
          </section>

          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Amenities</p>
            <Field label="Amenities (comma-separated)">
              <input className={inputCls} value={form.amenities}
                onChange={e => setField('amenities', e.target.value)}
                placeholder="WiFi, Food, AC, Laundry, Parking" />
            </Field>
            {form.amenities && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.amenities.split(',').map(a => a.trim()).filter(Boolean).map(a => (
                  <span key={a} className="text-xs bg-gray-100 text-gray-700 border border-gray-200 rounded px-2 py-0.5">{a}</span>
                ))}
              </div>
            )}
          </section>

          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Images</p>

            {isEdit && form.existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">
                  Current images ({form.existingImages.length})
                  {form.imageFiles.length > 0 && (
                    <span className="ml-1 text-amber-600"> — will be replaced on save</span>
                  )}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {form.existingImages.map((img, i) => (
                    <img
                      key={i}
                      src={img.url}
                      alt={`Image ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              </div>
            )}

            <PGImageUploader
              files={form.imageFiles}
              onChange={(files) => setField('imageFiles', files)}
              required={!isEdit}
            />
          </section>

          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Owner Info</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name">
                <input className={inputCls} value={form.owner.name}
                  onChange={e => setField('owner.name', e.target.value)} placeholder="Owner name" />
              </Field>
              <Field label="Phone">
                <input className={inputCls} value={form.owner.phone}
                  onChange={e => setField('owner.phone', e.target.value)} placeholder="+91 …" />
              </Field>
              <div className="col-span-2">
                <Field label="Email">
                  <input type="email" className={inputCls} value={form.owner.email}
                    onChange={e => setField('owner.email', e.target.value)} placeholder="owner@example.com" />
                </Field>
              </div>
            </div>
            <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 accent-action"
                checked={form.owner.isVerified}
                onChange={e => setField('owner.isVerified', e.target.checked)} />
              <span className="text-sm text-gray-700">Owner is verified</span>
            </label>
          </section>

          <section>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 accent-action"
                checked={form.isVerified}
                onChange={e => setField('isVerified', e.target.checked)} />
              <span className="text-sm font-medium text-gray-700">Mark this PG as verified</span>
            </label>
          </section>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 border border-[#e0e0e0] text-gray-700 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-[10px] transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-brand hover:bg-brand-light disabled:opacity-60 text-black text-sm font-semibold py-2.5 rounded-[10px] transition-colors">
            {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create PG'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDialog({ pg, onCancel, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="font-bold text-gray-900 mb-1">Deactivate PG?</h3>
        <p className="text-sm text-gray-500 mb-5">
          <strong>{pg.name}</strong> will be hidden from guests. Existing complaints are preserved.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 border border-[#e0e0e0] text-gray-700 hover:bg-gray-50 text-sm font-medium py-2 rounded-[10px] transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-medium py-2 rounded-[10px] transition-colors">
            {loading ? 'Deactivating…' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PGManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get('page') || '1', 10)

  const [pgs, setPgs] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [deactivating, setDeactivating] = useState(false)
  const [togglingVerify, setTogglingVerify] = useState(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimer = useRef(null)

  function setPage(p) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (p > 1) next.set('page', String(p))
      else next.delete('page')
      return next
    }, { replace: false })
  }

  const loadPGs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 12 }
      if (debouncedSearch) params.search = debouncedSearch
      const res = await getPGList(params)
      setPgs(res.data)
      setPagination(res.pagination)
    } catch {
      setError('Failed to load PGs.')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  function handleSearchChange(e) {
    const val = e.target.value
    setSearch(val)
    setPage(1)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(val), 400)
  }

  useEffect(() => { loadPGs() }, [loadPGs])

  function handleSaved(pg, isEdit) {
    if (isEdit) {
      setPgs(prev => prev.map(p => p._id === pg._id ? pg : p))
    } else {
      setPgs(prev => [pg, ...prev])
    }
    setFormOpen(false)
    setEditTarget(null)
  }

  async function handleToggleVerify(pg) {
    setTogglingVerify(pg._id)
    try {
      const res = await updatePG(pg._id, { isVerified: !pg.isVerified })
      setPgs(prev => prev.map(p => p._id === pg._id ? res.data : p))
    } catch {
      setError('Failed to update verification status.')
    } finally {
      setTogglingVerify(null)
    }
  }

  async function handleDeactivate() {
    if (!confirmTarget) return
    setDeactivating(true)
    try {
      await deletePG(confirmTarget._id)
      setPgs(prev => prev.filter(p => p._id !== confirmTarget._id))
      setConfirmTarget(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate PG.')
      setConfirmTarget(null)
    } finally {
      setDeactivating(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PG Listings</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage PG properties on the platform
            <span className="ml-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
              Active PGs only
            </span>
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
          className="flex items-center gap-2 bg-brand hover:bg-brand-light text-black text-sm font-semibold px-4 py-2.5 rounded-[10px] transition-colors whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add PG
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name or location…"
          className="w-full max-w-sm border border-[#e0e0e0] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action focus:border-action bg-gray-50"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Rent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Gender</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            {loading
              ? <SkeletonTable rows={8} cols={7} />
              : <tbody className="divide-y divide-gray-100">
                  {pgs.length === 0
                    ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No PGs found</td>
                      </tr>
                    )
                    : pgs.map(pg => (
                  <tr key={pg._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-gray-900 max-w-[160px] truncate">{pg.name}</div>
                      <div className="text-xs text-gray-400 font-mono truncate max-w-[160px]">{pg.slug}</div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                      {[pg.location?.area, pg.location?.city].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#222121] whitespace-nowrap">
                      {pg.pricing?.rent ? `₹${pg.pricing.rent.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3.5 capitalize text-gray-600">{pg.accommodation?.gender || '—'}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${pg.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {pg.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {pg.isVerified && (
                          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 text-xs">
                      <div>{pg.owner?.name || '—'}</div>
                      {pg.owner?.isVerified && <div className="text-green-600 font-medium">✓ verified</div>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditTarget(pg); setFormOpen(true) }}
                          className="text-xs font-medium px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-[10px] transition-colors">
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleVerify(pg)}
                          disabled={togglingVerify === pg._id}
                          title={pg.isVerified ? 'Remove verification' : 'Mark as verified'}
                          className={`text-xs font-medium px-3 py-1.5 rounded-[10px] transition-colors disabled:opacity-50 ${pg.isVerified ? 'bg-green-100 hover:bg-green-200 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}
                        >
                          {togglingVerify === pg._id ? '…' : pg.isVerified ? '✓ Verified' : 'Verify'}
                        </button>
                        <button onClick={() => setConfirmTarget(pg)}
                          className="text-xs font-medium px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-[10px] transition-colors">
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
            }
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {pagination.totalItems} total · page {pagination.currentPage} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="text-sm px-3 py-1.5 border border-[#e0e0e0] rounded-[10px] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                ← Prev
              </button>
              <button onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page === pagination.totalPages}
                className="text-sm px-3 py-1.5 border border-[#e0e0e0] rounded-[10px] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {formOpen && (
        <PGFormModal
          editPG={editTarget}
          onClose={() => { setFormOpen(false); setEditTarget(null) }}
          onSaved={handleSaved}
        />
      )}
      {confirmTarget && (
        <ConfirmDialog
          pg={confirmTarget}
          onCancel={() => setConfirmTarget(null)}
          onConfirm={handleDeactivate}
          loading={deactivating}
        />
      )}
    </div>
  )
}