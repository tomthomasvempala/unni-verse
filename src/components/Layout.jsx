import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Landmark,
  Receipt,
  Shield,
  LogOut,
  Coins,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { CURRENCY_SYMBOL } from '../config/constants'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/loans', icon: Landmark, label: 'Loans' },
  { to: '/transactions', icon: Receipt, label: 'Transactions' },
]

const navClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
    isActive
      ? 'bg-emerald-600 text-white'
      : 'text-gray-400 hover:text-white hover:bg-gray-800'
  }`

const mobileNavClass = ({ isActive }) =>
  `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
    isActive ? 'text-emerald-400' : 'text-gray-500'
  }`

export default function Layout() {
  const { userProfile, logout } = useAuth()
  const navItems = [
    ...NAV_ITEMS,
    ...(userProfile?.isAdmin ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : []),
  ]

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
          <p className="text-gray-500 text-xs mt-1">Virtual Economy</p>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                className="w-9 h-9 rounded-full ring-2 ring-gray-700"
                alt=""
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center text-white text-sm font-bold">
                {userProfile?.displayName?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {userProfile?.displayName}
              </p>
              <p className="text-amber-400 text-sm font-bold">
                {CURRENCY_SYMBOL}
                {userProfile?.balance?.toLocaleString('en-IN') ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={navClass}>
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
          </div>
          <div className="flex items-center gap-2">
            {userProfile?.photoURL && (
              <img src={userProfile.photoURL} className="w-7 h-7 rounded-full" alt="" />
            )}
            <p className="text-amber-400 font-bold text-sm">
              {CURRENCY_SYMBOL}
              {userProfile?.balance?.toLocaleString('en-IN') ?? 0}
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex z-40">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={mobileNavClass}>
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
