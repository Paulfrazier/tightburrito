import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthProvider from './components/AuthProvider'
import Header from './components/Header'
import Home from './pages/Home'
import Feed from './pages/Feed'
import Leaderboard from './pages/Leaderboard'
import BurritoDetail from './pages/BurritoDetail'
import MyBurritos from './pages/MyBurritos'

function Shell({ noAuth }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Header noAuth={noAuth} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/b/:id" element={<BurritoDetail />} />
          <Route path="/me" element={<MyBurritos noAuth={noAuth} />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App({ noAuth = false }) {
  if (noAuth) {
    return (
      <BrowserRouter>
        <Shell noAuth />
      </BrowserRouter>
    )
  }
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  )
}
