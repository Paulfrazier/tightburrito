import { useState, useEffect } from 'react'
import { Trophy, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import BurritoCard from '../components/BurritoCard'

const PERIODS = [
  { value: 'all', label: 'All time' },
  { value: 'month', label: 'This month' },
  { value: 'week', label: 'This week' },
]

export default function Leaderboard() {
  const [period, setPeriod] = useState('all')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api.getLeaderboard(period)
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [period])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-6 h-6 text-amber-500" />
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Leaderboard</h1>
      </div>

      {/* Period pills */}
      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              period === p.value
                ? 'bg-orange-600 text-white'
                : 'bg-white border border-stone-300 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-2 text-stone-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
          <p className="font-semibold text-red-800">Failed to load leaderboard</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🏆</p>
          <p className="text-lg font-semibold text-stone-700">No entries yet</p>
          <p className="text-stone-500 mt-1">Score some burritos to populate the board.</p>
        </div>
      )}

      {/* List */}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((b, i) => (
            <BurritoCard key={b.id} burrito={b} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
