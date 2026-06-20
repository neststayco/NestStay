import { SkeletonRow } from './SkeletonRow'

export function SkeletonTable({ rows = 8, cols = 5 }) {
  return (
    <tbody className="animate-pulse" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </tbody>
  )
}
