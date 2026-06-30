import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { login as apiLogin } from '../api/service'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiLogin(form)
      login(res.access_token, res.user)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="w-full max-w-md p-8 bg-dark-900 rounded-2xl border border-dark-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-400">🩺 Doctor Daily</h1>
          <p className="text-dark-400 mt-2">Welcome back</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-300 mb-1">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-brand-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-dark-300 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-brand-500 focus:outline-none"
              required
            />
          </div>
          
          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <p className="text-center text-dark-400 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}
