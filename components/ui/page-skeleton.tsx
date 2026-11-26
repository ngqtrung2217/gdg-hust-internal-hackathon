export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only">Đang tải nội dung…</span>
      <div className="space-y-3">
        <div className="h-4 w-28 animate-pulse rounded-full bg-surface-container" />
        <div className="h-9 w-64 max-w-full animate-pulse rounded-xl bg-surface-container" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-surface-container" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl bg-surface-container"
          />
        ))}
      </div>
    </div>
  );
}
