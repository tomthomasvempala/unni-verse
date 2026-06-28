import { Outlet, NavLink } from 'react-router-dom'
import { Home, Receipt, Users, Shield, LogOut, Coins, Database } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/admin', icon: Home, label: 'Home' },
  { to: '/admin/transactions', icon: Receipt, label: 'Transactions' },
  { to: '/admin/players', icon: Users, label: 'Players' },
  { to: '/admin/database', icon: Database, label: 'Database' },
]

const navClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
    isActive
      ? 'bg-purple-700 text-white'
      : 'text-gray-400 hover:text-white hover:bg-gray-800'
  }`

const mobileNavClass = ({ isActive }) =>
  `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
    isActive ? 'text-purple-400' : 'text-gray-500'
  }`

export default function AdminLayout() {
  const { userProfile, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 bg-gray-900 border-r border-gray-800 flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Coins className="text-emerald-400" size={24} />
            <span className="text-white font-bold text-lg">Unni-verse</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <Shield className="text-purple-400" size={13} />
            <span className="text-purple-400 text-xs font-medium">Admin Panel</span>
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              G
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">Government</p>
              <p className="text-purple-400 text-xs">Administrator</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/admin'} className={navClass}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Coins className="text-emerald-400" size={20} />
            <span className="text-white font-bold">Unni-verse</span>
            <span className="flex items-center gap-1 text-purple-400 text-xs font-medium">
              <Shield size={11} />Admin
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex z-40">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/admin'} className={mobileNavClass}>
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
          <button
            onClick={logout}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium text-gray-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            Out
          </button>
        </nav>
      </div>
    </div>
  )
}
