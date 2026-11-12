export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={'animate-pulse bg-black/5 dark:bg-white/10 rounded-lg ' + className} />
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-3.5 md:p-5">
      <div className="flex items-center gap-3">
        <SkeletonBox className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <SkeletonBox className="h-4 w-3/5" />
          <SkeletonBox className="h-3 w-2/5" />
        </div>
        <SkeletonBox className="h-6 w-16 rounded-md shrink-0" />
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonKpi() {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <SkeletonBox className="w-9 h-9 rounded-xl" />
        <SkeletonBox className="h-6 w-10" />
      </div>
      <SkeletonBox className="h-3 w-24" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 space-y-1.5 min-w-0">
        <SkeletonBox className="h-3.5 w-1/3" />
        <SkeletonBox className="h-3 w-1/4" />
      </div>
      <SkeletonBox className="h-4 w-12 ml-2 shrink-0" />
    </div>
  );
}
