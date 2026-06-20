import { useState, useEffect, useRef } from 'react'
import { IKContext, IKUpload } from 'imagekitio-react'
import { getPGDetails } from '@shared/api/pgs'
import { getImageKitAuth, updateMyPGImages } from '@shared/api/imagekit'
import { useAuth } from '@shared/context/AuthContext'
import { useToast } from '@shared/components/Toast'
import PageHeader from '../../components/PageHeader'
import PageContainer from '../../components/PageContainer'
import { SkeletonBase } from '@shared/components/Skeleton'

const PLACEHOLDER = 'https://placehold.co/400x220/e2e8f0/94a3b8?text=No+Image'
const PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || ''
const URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || ''

async function authenticator() {
  const res = await getImageKitAuth()
  return { token: res.token, expire: res.expire, signature: res.signature }
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

  function onUploadStart() { setUploading(true) }
  function onUploadSuccess(res) {
    setUploading(false)
    setImages(prev => [...prev, { url: res.url, fileId: res.fileId }])
    toast('Photo uploaded', 'success')
  }
  function onUploadError(err) {
    setUploading(false)
    toast(err?.message || 'Upload failed', 'error')
  }
  function removeImage(fileId, url) {
    setImages(prev => prev.filter(img => (img.fileId || img.url) !== (fileId || url)))
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
      <PageContainer size="md">
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          No PG linked to your account yet.
        </p>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="md">
      <PageHeader
        title="Photos"
        subtitle="Upload and arrange photos. First photo is the cover image."
        action={
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 bg-[#1b1c1c] hover:bg-[#2d2d2d] disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {saving ? 'Saving…' : 'Save order'}
          </button>
        }
      />

      {!PUBLIC_KEY || !URL_ENDPOINT ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm mb-6">
          ImageKit credentials not configured. Add{' '}
          <code className="font-mono bg-amber-100 px-1 rounded">VITE_IMAGEKIT_PUBLIC_KEY</code>{' '}
          and{' '}
          <code className="font-mono bg-amber-100 px-1 rounded">VITE_IMAGEKIT_URL_ENDPOINT</code>{' '}
          to <code className="font-mono bg-amber-100 px-1 rounded">frontend/.env</code>.
        </div>
      ) : (
        <IKContext publicKey={PUBLIC_KEY} urlEndpoint={URL_ENDPOINT} authenticator={authenticator}>
          <div
            onClick={() => uploadRef.current?.click()}
            className="mb-6 border-2 border-dashed border-[#E5E7EB] rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#e98a76] hover:bg-[#fff3ee]/20 transition-all"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#f6f3f2] flex items-center justify-center text-[#73787a]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#434849]">
              {uploading ? 'Uploading…' : 'Click to upload a photo'}
            </p>
            <p className="text-xs text-[#73787a]">JPG, PNG, WebP — max 10 MB</p>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBase key={i} className="aspect-video rounded-2xl" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl py-16 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#f6f3f2] flex items-center justify-center mb-4 text-[#73787a]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#1b1c1c] mb-1">No photos yet</p>
          <p className="text-xs text-[#73787a]">Upload your first one above</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((img, i) => (
              <div key={img.fileId || img.url || i} className="relative group rounded-2xl overflow-hidden border border-[#E5E7EB] aspect-video bg-[#f6f3f2]">
                {i === 0 && (
                  <span className="absolute top-2 left-2 z-10 text-[10px] bg-[#1b1c1c] text-white font-bold px-2 py-0.5 rounded-full">
                    Cover
                  </span>
                )}
                <img
                  src={img.url} alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.src = PLACEHOLDER }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => moveImage(i, -1)} disabled={i === 0} title="Move left"
                    className="p-1.5 bg-white/90 rounded-xl disabled:opacity-30 hover:bg-white transition-colors">
                    <svg className="w-4 h-4 text-[#1b1c1c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button onClick={() => removeImage(img.fileId, img.url)} title="Remove"
                    className="p-1.5 bg-red-500 rounded-xl hover:bg-red-600 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} title="Move right"
                    className="p-1.5 bg-white/90 rounded-xl disabled:opacity-30 hover:bg-white transition-colors">
                    <svg className="w-4 h-4 text-[#1b1c1c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#73787a] mt-4">
            {images.length} photo{images.length !== 1 ? 's' : ''}. Hover to reorder or remove. Click "Save order" to publish.
          </p>
        </>
      )}
    </PageContainer>
  )
}
