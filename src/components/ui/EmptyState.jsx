export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-[#F7F6F3] p-3 text-[#ABABAB]">
          <Icon size={28} weight="regular" />
        </div>
      )}
      <h3 className="text-base font-semibold text-[#111111]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-[#787774]">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
