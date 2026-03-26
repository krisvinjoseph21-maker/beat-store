export default function BeatLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <div className="mb-8 h-4 w-24 rounded bg-white/5 animate-pulse" />
      <div className="rounded-sm border border-[#1a1a1a] overflow-hidden">
        <div className="h-40 bg-white/5 animate-pulse" />
        <div className="p-6 space-y-4">
          <div className="h-8 w-64 rounded bg-white/5 animate-pulse" />
          <div className="h-4 w-40 rounded bg-white/5 animate-pulse" />
          <div className="flex gap-2 mt-4">
            <div className="h-11 w-11 rounded-full bg-white/5 animate-pulse" />
            <div className="h-11 flex-1 rounded-sm bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
