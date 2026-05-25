import { ChevronLeft, ChevronRight } from 'lucide-react'

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
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Mostrar</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden"
          >
            {limitOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span>{label}</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <p className="text-sm text-slate-500">
          {start}–{end} de {total}
        </p>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>

          {pages.map((p, i) =>
            p === '...' ? (
              <span
                key={`dots-${i}`}
                className="flex h-8 w-8 items-center justify-center text-sm text-slate-400"
              >
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`h-8 min-w-[32px] cursor-pointer rounded-lg px-2 text-sm font-medium ${
                  p === page
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
