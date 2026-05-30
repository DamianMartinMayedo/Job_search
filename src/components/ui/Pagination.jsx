import { CaretLeft, CaretRight } from '@phosphor-icons/react'

function getVisiblePages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, 4, '...', total]
  if (current >= total - 2)
    return [1, '...', total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

export default function Pagination({
  page,
  total,
  limit,
  onPageChange,
  limitOptions = [10, 20, 50],
  onLimitChange,
  label = 'registros',
}) {
  const totalPages = Math.ceil(total / limit) || 1
  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = Math.min(page * limit, total)
  const pages = getVisiblePages(page, totalPages)

  if (totalPages <= 1 && !onLimitChange) return null

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
      {onLimitChange && (
        <div className="flex items-center gap-2 text-sm text-[#787774]">
          <span>Mostrar</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="rounded-lg border border-[#EAEAEA] bg-white px-2 py-1.5 text-sm text-[#111111] focus:border-[#111111] focus:ring-2 focus:ring-black/5 focus:outline-hidden transition-colors"
          >
            {limitOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <span>{label}</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <p className="text-sm text-[#787774]">
          {start}–{end} de {total}
        </p>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="rounded-lg p-1.5 text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
          >
            <CaretLeft size={16} weight="bold" />
          </button>

          {pages.map((p, i) =>
            p === '...' ? (
              <span
                key={`dots-${i}`}
                className="flex h-8 w-8 items-center justify-center text-sm text-[#ABABAB]"
              >
                ···
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`h-8 min-w-[32px] cursor-pointer rounded-lg px-2 text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-[#111111] text-white'
                    : 'text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111]'
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="rounded-lg p-1.5 text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  )
}
