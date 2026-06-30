import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { getMe } from './api/service'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Diary from './pages/Diary'
import Finance from './pages/Finance'
import Settings from './pages/Settings'
import Sidebar, { MobileNav } from './components/Sidebar'
import QuickAdd from './components/QuickAdd'

export const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6 px-4 py-5 md:px-6 md:py-6">
        {children}
      </main>
      <MobileNav />
      <QuickAdd />
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('dd_token')
    if (token) {
      getMe().then(u => setUser(u)).catch(() => {
        localStorage.removeItem('dd_token')
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = (token, userData) => {
    localStorage.setItem('dd_token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('dd_token')
    setUser(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-dark-950">
      <div className="text-brand-400 text-xl animate-pulse">🩺 Loading...</div>
    </div>
  )

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/diary" element={<ProtectedRoute><Diary /></ProtectedRoute>} />
        <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </AuthContext.Provider>
  )
}
