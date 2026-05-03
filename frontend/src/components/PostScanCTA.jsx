import { Link } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'

const HAS_CLERK = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

export default function PostScanCTA({ result }) {
  if (!HAS_CLERK) return null

  return (
    <div className="mt-4 bg-white rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
      <SignedOut>
        <p className="text-stone-600 text-sm">Sign in to save your scores and vote on others.</p>
        <a
          href="/sign-in"
          className="shrink-0 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors"
        >
          Sign in to save &amp; vote
        </a>
      </SignedOut>
      <SignedIn>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <Link
            to={`/b/${result.id}`}
            className="flex-1 sm:flex-none text-center bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors"
          >
            Share
          </Link>
          <Link
            to="/me"
            className="flex-1 sm:flex-none text-center border border-stone-300 hover:bg-stone-50 text-stone-700 text-sm font-semibold py-2 px-4 rounded-xl transition-colors"
          >
            View on your profile
          </Link>
        </div>
      </SignedIn>
    </div>
  )
}
