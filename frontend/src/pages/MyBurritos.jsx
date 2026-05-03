import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, AlertCircle, Camera } from 'lucide-react'
import { api } from '../lib/api'
import BurritoCard from '../components/BurritoCard'

export default function MyBurritos({ noAuth }) {
  const [burritos, setBurritos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (noAuth) return
    api.getMyBurritos()
      .then(setBurritos)
      .catch((err) => setError(err.message || 'Could not load your burritos'))
      .finally(() => setLoading(false))
  }, [noAuth])

  if (noAuth) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <Camera className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Sign in to see your burritos</h2>
        <p className="text-stone-500 text-sm max-w-xs">
          Create an account to start scoring burritos and track your personal wrap history.
        </p>
        <Link
          to="/"
          className="mt-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Go score a burrito
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm">Loading your burritos…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-stone-700 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-amber-600 hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (burritos.length === 0) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
          <Camera className="w-8 h-8 text-orange-400" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">No burritos yet</h2>
        <p className="text-stone-500 text-sm">Go score one and it'll show up here.</p>
        <Link
          to="/"
          className="mt-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Score a burrito
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-black text-stone-900 tracking-tight">My Burritos</h1>
      <p className="text-sm text-stone-500">{burritos.length} scored</p>
      <div className="space-y-3">
        {burritos.map((b) => (
          <BurritoCard key={b.id} burrito={b} />
        ))}
      </div>
    </div>
  )
}
