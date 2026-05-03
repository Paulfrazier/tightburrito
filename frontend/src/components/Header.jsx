import { Link, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton, useClerk } from '@clerk/clerk-react'

const clerkEnabled = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function NavLink({ to, children }) {
  const { pathname } = useLocation()
  const active = pathname === to
  return (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors ${
        active
          ? 'text-amber-600 border-b-2 border-amber-500 pb-0.5'
          : 'text-stone-600 hover:text-stone-900'
      }`}
    >
      {children}
    </Link>
  )
}

// Isolated so useClerk() only runs inside <ClerkProvider>
function AuthButtons() {
  const clerk = useClerk()
  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <button
          onClick={() => clerk.openSignIn({ forceRedirectUrl: '/' })}
          className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
        >
          Sign in
        </button>
        <button
          onClick={() => clerk.openSignUp({ forceRedirectUrl: '/' })}
          className="text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          Sign up
        </button>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  )
}

export default function Header({ noAuth }) {
  const showAuth = !noAuth && clerkEnabled

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/60">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="font-black text-lg text-stone-900 tracking-tight whitespace-nowrap"
          >
            🌯 Tight Burrito
          </Link>
          <nav className="flex items-center gap-4">
            <NavLink to="/feed">Feed</NavLink>
            <NavLink to="/leaderboard">Leaderboard</NavLink>
            <span className="hidden sm:inline">
              <NavLink to="/me">My Burritos</NavLink>
            </span>
          </nav>
        </div>

        {showAuth && <AuthButtons />}
      </div>
    </header>
  )
}
