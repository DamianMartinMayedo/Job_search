const variantClasses = {
  primary:
    'bg-[#111111] text-white hover:bg-[#333333] focus-visible:ring-[#111111]',
  secondary:
    'bg-white text-[#111111] border border-[#111111] hover:bg-[#F7F6F3] focus-visible:ring-[#111111]',
  danger:
    'bg-[#EF4444] text-white hover:bg-[#B91C1C] focus-visible:ring-[#EF4444]',
  ghost:
    'text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] focus-visible:ring-[#111111]',
}

const sizeClasses = {
  sm: 'px-2.5 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base rounded-lg gap-2',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-colors transition-transform duration-150 ease-[var(--ease-out-expo)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.97] ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
