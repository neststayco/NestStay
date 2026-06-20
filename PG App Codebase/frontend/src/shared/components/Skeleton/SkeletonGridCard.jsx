import { SkeletonBase } from './SkeletonBase'

export function SkeletonGridCard() {
  return (
    <div
      className="bg-white rounded-[20px] border border-[#e0e0e0] shadow-card overflow-hidden animate-pulse"
      aria-hidden="true"
    >
      <SkeletonBase className="w-full aspect-video rounded-none" />
      <div className="p-4 space-y-2.5">
        <SkeletonBase className="h-5 w-3/4" />
        <SkeletonBase className="h-3.5 w-1/2" />
        <div className="flex gap-2 pt-1">
          <SkeletonBase className="h-3 w-12 rounded-full" />
          <SkeletonBase className="h-3 w-12 rounded-full" />
          <SkeletonBase className="h-3 w-12 rounded-full" />
        </div>
        <div className="flex justify-between items-center pt-1">
          <SkeletonBase className="h-4 w-20" />
          <SkeletonBase className="h-8 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
