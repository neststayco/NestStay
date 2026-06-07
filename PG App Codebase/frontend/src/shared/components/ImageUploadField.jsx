import { useRef, useState } from 'react'
import { IKContext, IKUpload } from 'imagekitio-react'
import { getImageKitAuth } from '@shared/api/imagekit'

const PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || ''
const URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || ''
const PLACEHOLDER = 'https://placehold.co/400x220/e2e8f0/94a3b8?text=No+Image'

async function authenticator() {
  const res = await getImageKitAuth()
  return { token: res.token, expire: res.expire, signature: res.signature }
}

function CameraIcon() {
  return (
    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

/**
 * ImageUploadField — wraps IKContext/IKUpload for single-image fields.
 *
 * Props:
 *   value    : string — current CDN URL (empty string = no upload yet)
 *   onChange : (url: string) => void
 *   disabled : boolean
 *   folder   : string — ImageKit folder path (default: '/uploads')
 *   filePrefix: string — filename prefix (default: 'upload')
 */
export default function ImageUploadField({
  value,
  onChange,
  disabled = false,
  folder = '/uploads',
  filePrefix = 'upload',
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const uploadRef = useRef(null)

  function handleRemove() {
    onChange('')
    setUploadError('')
  }

  // Graceful fallback when ImageKit env vars are missing (dev/CI without config)
  if (!PUBLIC_KEY || !URL_ENDPOINT) {
    return (
      <div>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          disabled={disabled}
          className="w-full border border-[#e0e0e0] rounded-[10px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action disabled:opacity-50"
        />
        <p className="text-xs text-gray-400 mt-1">
          ImageKit not configured — add{' '}
          <code className="font-mono bg-gray-100 px-1 rounded">VITE_IMAGEKIT_PUBLIC_KEY</code> and{' '}
          <code className="font-mono bg-gray-100 px-1 rounded">VITE_IMAGEKIT_URL_ENDPOINT</code> to enable direct upload.
        </p>
      </div>
    )
  }

  if (value) {
    return (
      <div className="relative rounded-[10px] overflow-hidden border border-[#e0e0e0] bg-gray-50">
        <img
          src={value}
          alt="Uploaded evidence"
          className="w-full h-40 object-cover"
          onError={(e) => { e.target.src = PLACEHOLDER }}
        />
        <button
          type="button"
          onClick={handleRemove}
          disabled={disabled}
          title="Remove image"
          className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <IKContext publicKey={PUBLIC_KEY} urlEndpoint={URL_ENDPOINT} authenticator={authenticator}>
      <div
        onClick={() => !uploading && !disabled && uploadRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => e.key === 'Enter' && !uploading && !disabled && uploadRef.current?.click()}
        aria-label="Upload evidence photo"
        className={`border-2 border-dashed rounded-[10px] p-6 flex flex-col items-center justify-center gap-2 transition-colors
          ${uploading || disabled
            ? 'opacity-50 cursor-not-allowed border-[#e0e0e0]'
            : 'cursor-pointer border-[#e0e0e0] hover:border-action hover:bg-blue-50/30'
          }`}
      >
        <CameraIcon />
        <p className="text-sm text-gray-500 font-medium">
          {uploading ? 'Uploading…' : 'Click to upload evidence photo'}
        </p>
        <p className="text-xs text-gray-400">JPG, PNG, WebP — max 10 MB</p>
        {uploadError && (
          <p className="text-xs text-red-600 text-center mt-1">{uploadError}</p>
        )}
        <IKUpload
          ref={uploadRef}
          fileName={`${filePrefix}-${Date.now()}`}
          folder={folder}
          useUniqueFileName
          accept="image/*"
          style={{ display: 'none' }}
          onUploadStart={() => { setUploading(true); setUploadError('') }}
          onSuccess={(res) => { setUploading(false); onChange(res.url) }}
          onError={(err) => { setUploading(false); setUploadError(err?.message || 'Upload failed — please try again.') }}
        />
      </div>
    </IKContext>
  )
}
