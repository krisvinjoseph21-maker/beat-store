export default function StoreLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 lg:px-8 py-10">
      {/* Search skeleton */}
      <div className="mb-6 h-14 w-full max-w-lg rounded-sm bg-white/5 animate-pulse" />

      {/* Filter skeletons */}
      <div className="mb-5 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-sm bg-white/5 animate-pulse" />
        ))}
      </div>

      {/* Beat row skeletons */}
      <div className="rounded-sm border border-line overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line px-5 py-4">
            <div className="h-11 w-11 rounded-full bg-white/5 animate-pulse flex-shrink-0" />
            <div className="h-12 w-12 rounded-sm bg-white/5 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-white/5 animate-pulse" />
              <div className="h-3 w-32 rounded bg-white/5 animate-pulse" />
            </div>
            <div className="h-10 w-20 rounded-sm bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
