'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export default function HomeSearch() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const MAX_QUERY_LEN = 100

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const safe = query.trim().slice(0, MAX_QUERY_LEN)
    if (!safe) return
    router.push(`/store?q=${encodeURIComponent(safe)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative">
        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, MAX_QUERY_LEN))}
          maxLength={MAX_QUERY_LEN}
          placeholder="Search beats, keys, tags…"
          aria-label="Search beats"
          className="w-full rounded-sm border border-line-input bg-surface-1 py-5 pl-10 pr-36 text-base text-white outline-none focus:border-muted transition-colors"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm bg-white px-6 py-3 text-sm font-bold text-black hover:bg-white-hover transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  )
}
