import { Link, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton, useClerk } from '@clerk/clerk-react'

const clerkEnabled = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function NavLink({ to, children }) {
  const { pathname } = useLocation()
  const active = pathname === to
  return (
    <Link
      to={to}
      className={`text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? 'text-amber-600 border-b-2 border-amber-500 pb-0.5'
          : 'text-stone-600 hover:text-stone-900'
      }`}
    >
      {children}
    </Link>
  )
}

function AuthButtons() {
  const clerk = useClerk()
  return (
    <SignedOut>
      <button
        onClick={() => clerk.openSignIn({ forceRedirectUrl: '/' })}
        className="text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
      >
        Sign in
      </button>
    </SignedOut>
  )
}

export default function Header({ noAuth }) {
  const showAuth = !noAuth && clerkEnabled

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/60">
      <div className="max-w-3xl mx-auto px-3 sm:px-6 h-14 flex items-center gap-3 sm:gap-6">
        <Link
          to="/"
          className="font-black text-stone-900 tracking-tight whitespace-nowrap text-base sm:text-lg"
        >
          🌯 <span className="hidden sm:inline">Tight Burrito</span>
          <span className="sm:hidden">TB</span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5 flex-1">
          <NavLink to="/feed">Feed</NavLink>
          <NavLink to="/leaderboard">Top</NavLink>
          {showAuth && (
            <SignedIn>
              <NavLink to="/me">Mine</NavLink>
            </SignedIn>
          )}
        </nav>

        {showAuth && (
          <div className="flex items-center">
            <AuthButtons />
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        )}
      </div>
    </header>
  )
}
