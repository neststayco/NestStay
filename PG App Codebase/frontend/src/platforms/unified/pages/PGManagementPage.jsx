import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getPGList, createPG, updatePG, deactivatePG, restorePG, toggleVerifyPG, setPGLikesEnabled } from '@shared/api/pgs'
import { getTerms, updateTerms } from '@shared/api/terms'
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
  separateKitchenAvailable: false,
  imageFiles: [],
  existingImages: [],
  videoFile: null,
  existingVideo: null,
  owner: { name: '', phone: '', email: '', isVerified: false },
  isVerified: false,
  ownerAccount: { create: false, password: '' },
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
    separateKitchenAvailable: pg.separateKitchenAvailable || false,
    imageFiles: [],
    existingImages: pg.images || [],
    videoFile: null,
    existingVideo: pg.video || null,
    owner: {
      name: pg.owner?.name || '',
      phone: pg.owner?.phone || '',
      email: pg.owner?.email || '',
      isVerified: pg.owner?.isVerified || false,
    },
    isVerified: pg.isVerified || false,
  }
}

function buildTextPayload(f, isEdit) {
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
    separateKitchenAvailable: f.separateKitchenAvailable,
    owner: { ...f.owner },
    isVerified: f.isVerified,
    ...(!isEdit && f.ownerAccount.create ? { ownerAccount: { create: true, password: f.ownerAccount.password } } : {}),
  }
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#73787a] uppercase tracking-widest mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e98a76]/40 focus:border-[#e98a76] bg-white text-[#1b1c1c] placeholder-[#9ca3af] transition-colors'

function PGFormModal({ editPG, onClose, onSaved }) {
  const isEdit = Boolean(editPG)
  const [form, setForm] = useState(isEdit ? pgToForm(editPG) : EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [termsContent, setTermsContent] = useState(null)
  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    if (!isEdit) {
      getTerms().then(res => { if (res?.data?.content) setTermsContent(res.data.content) }).catch(() => {})
    }
  }, [isEdit])

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
    if (!isEdit && form.ownerAccount.create) {
      if (!form.owner.email) {
        setError('Owner email is required to create a login account.')
        return
      }
      if (!form.ownerAccount.password || form.ownerAccount.password.length < 8) {
        setError('Owner login password must be at least 8 characters.')
        return
      }
    }
    if (!isEdit && termsContent && !termsAccepted) {
      setError('You must accept the Terms & Conditions to create a PG.')
      return
    }
    setLoading(true)
    try {
      const textPayload = buildTextPayload(form, isEdit)
      const res = isEdit
        ? await updatePG(editPG._id, textPayload, form.imageFiles, form.videoFile)
        : await createPG(textPayload, form.imageFiles, form.videoFile)
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] flex-shrink-0">
          <h2 className="font-bold text-[#1b1c1c]">{isEdit ? 'Edit PG' : 'Add New PG'}</h2>
          <button onClick={onClose} className="text-[#73787a] hover:text-[#1b1c1c] p-1 transition-colors">
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
            <p className="text-xs font-bold text-[#73787a] uppercase tracking-widest mb-3">Basic Info</p>
            <div className="space-y-3">
              <Field label="Name" required>
                <input className={inputCls} value={form.name}
                  onChange={e => handleNameChange(e.target.value)} placeholder="Sunshine PG" />
              </Field>
              <Field label="Slug" required>
                <input className={inputCls} value={form.slug}
                  onChange={e => setField('slug', e.target.value)} placeholder="sunshine-pg" />
                <p className="text-xs text-[#73787a] mt-1">Auto-generated from name. Must be unique.</p>
              </Field>
              <Field label="Description" required>
                <textarea className={`${inputCls} resize-none`} rows={3} value={form.description}
                  onChange={e => setField('description', e.target.value)} placeholder="Describe the PG…" />
              </Field>
            </div>
          </section>

          <section>
            <p className="text-xs font-bold text-[#73787a] uppercase tracking-widest mb-3">Location</p>
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
            <p className="text-xs font-bold text-[#73787a] uppercase tracking-widest mb-3">Pricing (₹)</p>
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
            <p className="text-xs font-bold text-[#73787a] uppercase tracking-widest mb-3">Accommodation</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gender">
                <select className={`${inputCls} bg-white`} value={form.accommodation.gender}
                  onChange={e => setField('accommodation.gender', e.target.value)}>
                  <option value="">Any</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
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
            <p className="text-xs font-bold text-[#73787a] uppercase tracking-widest mb-3">Kitchen</p>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setForm(prev => ({ ...prev, separateKitchenAvailable: !prev.separateKitchenAvailable }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.separateKitchenAvailable ? 'bg-[#1b1c1c]' : 'bg-[#E5E7EB]'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.separateKitchenAvailable ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm text-[#434849]">Separate kitchen available</span>
            </label>
          </section>

          <section>
            <p className="text-xs font-bold text-[#73787a] uppercase tracking-widest mb-3">Amenities</p>
            <Field label="Amenities (comma-separated)">
              <input className={inputCls} value={form.amenities}
                onChange={e => setField('amenities', e.target.value)}
                placeholder="WiFi, Food, AC, Laundry, Parking" />
            </Field>
            {form.amenities && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.amenities.split(',').map(a => a.trim()).filter(Boolean).map(a => (
                  <span key={a} className="text-xs bg-[#f6f3f2] text-[#434849] border border-[#E5E7EB] rounded-full px-2.5 py-0.5 font-medium">{a}</span>
                ))}
              </div>
            )}
          </section>

          <section>
            <p className="text-xs font-bold text-[#73787a] uppercase tracking-widest mb-3">Images</p>

            {isEdit && form.existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-[#73787a] mb-2">
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
                      className="w-full aspect-square object-cover rounded-lg border border-[#E5E7EB]"
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
            <p className="text-xs font-bold text-[#73787a] uppercase tracking-widest mb-3">Video (optional)</p>
            {isEdit && form.existingVideo?.url && !form.videoFile && (
              <div className="mb-3">
                <p className="text-xs text-[#73787a] mb-2">Current video</p>
                <video src={form.existingVideo.url} controls className="w-full rounded-xl border border-[#E5E7EB] max-h-40" />
              </div>
            )}
            {form.videoFile && (
              <div className="mb-3">
                <p className="text-xs text-[#73787a] mb-2">New video preview</p>
                <video src={URL.createObjectURL(form.videoFile)} controls className="w-full rounded-xl border border-[#E5E7EB] max-h-40" />
                <button type="button" onClick={() => setForm(prev => ({ ...prev, videoFile: null }))}
                  className="mt-1 text-xs text-red-500 hover:text-red-700">Remove</button>
              </div>
            )}
            <label className={`${inputCls} flex items-center gap-2 cursor-pointer py-2.5`}>
              <svg className="w-4 h-4 text-[#73787a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-[#73787a]">{form.videoFile ? form.videoFile.name : 'Choose video (max 15 sec)'}</span>
              <input type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file) return
                  const url = URL.createObjectURL(file)
                  const vid = document.createElement('video')
                  vid.src = url
                  vid.onloadedmetadata = () => {
                    URL.revokeObjectURL(url)
                    if (vid.duration > 15) {
                      setError('Video must be 15 seconds or shorter.')
                    } else {
                      setError('')
                      setForm(prev => ({ ...prev, videoFile: file }))
                    }
                  }
                }} />
            </label>
            <p className="text-xs text-[#73787a] mt-1">MP4, MOV, WebM · max 15 seconds</p>
          </section>

          <section>
            <p className="text-xs font-bold text-[#73787a] uppercase tracking-widest mb-3">Owner Info</p>
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
            {!isEdit && (
              <div className="mt-4 border-t border-[#f0f0f0] pt-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="w-4 h-4 accent-[#e98a76]"
                    checked={form.ownerAccount.create}
                    onChange={e => setForm(prev => ({ ...prev, ownerAccount: { ...prev.ownerAccount, create: e.target.checked } }))} />
                  <span className="text-sm font-medium text-[#434849]">Create owner login account</span>
                </label>
                {form.ownerAccount.create && (
                  <div className="mt-3">
                    <Field label="Login Password" required>
                      <input type="password" className={inputCls} value={form.ownerAccount.password}
                        onChange={e => setForm(prev => ({ ...prev, ownerAccount: { ...prev.ownerAccount, password: e.target.value } }))}
                        placeholder="Min. 8 characters" autoComplete="new-password" />
                    </Field>
                    <p className="text-xs text-[#73787a] mt-1">Owner will log in with the email above and this password.</p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Terms & Conditions — create mode only */}
          {!isEdit && termsContent && (
            <section>
              <p className="text-xs font-bold text-[#73787a] uppercase tracking-widest mb-3">Terms &amp; Conditions</p>
              <div className="border border-[#E5E7EB] rounded-xl bg-[#f6f3f2] p-4 max-h-40 overflow-y-auto text-xs text-[#434849] leading-relaxed whitespace-pre-wrap mb-3">
                {termsContent}
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 accent-[#e98a76] flex-shrink-0"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                />
                <span className="text-sm text-[#434849]">
                  I have read and agree to the Terms &amp; Conditions above.
                </span>
              </label>
            </section>
          )}

        </form>

        <div className="px-6 py-4 border-t border-[#f0f0f0] flex gap-3 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 border border-[#E5E7EB] text-[#434849] hover:bg-[#f6f3f2] text-sm font-medium py-2.5 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading || (!isEdit && termsContent && !termsAccepted)}
            className="flex-1 bg-[#e98a76] hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-[0.98]">
            {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create PG'}
          </button>
        </div>
      </div>
    </div>
  )
}

const CONFIRM_CONFIG = {
  deactivate: {
    iconBg: 'bg-red-100', iconColor: 'text-red-600',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    title: 'Deactivate PG?',
    body: 'will be hidden from students. Owner login will be blocked. You can restore it later.',
    confirmLabel: 'Deactivate', loadingLabel: 'Deactivating…',
    btnClass: 'bg-red-500 hover:bg-red-600',
  },
  restore: {
    iconBg: 'bg-green-100', iconColor: 'text-green-600',
    iconPath: 'M5 13l4 4L19 7',
    title: 'Restore PG?',
    body: 'will become active and visible to students again. Owner login will be re-enabled.',
    confirmLabel: 'Restore', loadingLabel: 'Restoring…',
    btnClass: 'bg-green-600 hover:bg-green-700',
  },
}

function ConfirmDialog({ pg, mode, onCancel, onConfirm, loading }) {
  const c = CONFIRM_CONFIG[mode] || CONFIRM_CONFIG.deactivate
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${c.iconBg}`}>
          <svg className={`w-6 h-6 ${c.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.iconPath} />
          </svg>
        </div>
        <h3 className="font-bold text-[#1b1c1c] mb-1">{c.title}</h3>
        <p className="text-sm text-[#73787a] mb-5"><strong>{pg.name}</strong> {c.body}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 border border-[#E5E7EB] text-[#434849] hover:bg-[#f6f3f2] text-sm font-medium py-2 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 text-white text-sm font-medium py-2 rounded-xl transition-colors disabled:opacity-50 ${c.btnClass}`}>
            {loading ? c.loadingLabel : c.confirmLabel}
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
  const [confirmMode, setConfirmMode] = useState(null)
  const [deactivating, setDeactivating] = useState(false)
  const [togglingVerify, setTogglingVerify] = useState(null)
  const [togglingLikes, setTogglingLikes] = useState(null)

  const [termsEdit, setTermsEdit] = useState(null)
  const [termsDraft, setTermsDraft] = useState('')
  const [termsSaving, setTermsSaving] = useState(false)
  const [termsMsg, setTermsMsg] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
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
      if (statusFilter) params.status = statusFilter
      const res = await getPGList(params)
      setPgs(res.data)
      setPagination(res.pagination)
    } catch {
      setError('Failed to load PGs.')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, statusFilter])

  function handleSearchChange(e) {
    const val = e.target.value
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 400)
  }

  useEffect(() => { loadPGs() }, [loadPGs])

  useEffect(() => {
    getTerms().then(res => {
      if (res?.data?.content) { setTermsEdit(res.data.content); setTermsDraft(res.data.content) }
    }).catch(() => {})
  }, [])

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
      const res = await toggleVerifyPG(pg._id)
      setPgs(prev => prev.map(p => p._id === pg._id ? res.data : p))
    } catch {
      setError('Failed to update verification status.')
    } finally {
      setTogglingVerify(null)
    }
  }

  async function handleSaveTerms(e) {
    e.preventDefault()
    if (termsDraft.trim().length < 10) { setTermsMsg('Content must be at least 10 characters.'); return }
    setTermsSaving(true)
    setTermsMsg('')
    try {
      await updateTerms(termsDraft.trim())
      setTermsEdit(termsDraft.trim())
      setTermsMsg('Terms & Conditions updated.')
    } catch {
      setTermsMsg('Failed to update.')
    } finally {
      setTermsSaving(false)
    }
  }

  async function handleToggleLikes(pg) {
    setTogglingLikes(pg._id)
    try {
      const res = await setPGLikesEnabled(pg._id, !pg.likesEnabled)
      setPgs(prev => prev.map(p => p._id === pg._id ? { ...p, likesEnabled: res.data.likesEnabled } : p))
    } catch {
      setError('Failed to update likes setting.')
    } finally {
      setTogglingLikes(null)
    }
  }

  async function handleConfirm() {
    if (!confirmTarget) return
    setDeactivating(true)
    try {
      if (confirmMode === 'deactivate') {
        await deactivatePG(confirmTarget._id)
        setPgs(prev => prev.map(p => p._id === confirmTarget._id ? { ...p, status: 'inactive' } : p))
      } else if (confirmMode === 'restore') {
        await restorePG(confirmTarget._id)
        setPgs(prev => prev.map(p => p._id === confirmTarget._id ? { ...p, status: 'active' } : p))
      }
      setConfirmTarget(null)
      setConfirmMode(null)
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${confirmMode} PG.`)
      setConfirmTarget(null)
      setConfirmMode(null)
    } finally {
      setDeactivating(false)
    }
  }

  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-[#1b1c1c]">PG Listings</h1>
          <p className="text-[#73787a] text-sm mt-0.5">Manage PG properties on the platform</p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
          className="flex items-center gap-2 bg-[#e98a76] hover:opacity-90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add PG
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name or location…"
          className="max-w-sm border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e98a76]/40 focus:border-[#e98a76] bg-white text-[#1b1c1c] placeholder-[#9ca3af] transition-colors"
        />
        <div className="flex items-center gap-1 bg-[#f6f3f2] rounded-xl p-1">
          {[['', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => { setStatusFilter(val); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === val
                  ? 'bg-white text-[#1b1c1c] shadow-sm'
                  : 'text-[#73787a] hover:text-[#434849]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <div className="bg-white border border-[#e0e0e0] rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto overflow-y-auto max-h-[520px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[#f6f3f2]">
              <tr className="border-b border-[#e5e5e5]">
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Name</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Location</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Rent</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Gender</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Likes</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Owner</th>
                <th className="w-[248px] px-4 py-3" />
              </tr>
            </thead>
            {loading
              ? <SkeletonTable rows={8} cols={8} />
              : <tbody className="divide-y divide-[#e5e5e5]">
                  {pgs.length === 0
                    ? (
                      <tr>
                        <td colSpan={8} className="text-center py-6">
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-2xl">🏠</span>
                            <p className="text-sm font-medium text-[#1b1c1c]">No PGs found</p>
                            <p className="text-xs text-[#73787a]">Add the first PG listing to get started</p>
                          </div>
                        </td>
                      </tr>
                    )
                    : pgs.map(pg => (
                  <tr key={pg._id} className="hover:bg-[#fbf9f8] transition-colors duration-150">
                    <td className="px-4 py-2">
                      <div className="font-semibold text-[#1b1c1c] max-w-[160px] truncate">{pg.name}</div>
                      <div className="text-xs text-[#73787a] font-mono truncate max-w-[160px]">{pg.slug}</div>
                    </td>
                    <td className="px-4 py-2 text-[#434849] whitespace-nowrap">
                      {[pg.location?.area, pg.location?.city].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-2 font-bold text-[#1b1c1c] whitespace-nowrap">
                      {pg.pricing?.rent ? `₹${pg.pricing.rent.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-2 capitalize text-[#434849]">{pg.accommodation?.gender || '—'}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                          pg.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-[#f6f3f2] text-[#73787a] border-[#E5E7EB]'
                        }`}>
                          {pg.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                        {pg.isVerified && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                            <span className="material-symbols-outlined" style={{ fontSize: '11px', fontVariationSettings: "'FILL' 1" }}>verified</span>
                            Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-sm font-semibold text-[#1b1c1c]">{pg.likesCount ?? 0}</span>
                        <button
                          onClick={() => handleToggleLikes(pg)}
                          disabled={togglingLikes === pg._id}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors disabled:opacity-50 ${
                            pg.likesEnabled
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-[#f6f3f2] text-[#73787a] border-[#E5E7EB] hover:bg-[#eae8e7]'
                          }`}
                        >
                          {togglingLikes === pg._id ? '…' : pg.likesEnabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-[#434849] text-xs">
                      <div>{pg.owner?.name || '—'}</div>
                      {pg.owner?.isVerified && (
                        <div className="inline-flex items-center gap-0.5 text-green-600 font-medium">
                          <span className="material-symbols-outlined" style={{ fontSize: '11px', fontVariationSettings: "'FILL' 1" }}>verified</span>
                          verified
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 w-[248px]">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setEditTarget(pg); setFormOpen(true) }}
                          className="min-w-[44px] text-xs font-semibold px-3 py-1.5 bg-[#f6f3f2] hover:bg-[#eae8e7] text-[#434849] rounded-xl transition-colors">
                          Edit
                        </button>
                        <button
                          onClick={() => pg.status === 'active' ? handleToggleVerify(pg) : undefined}
                          disabled={togglingVerify === pg._id || pg.status !== 'active'}
                          title={pg.isVerified ? 'Remove verification' : 'Mark as verified'}
                          className={`min-w-[86px] text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 ${pg.status !== 'active' ? 'invisible pointer-events-none' : pg.isVerified ? 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200' : 'bg-[#f6f3f2] hover:bg-[#eae8e7] text-[#73787a]'}`}
                        >
                          {togglingVerify === pg._id ? '…' : pg.isVerified ? '✓ Verified' : 'Verify'}
                        </button>
                        {pg.status === 'active' ? (
                          <button onClick={() => { setConfirmTarget(pg); setConfirmMode('deactivate') }}
                            className="min-w-[86px] text-xs font-semibold px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-100 transition-colors">
                            Deactivate
                          </button>
                        ) : (
                          <button onClick={() => { setConfirmTarget(pg); setConfirmMode('restore') }}
                            className="min-w-[86px] text-xs font-semibold px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl border border-green-200 transition-colors">
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
            }
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0f0f0]">
            <p className="text-xs text-[#73787a]">
              {pagination.totalItems} total · page {pagination.currentPage} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="text-sm px-3 py-1.5 border border-[#E5E7EB] rounded-xl hover:bg-[#f6f3f2] text-[#434849] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                ← Prev
              </button>
              <button onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page === pagination.totalPages}
                className="text-sm px-3 py-1.5 border border-[#E5E7EB] rounded-xl hover:bg-[#f6f3f2] text-[#434849] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
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
          mode={confirmMode}
          onCancel={() => { setConfirmTarget(null); setConfirmMode(null) }}
          onConfirm={handleConfirm}
          loading={deactivating}
        />
      )}

      {/* Terms & Conditions management */}
      <div className="mt-6 bg-white border border-[#e0e0e0] rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-[#1b1c1c]">Terms &amp; Conditions</h2>
            <p className="text-xs text-[#73787a] mt-0.5">Shown to admins before creating a PG listing.</p>
          </div>
        </div>
        <form onSubmit={handleSaveTerms} className="space-y-3">
          <textarea
            rows={6}
            value={termsDraft}
            onChange={e => setTermsDraft(e.target.value)}
            placeholder="Enter Terms & Conditions content…"
            className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e98a76]/40 focus:border-[#e98a76] bg-white text-[#1b1c1c] resize-none transition-colors"
          />
          {termsMsg && (
            <p className={`text-xs ${termsMsg.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>{termsMsg}</p>
          )}
          <button type="submit" disabled={termsSaving}
            className="inline-flex items-center gap-2 bg-[#1b1c1c] hover:bg-[#2d2d2d] disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
            {termsSaving ? 'Saving…' : termsEdit ? 'Update T&C' : 'Publish T&C'}
          </button>
        </form>
      </div>
    </div>
  )
}