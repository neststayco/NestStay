export default function TableWrapper({ children }) {
  return (
    <div
      className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden"
      style={{ boxShadow: 'rgba(0,0,0,0.06) 0px 4px 16px, rgba(0,0,0,0.03) 0px 1px 4px' }}
    >
      <div className="overflow-x-auto overflow-y-auto max-h-[520px]">
        {children}
      </div>
    </div>
  )
}
