import { relativeTime, absoluteDate } from '../utils/relativeTime'

export default function RelativeTime({ timestamp }) {
  if (!timestamp) return null
  return (
    <time dateTime={timestamp} title={absoluteDate(timestamp)}>
      {relativeTime(timestamp)}
    </time>
  )
}
