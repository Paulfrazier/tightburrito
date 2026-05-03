import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Share2, Trash2, Loader2, Camera, AlertCircle } from 'lucide-react'
import { api } from '../lib/api'
import { timeAgo } from '../lib/format'
import ScoreCard from '../components/ScoreCard'
import VoteButtons from '../components/VoteButtons'

const clerkEnabled = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

export default function BurritoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [burrito, setBurrito] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.getBurrito(id)
      .then(setBurrito)
      .catch((err) => setError(err.message || 'Could not load burrito'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleShare() {
    const url = `${window.location.origin}/b/${id}`
    const title = burrito?.diagnosis
      ? `WTS ${Math.round(burrito.overall_wts ?? 0)}: "${burrito.diagnosis}"`
      : 'Check out this burrito'

    if (navigator.share) {
      try {
        await navigator.share({ url, title })
      } catch {
        // User cancelled — not an error
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this burrito? This cannot be undone.')) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await api.deleteBurrito(id)
      navigate('/me')
    } catch (err) {
      setDeleteError(err.message || 'Could not delete')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm">Loading burrito…</p>
      </div>
    )
  }

  if (error || !burrito) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-stone-700 font-medium">{error || 'Burrito not found'}</p>
        <Link to="/feed" className="text-sm text-amber-600 hover:underline">
          Back to feed
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Back link */}
      <Link
        to="/feed"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to feed
      </Link>

      {/* Main card — reuse ScoreCard which already renders image + scores */}
      <ScoreCard burrito={burrito} />

      {/* Meta + actions row */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
        {/* Owner + time */}
        <div className="flex items-center justify-between gap-2 text-sm text-stone-500">
          <span>
            🌯 <span className="font-medium text-stone-700">{burrito.owner_display_name ?? 'anonymous'}</span>
          </span>
          <span>{timeAgo(burrito.created_at)}</span>
        </div>

        {/* Votes */}
        <VoteButtons
          burrito={burrito}
          onChange={(next) => setBurrito((b) => ({ ...b, ...next }))}
        />

        {/* Share + Delete */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium transition-colors"
          >
            <Share2 className="w-4 h-4" />
            {copied ? 'Copied!' : 'Share'}
          </button>

          {clerkEnabled && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </button>
          )}
        </div>

        {deleteError && (
          <p className="text-xs text-red-600">{deleteError}</p>
        )}
      </div>
    </div>
  )
}
