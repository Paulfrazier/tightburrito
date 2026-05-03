import { useState } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { api } from '../lib/api'

const clerkEnabled = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

export default function VoteButtons({ burrito, onChange }) {
  const [votes, setVotes] = useState({
    upvotes: burrito.upvotes,
    downvotes: burrito.downvotes,
    my_vote: burrito.my_vote,
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleVote(direction) {
    if (!clerkEnabled || loading) return

    const value = direction === 'up' ? 1 : -1
    // Toggle off if already voted the same way
    const nextValue = votes.my_vote === value ? 0 : value

    // Optimistic update — base on current state, not initial prop
    const prev = { ...votes }
    const optimistic = {
      upvotes:
        prev.upvotes +
        (nextValue === 1 ? 1 : 0) -
        (prev.my_vote === 1 ? 1 : 0),
      downvotes:
        prev.downvotes +
        (nextValue === -1 ? 1 : 0) -
        (prev.my_vote === -1 ? 1 : 0),
      my_vote: nextValue === 0 ? null : nextValue,
    }
    setVotes(optimistic)
    setError(null)
    setLoading(true)

    try {
      const updated = await api.vote(burrito.id, nextValue)
      const next = {
        upvotes: updated.upvotes,
        downvotes: updated.downvotes,
        my_vote: updated.my_vote,
      }
      setVotes(next)
      onChange?.(next)
    } catch (err) {
      setVotes(prev)
      setError(err.message || 'Could not save vote')
    } finally {
      setLoading(false)
    }
  }

  const disabled = !clerkEnabled || loading
  const tooltip = !clerkEnabled ? 'Sign in to vote' : undefined

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleVote('up')}
          disabled={disabled}
          title={tooltip}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all
            ${votes.my_vote === 1
              ? 'bg-green-50 text-green-700 ring-2 ring-green-500'
              : 'bg-stone-100 text-stone-600 hover:bg-green-50 hover:text-green-700'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <ArrowUp className="w-4 h-4" />
          <span>{votes.upvotes}</span>
        </button>

        <button
          onClick={() => handleVote('down')}
          disabled={disabled}
          title={tooltip}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all
            ${votes.my_vote === -1
              ? 'bg-red-50 text-red-700 ring-2 ring-red-500'
              : 'bg-stone-100 text-stone-600 hover:bg-red-50 hover:text-red-700'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <ArrowDown className="w-4 h-4" />
          <span>{votes.downvotes}</span>
        </button>

        {!clerkEnabled && (
          <span className="text-xs text-stone-400 italic">Sign in to vote</span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
