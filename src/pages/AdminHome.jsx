import { useState } from 'react'
import { Building2, Users, CheckCircle, XCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useUsers } from '../hooks/useUsers'
import { useGovernment } from '../hooks/useGovernment'
import { useMoneyRequests } from '../hooks/useMoneyRequests'
import { approveMoneyRequest, rejectMoneyRequest } from '../domain/account.domain'
import { transferFunds, addToReserve } from '../domain/admin.domain'
import UserSelector from '../components/UserSelector'
import { CURRENCY_SYMBOL } from '../config/constants'

const inputCls =
  'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500'

export default function AdminHome() {
  const users = useUsers()
  const reserve = useGovernment()
  const moneyRequests = useMoneyRequests('government', true)

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

  const nonAdminUsers = users.filter((u) => !u.isAdmin)
  const totalCirculation = nonAdminUsers.reduce((s, u) => s + (u.balance ?? 0), 0)
  const pendingRequests = moneyRequests.filter((r) => r.status === 'pending')

  const getUserName = (id) =>
    users.find((u) => u.id === id)?.displayName ?? id?.slice(0, 8)

  const handleRequestAction = async (action) => {
    try { await action() } catch (e) { setFeedback({ msg: e.message, ok: false }) }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl space-y-6">
      <h1 className="text-white text-2xl font-bold hidden md:block">Home</h1>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-950 to-gray-900 border border-purple-900/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="text-purple-400" size={15} />
            <p className="text-gray-400 text-xs">Govt Reserve</p>
          </div>
          <p className="text-white text-2xl font-bold">
            <span className="text-amber-400">{CURRENCY_SYMBOL}</span>
            {(reserve ?? 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users className="text-blue-400" size={15} />
            <p className="text-gray-400 text-xs">Players</p>
          </div>
          <p className="text-white text-2xl font-bold">{nonAdminUsers.length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
          <p className="text-gray-400 text-xs mb-1">In Circulation</p>
          <p className="text-white text-2xl font-bold">
            <span className="text-amber-400">{CURRENCY_SYMBOL}</span>
            {totalCirculation.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Pending money requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Pending Requests</h2>
            <span className="bg-amber-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {pendingRequests.length}
            </span>
          </div>
          <div className="space-y-2">
            {pendingRequests.map((r) => {
              const isDeposit = r.type === 'deposit'
              const Icon = isDeposit ? ArrowDownLeft : ArrowUpRight
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-amber-800/40 bg-amber-900/10"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDeposit ? 'bg-emerald-900/40' : 'bg-red-900/40'}`}>
                    <Icon className={isDeposit ? 'text-emerald-400' : 'text-red-400'} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{getUserName(r.userId)}</p>
                    <p className="text-gray-400 text-xs">
                      wants to {r.type} {CURRENCY_SYMBOL}{r.amount?.toLocaleString('en-IN')}
                    </p>
                  </div>
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
                </div>
              )
            })}
          </div>
        </div>
      )}

      {pendingRequests.length === 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-2">Pending Requests</h2>
          <p className="text-gray-500 text-sm">No pending requests.</p>
        </div>
      )}

      {/* Transfer funds */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-4">Transfer Funds</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">From</label>
              <UserSelector users={users} value={fromId} onChange={setFromId} excludeId={toId} label="Select sender" includeGovernment />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">To</label>
              <UserSelector users={users} value={toId} onChange={setToId} excludeId={fromId} label="Select recipient" includeGovernment />
            </div>
          </div>
          <input type="number" min={1} placeholder={`Amount (${CURRENCY_SYMBOL})`} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
          <input type="text" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
          {feedback.msg && (
            <p className={`text-sm ${feedback.ok ? 'text-emerald-400' : 'text-red-400'}`}>{feedback.msg}</p>
          )}
          <button
            onClick={() => run(() => transferFunds(fromId, toId, parseFloat(amount), note), () => { setFromId(''); setToId(''); setAmount(''); setNote('') })}
            disabled={loading || !fromId || !toId || !amount}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? 'Sending…' : 'Transfer'}
          </button>
        </div>
      </div>

      {/* Add to reserve */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-4">Add to Reserve</h2>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            placeholder={`Amount (${CURRENCY_SYMBOL})`}
            value={reserveAmt}
            onChange={(e) => setReserveAmt(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={() => run(() => addToReserve(parseFloat(reserveAmt)), () => setReserveAmt(''))}
            disabled={loading || !reserveAmt}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
