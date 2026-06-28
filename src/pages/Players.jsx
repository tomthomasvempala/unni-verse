import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUsers } from '../hooks/useUsers'
import { useLoans } from '../hooks/useLoans'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { CURRENCY_SYMBOL } from '../config/constants'

const COLORS = [
  '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
]
const TABS = ['Table', 'Pie Chart']

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, name }) {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11}>
      {name.split(' ')[0]}
    </text>
  )
}

export default function Players() {
  const { userProfile } = useAuth()
  const users = useUsers()
  const loans = useLoans(null, true)
  const [tab, setTab] = useState('Table')

  const nonAdminUsers = users.filter((u) => !u.isAdmin)
  const sorted = [...nonAdminUsers].sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0))

  const getStats = (uid) => {
    const active = loans.filter(
      (l) => l.status === 'active' && (l.lenderId === uid || l.requesterId === uid)
    )
    const lent = active.filter((l) => l.lenderId === uid).reduce((s, l) => s + (l.remainingBalance ?? 0), 0)
    const owed = active.filter((l) => l.requesterId === uid).reduce((s, l) => s + (l.remainingBalance ?? 0), 0)
    return { lent, owed }
  }

  const pieData = sorted
    .filter((u) => (u.balance ?? 0) > 0)
    .map((u) => ({ name: u.displayName, value: u.balance ?? 0 }))

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <h1 className="text-white text-2xl font-bold hidden md:block">Players</h1>

      {/* Sub-tabs */}
      <div className="flex bg-gray-800 rounded-xl p-1 gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
              tab === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      {tab === 'Table' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="grid grid-cols-4 px-4 py-2.5 bg-gray-900/60 border-b border-gray-700 text-gray-400 text-xs font-medium uppercase tracking-wide">
            <span>Player</span>
            <span className="text-right">Balance</span>
            <span className="text-right">Lent Out</span>
            <span className="text-right">Owes</span>
          </div>
          {sorted.map((u, i) => {
            const { lent, owed } = getStats(u.id)
            const isMe = u.id === userProfile?.id
            return (
              <div
                key={u.id}
                className={`grid grid-cols-4 px-4 py-3 border-b border-gray-700/50 last:border-0 ${
                  isMe ? 'bg-emerald-900/10' : 'hover:bg-gray-700/30'
                } transition-colors`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                  {u.photoURL ? (
                    <img src={u.photoURL} className="w-6 h-6 rounded-full flex-shrink-0" alt="" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {u.displayName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className={`text-sm truncate ${isMe ? 'text-emerald-400 font-medium' : 'text-white'}`}>
                    {u.displayName}{isMe ? ' (you)' : ''}
                  </span>
                </div>
                <span className="text-amber-400 text-sm font-medium text-right self-center">
                  {CURRENCY_SYMBOL}{(u.balance ?? 0).toLocaleString('en-IN')}
                </span>
                <span className="text-emerald-400 text-sm text-right self-center">
                  {lent > 0 ? `${CURRENCY_SYMBOL}${lent.toLocaleString('en-IN')}` : '—'}
                </span>
                <span className="text-red-400 text-sm text-right self-center">
                  {owed > 0 ? `${CURRENCY_SYMBOL}${owed.toLocaleString('en-IN')}` : '—'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Pie chart */}
      {tab === 'Pie Chart' && (
        pieData.length === 0
          ? <p className="text-gray-500 text-sm text-center py-12">No balance data</p>
          : (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    labelLine={false}
                    label={PieLabel}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`${CURRENCY_SYMBOL}${v.toLocaleString('en-IN')}`, 'Balance']}
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#fff' }}
                  />
                  <Legend
                    formatter={(value) => <span style={{ color: '#d1d5db', fontSize: 12 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )
      )}
    </div>
  )
}
