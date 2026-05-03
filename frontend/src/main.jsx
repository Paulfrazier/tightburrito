import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function Root() {
  if (PUBLISHABLE_KEY) {
    return (
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        signInForceRedirectUrl="/"
        signUpForceRedirectUrl="/"
      >
        <App />
      </ClerkProvider>
    )
  }
  // Anonymous-only mode (no Clerk key configured) — App renders without auth wrappers
  return <App noAuth />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
