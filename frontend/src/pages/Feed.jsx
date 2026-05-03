import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import BurritoCard from '../components/BurritoCard'

function SkeletonCard() {
  return (
    <div className="flex flex-col sm:flex-row rounded-2xl bg-white shadow-sm overflow-hidden animate-pulse">
      <div className="w-full sm:w-36 h-48 sm:h-32 bg-orange-100 flex-shrink-0" />
      <div className="flex flex-col justify-between p-4 flex-1 gap-3">
        <div className="h-8 w-16 bg-stone-200 rounded-lg" />
        <div className="h-3 w-3/4 bg-stone-100 rounded" />
        <div className="flex justify-between">
          <div className="h-3 w-24 bg-stone-100 rounded" />
          <div className="h-3 w-12 bg-stone-100 rounded" />
        </div>
      </div>
    </div>
  )
}

export default function Feed() {
  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api.getFeed()
      .then((data) => {
        if (cancelled) return
        setItems(data.items)
        setCursor(data.next_cursor)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  async function loadMore() {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const data = await api.getFeed(cursor)
      setItems((prev) => [...prev, ...data.items])
      setCursor(data.next_cursor)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
        <p className="font-semibold text-red-800">Failed to load feed</p>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🌯</p>
        <p className="text-lg font-semibold text-stone-700">No burritos in the feed yet</p>
        <p className="text-stone-500 mt-1 mb-6">Be the first to score your wrap.</p>
        <Link
          to="/"
          className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors"
        >
          Score a burrito
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-stone-900 mb-5 tracking-tight">Feed</h1>

      <div className="space-y-3">
        {items.map((b) => (
          <BurritoCard key={b.id} burrito={b} />
        ))}
      </div>

      {cursor != null && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold py-2.5 px-6 rounded-xl transition-colors disabled:opacity-60"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading…
              </>
            ) : (
              'Load more'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
