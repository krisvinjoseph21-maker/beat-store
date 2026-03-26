export default function BeatLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <div className="mb-8 h-4 w-24 rounded bg-gray-100 animate-pulse" />
      <div className="rounded-sm border border-gray-200 overflow-hidden">
        <div className="h-40 bg-gray-100 animate-pulse" />
        <div className="p-6 space-y-4">
          <div className="h-8 w-64 rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-40 rounded bg-gray-100 animate-pulse" />
          <div className="flex gap-2 mt-4">
            <div className="h-11 w-11 rounded-full bg-gray-100 animate-pulse" />
            <div className="h-11 flex-1 rounded-sm bg-gray-100 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
