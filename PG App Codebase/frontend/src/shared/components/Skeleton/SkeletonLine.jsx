import { SkeletonBase } from './SkeletonBase'

export function SkeletonLine({ width = "w-full", height = "h-3", className = "" }) {
  return <SkeletonBase className={`${height} ${width} ${className}`} />
}
