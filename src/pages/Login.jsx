import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Coins } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, adminLogin, currentUser } = useAuth()
  const navigate = useNavigate()
  const [adminMode, setAdminMode] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentUser) navigate('/', { replace: true })
  }, [currentUser, navigate])

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await adminLogin(password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600/20 rounded-2xl mb-4">
            <Coins className="text-emerald-400" size={32} />
          </div>
          <h1 className="text-white text-3xl font-bold">Unni-verse</h1>
          <p className="text-gray-400 text-sm mt-2">Virtual Economy · Poker Edition</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => { setAdminMode(false); setError('') }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                !adminMode
                  ? 'text-white border-b-2 border-emerald-500 bg-gray-900'
                  : 'text-gray-500 hover:text-gray-300 bg-gray-950'
              }`}
            >
              Player
            </button>
            <button
              onClick={() => { setAdminMode(true); setError('') }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                adminMode
                  ? 'text-white border-b-2 border-purple-500 bg-gray-900'
                  : 'text-gray-500 hover:text-gray-300 bg-gray-950'
              }`}
            >
              Admin
            </button>
          </div>

          <div className="p-6">
            {!adminMode ? (
              /* ── Player: Google sign-in ── */
              <>
                <p className="text-gray-400 text-sm mb-6">
                  Sign in with your Google account to join the economy.
                </p>
                <button
                  onClick={login}
                  className="flex items-center justify-center gap-3 w-full bg-white hover:bg-gray-100 text-gray-900 py-3 rounded-xl text-sm font-medium transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>
              </>
            ) : (
              /* ── Admin: username + password ── */
              <>
                <p className="text-gray-400 text-sm mb-6">
                  Government access. Use your admin credentials.
                </p>
                <form onSubmit={handleAdminLogin} className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-xs mb-1.5 block">Username</label>
                    <input
                      value="admin"
                      readOnly
                      className="w-full bg-gray-800 border border-gray-700 text-gray-400 rounded-lg px-3 py-2.5 text-sm cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1.5 block">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin password"
                      autoFocus
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading || !password}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium transition-colors mt-2"
                  >
                    {loading ? 'Signing in…' : 'Sign In as Admin'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
