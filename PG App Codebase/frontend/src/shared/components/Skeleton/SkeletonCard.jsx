import { SkeletonBase } from './SkeletonBase'

export function SkeletonCard({ compact = false }) {
  if (compact) {
    return (
      <div
        className="rounded-2xl bg-[#f6f3f2] border border-[#e0e0e0] h-20 animate-pulse"
        aria-hidden="true"
      />
    )
  }
  return (
    <div
      className="bg-white rounded-2xl border border-[#e0e0e0] p-5 animate-pulse"
      aria-hidden="true"
    >
      <div className="flex justify-between mb-3">
        <SkeletonBase className="h-3 w-20" />
        <SkeletonBase className="w-8 h-8 rounded-xl" />
      </div>
      <SkeletonBase className="h-8 w-16 mb-1.5" />
      <SkeletonBase className="h-3 w-24" />
    </div>
  )
}
