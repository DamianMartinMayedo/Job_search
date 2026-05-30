export default function Input({
  label,
  error,
  className = '',
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#2F3437]">{label}</label>
      )}
      <input
        className={`rounded-lg border border-[#EAEAEA] bg-white px-3 py-2 text-sm text-[#111111] placeholder:text-[#ABABAB] focus:border-[#111111] focus:ring-2 focus:ring-black/5 focus:outline-hidden disabled:bg-[#F7F6F3] disabled:text-[#ABABAB] transition-colors ${error ? 'border-[#9F2F2D] focus:border-[#9F2F2D] focus:ring-[#9F2F2D]/10' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-[#9F2F2D]">{error}</p>}
    </div>
  )
}
