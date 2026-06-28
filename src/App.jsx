import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Loans from './pages/Loans'
import Transactions from './pages/Transactions'
import Players from './pages/Players'
import AdminHome from './pages/AdminHome'
import AdminTransactions from './pages/AdminTransactions'
import AdminPlayers from './pages/AdminPlayers'
import AdminDatabase from './pages/AdminDatabase'

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth()
  return currentUser ? children : <Navigate to="/login" replace />
}

// Admins are sent straight to /admin; normal users use this layout
function UserRoute({ children }) {
  const { userProfile } = useAuth()
  return userProfile?.isAdmin ? <Navigate to="/admin" replace /> : children
}

// Only admins can access admin routes
function AdminRoute({ children }) {
  const { userProfile } = useAuth()
  return userProfile?.isAdmin ? children : <Navigate to="/" replace />
}

function Spinner() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-emerald-400 animate-spin" />
    </div>
  )
}

function AppRoutes() {
  const { loading } = useAuth()
  if (loading) return <Spinner />

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Admin shell — completely separate from user layout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="players" element={<AdminPlayers />} />
        <Route path="database" element={<AdminDatabase />} />
      </Route>

      {/* Normal user shell — admins get redirected to /admin */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <UserRoute>
              <Layout />
            </UserRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="loans" element={<Loans />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="players" element={<Players />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}


