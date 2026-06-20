import { SkeletonBase } from './SkeletonBase'

export function SkeletonRow({ cols = 5 }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBase className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}
