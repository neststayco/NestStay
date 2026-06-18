import { useRef, useState, useEffect } from 'react'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024
const MIN_IMAGES = 3
const MAX_IMAGES = 10

function formatMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `"${file.name}": only JPG, PNG, WEBP allowed`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `"${file.name}": exceeds 5 MB (${formatMB(file.size)})`
  }
  return null
}

export default function PGImageUploader({ files, onChange, required = true }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [previews, setPreviews] = useState([])
  const [uploadErrors, setUploadErrors] = useState([])

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [files])

  function addFiles(newFiles) {
    const combined = [...files]
    const errors = []

    for (const f of newFiles) {
      if (combined.length >= MAX_IMAGES) {
        errors.push(`Only ${MAX_IMAGES} images allowed`)
        break
      }
      const err = validateFile(f)
      if (err) {
        errors.push(err)
        continue
      }
      const isDup = combined.some((cf) => cf.name === f.name && cf.size === f.size)
      if (!isDup) combined.push(f)
    }

    setUploadErrors(errors)
    onChange(combined)
  }

  function removeFile(index) {
    setUploadErrors([])
    onChange(files.filter((_, i) => i !== index))
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  function handleChange(e) {
    addFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  const countColor =
    files.length === 0
      ? 'text-gray-400'
      : files.length < MIN_IMAGES
      ? 'text-amber-600'
      : 'text-green-600'

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${dragOver
            ? 'border-brand bg-orange-50/50 scale-[1.01]'
            : 'border-gray-300 hover:border-brand bg-gray-50 hover:bg-orange-50/20'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={handleChange}
        />
        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm font-medium text-gray-700">
          Drag &amp; Drop here or{' '}
          <span className="text-brand font-semibold underline underline-offset-2">Choose Files</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {required ? `${MIN_IMAGES}–${MAX_IMAGES} images required` : `Up to ${MAX_IMAGES} images`}
          {' · '}Max 5 MB each · JPG, PNG, WEBP
        </p>
      </div>

      {/* Count badge */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${countColor}`}>
          {files.length > 0
            ? `${files.length} / ${MAX_IMAGES} images selected${files.length < MIN_IMAGES && required ? ` — need ${MIN_IMAGES - files.length} more` : ''}`
            : required
            ? `Select ${MIN_IMAGES}–${MAX_IMAGES} images`
            : 'No images selected'}
        </span>
        {files.length > 0 && (
          <button
            type="button"
            onClick={() => { setUploadErrors([]); onChange([]) }}
            className="text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((url, i) => (
            <div
              key={url}
              className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-100"
            >
              <img src={url} alt={files[i]?.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full
                  opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center
                  text-xs font-bold leading-none shadow"
              >
                ×
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] bg-brand text-black font-bold px-1.5 py-0.5 rounded">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload errors */}
      {uploadErrors.length > 0 && (
        <div className="space-y-1">
          {uploadErrors.map((err, i) => (
            <p key={i} className="text-xs text-red-600 flex items-start gap-1">
              <span className="mt-0.5 shrink-0">✕</span>
              <span>{err}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
