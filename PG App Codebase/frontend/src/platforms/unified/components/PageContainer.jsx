const SIZE_MAP = {
  sm:  'max-w-2xl',
  md:  'max-w-4xl',
  lg:  'max-w-5xl',
  xl:  'max-w-6xl',
}

export default function PageContainer({ children, size = 'lg' }) {
  return (
    <div className={`p-6 ${SIZE_MAP[size] || SIZE_MAP.lg} mx-auto`}>
      {children}
    </div>
  )
}
