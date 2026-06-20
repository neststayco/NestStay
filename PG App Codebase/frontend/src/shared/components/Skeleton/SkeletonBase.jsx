export function SkeletonBase({ className = "" }) {
  return (
    <div
      className={`bg-[#f6f3f2] rounded-md ${className}`}
      aria-hidden="true"
    />
  )
}
