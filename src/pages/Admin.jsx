import { useState } from 'react'
import { Shield, Building2, CheckCircle, XCircle, ArrowDownLeft, ArrowUpRight, Users, LogOut, Coins } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useUsers } from '../hooks/useUsers'
import { useLoans } from '../hooks/useLoans'
import { useGovernment } from '../hooks/useGovernment'
import { useTransactions } from '../hooks/useTransactions'
import { useMoneyRequests } from '../hooks/useMoneyRequests'
import { transferFunds, addToReserve } from '../domain/admin.domain'
import { approveMoneyRequest, rejectMoneyRequest } from '../domain/account.domain'
import UserSelector from '../components/UserSelector'
import TransactionItem from '../components/TransactionItem'
import { CURRENCY_SYMBOL } from '../config/constants'

const inputCls =
  'w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500'

export default function Admin() {
  const { userProfile, logout } = useAuth()
  const users = useUsers()
  const reserve = useGovernment()
  const loans = useLoans(userProfile?.id, true)
  const transactions = useTransactions(userProfile?.id, true)
  const moneyRequests = useMoneyRequests(userProfile?.id, true)

  const [tab, setTab] = useState('overview')
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [reserveAmt, setReserveAmt] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState({ msg: '', ok: true })

  const run = async (action, reset) => {
    setLoading(true)
    setFeedback({ msg: '', ok: true })
    try {
      await action()
      setFeedback({ msg: 'Done!', ok: true })
      reset()
    } catch (e) {
      setFeedback({ msg: e.message, ok: false })
    } finally {
      setLoading(false)
    }
  }

  const handleTransfer = (e) => {
    e.preventDefault()
    run(
      () => transferFunds(fromId, toId, parseFloat(amount), note),
      () => { setFromId(''); setToId(''); setAmount(''); setNote('') }
    )
  }

  const handleReserveDeposit = (e) => {
    e.preventDefault()
    run(
      () => addToReserve(parseFloat(reserveAmt)),
      () => setReserveAmt('')
    )
  }

  const nonAdminUsers = users.filter((u) => !u.isAdmin)
  const totalCirculation = nonAdminUsers.reduce((s, u) => s + (u.balance ?? 0), 0)
  const pendingRequests = moneyRequests.filter((r) => r.status === 'pending')

  const handleRequestAction = async (action) => {
    try {
      await action()
    } catch (e) {
      setFeedback({ msg: e.message, ok: false })
    }
  }

  const getUserName = (userId) =>
    users.find((u) => u.id === userId)?.displayName ?? userId?.slice(0, 8)

  const getLoanStats = (userId) => {
    const active = loans.filter(
      (l) => l.status === 'active' && (l.requesterId === userId || l.lenderId === userId)
    )
    const total = active.reduce((sum, l) => sum + (l.remainingBalance ?? l.repaymentAmount ?? 0), 0)
    const breakdown = active.map((l) =>
      l.lenderId === userId
        ? { label: 'Lent to ' + getUserName(l.requesterId), amount: l.remainingBalance ?? l.repaymentAmount ?? 0 }
        : { label: 'Owes to ' + getUserName(l.lenderId), amount: l.remainingBalance ?? l.repaymentAmount ?? 0 }
    )
    return { total, breakdown }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Standalone header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Coins className="text-emerald-400" size={22} />
          <span className="text-white font-bold">Unni-verse</span>
          <span className="hidden sm:flex items-center gap-1.5 bg-purple-900/50 border border-purple-800/50 text-purple-300 text-xs font-medium px-2.5 py-1 rounded-full">
            <Shield size={11} />
            Admin
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </header>

      <div className="flex-1 p-4 md:p-6 max-w-3xl w-full mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="text-purple-400" size={22} />
        <h1 className="text-white text-2xl font-bold">Admin Panel</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
        <button
          onClick={() => setTab('overview')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'overview' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab('players')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'players' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Users size={14} />
          Players
          <span className="bg-gray-600 text-gray-300 text-xs px-1.5 py-0.5 rounded-full">{nonAdminUsers.length}</span>
        </button>
      </div>

      {tab === 'players' && (
        <PlayersTab nonAdminUsers={nonAdminUsers} getLoanStats={getLoanStats} />
      )}

      {tab === 'overview' && <>

      {/* ── Pending deposit / withdrawal requests ────────────────────────── */}
      {moneyRequests.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Money Requests</h2>
            {pendingRequests.length > 0 && (
              <span className="bg-amber-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {pendingRequests.length} pending
              </span>
            )}
          </div>
          <div className="space-y-2">
            {moneyRequests.slice(0, 20).map((r) => {
              const isDeposit = r.type === 'deposit'
              const Icon = isDeposit ? ArrowDownLeft : ArrowUpRight
              const isPending = r.status === 'pending'
              return (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    isPending ? 'border-amber-800/40 bg-amber-900/10' : 'border-gray-700 bg-gray-900/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDeposit ? 'bg-emerald-900/40' : 'bg-red-900/40'}`}>
                    <Icon className={isDeposit ? 'text-emerald-400' : 'text-red-400'} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">
                      {getUserName(r.userId)}
                    </p>
                    <p className="text-gray-400 text-xs">
                      wants to {r.type} {CURRENCY_SYMBOL}{r.amount?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  {isPending ? (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleRequestAction(() => approveMoneyRequest(r.id))}
                        className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        <CheckCircle size={13} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRequestAction(() => rejectMoneyRequest(r.id))}
                        className="flex items-center gap-1 bg-gray-700 hover:bg-red-900/60 text-gray-300 hover:text-red-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        <XCircle size={13} />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                      r.status === 'approved' ? 'text-emerald-400 bg-emerald-900/30' : 'text-red-400 bg-red-900/30'
                    }`}>
                      {r.status}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Government reserve */}
        <div className="bg-gradient-to-br from-purple-950 to-gray-900 border border-purple-900/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="text-purple-400" size={16} />
            <p className="text-gray-400 text-sm">Government Reserve</p>
          </div>
          <p className="text-white text-3xl font-bold mb-4">
            <span className="text-amber-400">{CURRENCY_SYMBOL}</span>
            {reserve?.toLocaleString('en-IN') ?? 0}
          </p>
          <form onSubmit={handleReserveDeposit} className="flex gap-2">
            <input
              type="number"
              min={1}
              placeholder="Add to reserve…"
              value={reserveAmt}
              onChange={(e) => setReserveAmt(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={loading || !reserveAmt}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Add
            </button>
          </form>
        </div>

        {/* Economy overview */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
          <p className="text-gray-400 text-sm mb-1">Players</p>
          <p className="text-white text-3xl font-bold mb-1">{nonAdminUsers.length}</p>
          <p className="text-gray-500 text-xs">
            In circulation:{' '}
            <span className="text-amber-400 font-medium">
              {CURRENCY_SYMBOL}
              {totalCirculation.toLocaleString('en-IN')}
            </span>
          </p>
        </div>
      </div>

      {/* Transfer form */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-4">Transfer Funds</h2>
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">From</label>
              <UserSelector
                users={users}
                value={fromId}
                onChange={setFromId}
                excludeId={toId}
                label="Select sender"
                includeGovernment
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">To</label>
              <UserSelector
                users={users}
                value={toId}
                onChange={setToId}
                excludeId={fromId}
                label="Select recipient"
                includeGovernment
              />
            </div>
          </div>
          <input
            type="number"
            min={1}
            placeholder={`Amount (${CURRENCY_SYMBOL})`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputCls}
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputCls}
          />
          {feedback.msg && (
            <p className={feedback.ok ? 'text-emerald-400 text-sm' : 'text-red-400 text-sm'}>
              {feedback.msg}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !fromId || !toId || !amount}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? 'Transferring…' : 'Transfer'}
          </button>
        </form>
      </div>

      {/* All recent transactions */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-4">All Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No transactions yet</p>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {transactions.slice(0, 30).map((tx) => (
              <div key={tx.id}>
                <TransactionItem
                  transaction={tx}
                  currentUserId={userProfile?.id}
                  users={users}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      </>}
      </div>
    </div>
  )
}

function PlayersTab({ nonAdminUsers, getLoanStats }) {
  const [hoveredUser, setHoveredUser] = useState(null)
  const sorted = [...nonAdminUsers].sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0))

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-3 gap-2 px-4 py-2.5 bg-gray-900/60 border-b border-gray-700">
        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Player</span>
        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide text-right">Balance</span>
        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide text-right">Loans</span>
      </div>

      <div className="divide-y divide-gray-700/50">
        {sorted.map((user) => {
          const { total, breakdown } = getLoanStats(user.id)
          return (
            <div
              key={user.id}
              className="relative grid grid-cols-3 gap-2 items-center px-4 py-3 hover:bg-gray-700/30 transition-colors"
              onMouseEnter={() => setHoveredUser(user.id)}
              onMouseLeave={() => setHoveredUser(null)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {user.photoURL ? (
                  <img src={user.photoURL} className="w-8 h-8 rounded-full flex-shrink-0" alt="" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 flex items-center justify-center text-xs text-white font-bold">
                    {user.displayName?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-white text-sm truncate">{user.displayName}</span>
              </div>

              <span className="text-amber-400 font-semibold text-sm text-right">
                {CURRENCY_SYMBOL}{(user.balance ?? 0).toLocaleString('en-IN')}
              </span>

              <div className="flex justify-end">
                {total > 0 ? (
                  <span className="text-blue-400 font-medium text-sm cursor-default underline decoration-dotted">
                    {CURRENCY_SYMBOL}{total.toLocaleString('en-IN')}
                  </span>
                ) : (
                  <span className="text-gray-600 text-sm">—</span>
                )}
              </div>

              {hoveredUser === user.id && breakdown.length > 0 && (
                <div className="absolute right-4 top-full mt-1 z-20 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl p-3 min-w-[210px]">
                  <p className="text-gray-400 text-xs font-medium mb-2">Loan breakdown</p>
                  <div className="space-y-1.5">
                    {breakdown.map((item, i) => (
                      <div key={i} className="flex items-center justify-between gap-4">
                        <span className="text-gray-300 text-xs">{item.label}</span>
                        <span className="text-blue-400 text-xs font-semibold whitespace-nowrap">
                          {CURRENCY_SYMBOL}{item.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {sorted.length === 0 && (
          <p className="px-4 py-8 text-center text-gray-500 text-sm">No players yet</p>
        )}
      </div>
    </div>
  )
}
