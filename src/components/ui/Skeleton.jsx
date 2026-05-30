export default function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-lg bg-[#EAEAEA] ${className}`} />
  )
}

export function SkeletonRow({ columns }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-[#EAEAEA] bg-white p-5">
      <Skeleton className="mb-4 h-8 w-1/3" />
      <Skeleton className="mb-2 h-3 w-2/3" />
    </div>
  )
}
