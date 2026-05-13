import { useState, useEffect, useRef } from 'react'
import { IKContext, IKUpload } from 'imagekitio-react'
import { getPGDetails } from '@shared/api/pgs'
import { getImageKitAuth, updateMyPGImages } from '@shared/api/imagekit'
import { useAuth } from '@shared/context/AuthContext'
import { useToast } from '@shared/components/Toast'

const PLACEHOLDER = 'https://placehold.co/400x220/e2e8f0/94a3b8?text=No+Image'
const PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || ''
const URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || ''

async function authenticator() {
  const res = await getImageKitAuth()
  return { token: res.token, expire: res.expire, signature: res.signature }
}

function UploadIcon() {
  return (
    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

export default function OwnerPhotosPage() {
  const { user } = useAuth()
  const toast = useToast()
  const pgId = user?.pgId

  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const uploadRef = useRef(null)

  useEffect(() => {
    if (!pgId) { setLoading(false); return }
    getPGDetails(pgId)
      .then(res => setImages(res.pg?.images || []))
      .catch(() => toast('Failed to load photos', 'error'))
      .finally(() => setLoading(false))
  }, [pgId])

  function onUploadStart() {
    setUploading(true)
  }

  function onUploadSuccess(res) {
    setUploading(false)
    setImages(prev => [...prev, res.url])
    toast('Photo uploaded', 'success')
  }

  function onUploadError(err) {
    setUploading(false)
    toast(err?.message || 'Upload failed', 'error')
  }

  function removeImage(url) {
    setImages(prev => prev.filter(u => u !== url))
  }

  function moveImage(index, direction) {
    setImages(prev => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateMyPGImages(images)
      toast('Photos saved', 'success')
    } catch (err) {
      toast(err.response?.data?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!pgId && !loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          No PG is linked to your account yet.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Photos</h1>
          <p className="text-gray-500 text-sm mt-0.5">Upload and arrange photos of your PG. The first photo is the cover image.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-brand hover:bg-brand-light disabled:opacity-50 text-black text-sm font-semibold px-5 py-2 rounded-[10px] transition-colors whitespace-nowrap"
        >
          {saving ? 'Saving…' : 'Save order'}
        </button>
      </div>

      {!PUBLIC_KEY || !URL_ENDPOINT ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm mb-6">
          ImageKit credentials not configured. Add <code className="font-mono bg-amber-100 px-1 rounded">VITE_IMAGEKIT_PUBLIC_KEY</code> and <code className="font-mono bg-amber-100 px-1 rounded">VITE_IMAGEKIT_URL_ENDPOINT</code> to <code className="font-mono bg-amber-100 px-1 rounded">frontend/.env</code> to enable uploads.
        </div>
      ) : (
        <IKContext publicKey={PUBLIC_KEY} urlEndpoint={URL_ENDPOINT} authenticator={authenticator}>
          <div
            onClick={() => uploadRef.current?.click()}
            className="mb-6 border-2 border-dashed border-[#e0e0e0] rounded-[20px] p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#027fff] hover:bg-blue-50/30 transition-colors"
          >
            <UploadIcon />
            <p className="text-sm font-medium text-gray-600">
              {uploading ? 'Uploading…' : 'Click to upload a photo'}
            </p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP — max 10 MB</p>
            <IKUpload
              ref={uploadRef}
              fileName={`pg-${pgId}-${Date.now()}`}
              folder="/pg-photos"
              useUniqueFileName
              accept="image/*"
              style={{ display: 'none' }}
              onUploadStart={onUploadStart}
              onSuccess={onUploadSuccess}
              onError={onUploadError}
            />
          </div>
        </IKContext>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-video bg-gray-200 rounded-[10px] animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <UploadIcon />
          <p className="mt-2 text-sm">No photos yet. Upload your first one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((url, i) => (
            <div key={url} className="relative group rounded-[10px] overflow-hidden border border-[#e0e0e0] aspect-video bg-gray-100">
              {i === 0 && (
                <span className="absolute top-2 left-2 z-10 text-xs bg-brand text-black font-semibold px-2 py-0.5 rounded-full">
                  Cover
                </span>
              )}
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = PLACEHOLDER }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => moveImage(i, -1)}
                  disabled={i === 0}
                  title="Move left"
                  className="p-1.5 bg-white/90 rounded-lg disabled:opacity-30 hover:bg-white transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => removeImage(url)}
                  title="Remove"
                  className="p-1.5 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  onClick={() => moveImage(i, 1)}
                  disabled={i === images.length - 1}
                  title="Move right"
                  className="p-1.5 bg-white/90 rounded-lg disabled:opacity-30 hover:bg-white transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-gray-400 mt-4">
          {images.length} photo{images.length !== 1 ? 's' : ''}. Hover a photo to reorder or remove. Click "Save order" to publish changes.
        </p>
      )}
    </div>
  )
}
