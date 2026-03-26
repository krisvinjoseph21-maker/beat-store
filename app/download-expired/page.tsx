import Link from 'next/link'

export default function DownloadExpiredPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-3 text-3xl font-black text-gray-900">Link Expired</h1>
      <p className="mb-6 max-w-sm text-gray-500">
        This download link has expired (links are valid for 48 hours). Please contact us and we'll send you a new one.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white hover:bg-gray-700 transition-colors"
      >
        Back to Store
      </Link>
    </div>
  )
}
