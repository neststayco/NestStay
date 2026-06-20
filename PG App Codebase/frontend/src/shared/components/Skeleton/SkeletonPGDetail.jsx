import { SkeletonBase } from './SkeletonBase'

export function SkeletonPGDetail() {
  return (
    <div className="animate-pulse space-y-5" aria-hidden="true">
      <SkeletonBase className="w-full h-56 rounded-2xl" />
      <div className="space-y-2">
        <SkeletonBase className="h-7 w-2/3" />
        <SkeletonBase className="h-4 w-1/2" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBase key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
      <div className="space-y-2">
        <SkeletonBase className="h-4 w-full" />
        <SkeletonBase className="h-4 w-full" />
        <SkeletonBase className="h-4 w-3/4" />
      </div>
      <div className="bg-white border border-[#e0e0e0] rounded-2xl p-4 space-y-2">
        <SkeletonBase className="h-5 w-1/4" />
        <SkeletonBase className="h-8 w-1/3" />
        <SkeletonBase className="h-4 w-1/2" />
      </div>
    </div>
  )
}
