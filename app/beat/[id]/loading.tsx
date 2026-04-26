export default function BeatLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* Back link */}
      <div className="mb-6 h-4 w-24 rounded bg-white/5 animate-pulse" />

      {/* Player card */}
      <div className="rounded-sm border border-line bg-surface-2 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-5 p-5">
          {/* Cover placeholder */}
          <div className="flex-shrink-0 w-full sm:w-36 h-36 rounded-sm bg-white/5 animate-pulse" />
          {/* Info */}
          <div className="flex-1 space-y-3 py-1">
            <div className="h-6 w-48 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-28 rounded bg-white/5 animate-pulse" />
            <div className="flex gap-2 mt-4">
              <div className="h-8 w-24 rounded-sm bg-white/5 animate-pulse" />
              <div className="h-8 w-16 rounded-sm bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>
        {/* Waveform placeholder */}
        <div className="border-t border-white/[0.04] px-4 py-4">
          <div className="h-20 w-full rounded bg-white/5 animate-pulse" />
        </div>
      </div>

      {/* License section */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-sm bg-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
