import { useState } from 'react'
import { Plus, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTransactions } from '../hooks/useTransactions'
import { useLoans } from '../hooks/useLoans'
import { useUsers } from '../hooks/useUsers'
import { useMoneyRequests } from '../hooks/useMoneyRequests'
import BalanceCard from '../components/BalanceCard'
import TransactionItem from '../components/TransactionItem'
import LoanCard from '../components/LoanCard'
import Modal from '../components/Modal'
import { requestDeposit, requestWithdrawal } from '../domain/account.domain'
import { requestLoan } from '../domain/loan.domain'
import { CURRENCY_SYMBOL } from '../config/constants'

const inputCls =
  'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500'

const REQUEST_STATUS = {
  pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-900/30', Icon: Clock },
  approved: { label: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-900/30', Icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-900/30', Icon: XCircle },
}

function AmountModal({ isOpen, onClose, title, subtitle, onSubmit, balance, loading, error }) {
  const [amount, setAmount] = useState('')
  const close = () => { onClose(); setAmount('') }
  return (
    <Modal isOpen={isOpen} onClose={close} title={title}>
      <div className="space-y-4">
        {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
        {balance != null && (
          <p className="text-gray-400 text-sm">
            Balance:{' '}
            <span className="text-white font-medium">
              {CURRENCY_SYMBOL}{balance?.toLocaleString('en-IN')}
            </span>
          </p>
        )}
        <input
          type="number"
          min={1}
          placeholder={`Amount in ${CURRENCY_SYMBOL}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={inputCls}
          autoFocus
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          onClick={() => onSubmit(parseFloat(amount))}
          disabled={loading || !amount}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? 'Sending…' : 'Send Request'}
        </button>
      </div>
    </Modal>
  )
}

export default function Dashboard() {
  const { userProfile } = useAuth()
  const transactions = useTransactions(userProfile?.id)
  const loans = useLoans(userProfile?.id)
  const users = useUsers()
  const moneyRequests = useMoneyRequests(userProfile?.id)

  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loanLenderId, setLoanLenderId] = useState('')
  const [loanAmount, setLoanAmount] = useState('')

  const closeModal = () => { setModal(null); setError('') }

  const run = async (action) => {
    setLoading(true)
    setError('')
    try {
      await action()
      closeModal()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const activeLoans = loans.filter((l) => l.status === 'active')
  const pendingLoans = loans.filter((l) => ['pending', 'offered'].includes(l.status))
  const recentRequests = moneyRequests.slice(0, 4)

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <h1 className="text-white text-2xl font-bold hidden md:block">Dashboard</h1>

      <BalanceCard
        balance={userProfile?.balance}
        onDeposit={() => setModal('deposit')}
        onWithdraw={() => setModal('withdraw')}
      />

      <button
        onClick={() => setModal('loan')}
        className="flex items-center gap-2 w-full justify-center bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
      >
        <Plus size={16} />
        Request Loan from Someone
      </button>

      {/* Money request history */}
      {recentRequests.length > 0 && (
        <section>
          <h2 className="text-white text-base font-semibold mb-3">Deposit / Withdraw Requests</h2>
          <div className="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700/50">
            {recentRequests.map((r) => {
              const s = REQUEST_STATUS[r.status] ?? REQUEST_STATUS.pending
              return (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-medium capitalize">
                      {r.type} {CURRENCY_SYMBOL}{r.amount?.toLocaleString('en-IN')}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {r.createdAt?.toDate
                        ? r.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : 'Just now'}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${s.bg}`}>
                    <s.Icon className={s.color} size={12} />
                    <span className={`${s.color} text-xs font-medium`}>{s.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Pending / offered loans need attention */}
      {pendingLoans.length > 0 && (
        <section>
          <h2 className="text-white text-base font-semibold mb-3">Needs Attention</h2>
          <div className="space-y-3">
            {pendingLoans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} currentUserId={userProfile?.id} users={users} />
            ))}
          </div>
        </section>
      )}

      {/* Active loans */}
      {activeLoans.length > 0 && (
        <section>
          <h2 className="text-white text-base font-semibold mb-3">Active Loans</h2>
          <div className="space-y-3">
            {activeLoans.slice(0, 3).map((loan) => (
              <LoanCard key={loan.id} loan={loan} currentUserId={userProfile?.id} users={users} />
            ))}
          </div>
        </section>
      )}

      {/* Recent transactions */}
      <section>
        <h2 className="text-white text-base font-semibold mb-3">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-10">No transactions yet</p>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700/50">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="px-4">
                <TransactionItem transaction={tx} currentUserId={userProfile?.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Deposit modal */}
      <AmountModal
        isOpen={modal === 'deposit'}
        onClose={closeModal}
        title="Request Deposit"
        subtitle="Your request will be reviewed and approved by the government."
        onSubmit={(amt) => run(() => requestDeposit(userProfile.id, amt))}
        loading={loading}
        error={error}
      />

      {/* Withdraw modal */}
      <AmountModal
        isOpen={modal === 'withdraw'}
        onClose={closeModal}
        title="Request Withdrawal"
        subtitle="Your request will be reviewed and approved by the government."
        onSubmit={(amt) => run(() => requestWithdrawal(userProfile.id, amt))}
        balance={userProfile?.balance}
        loading={loading}
        error={error}
      />

      {/* Loan request modal */}
      <Modal isOpen={modal === 'loan'} onClose={closeModal} title="Request a Loan">
        <div className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm font-medium block mb-2">Request from</label>
            <select
              value={loanLenderId}
              onChange={(e) => setLoanLenderId(e.target.value)}
              className={inputCls}
            >
              <option value="">Select user</option>
              {users
                .filter((u) => u.id !== userProfile?.id && !u.isAdmin)
                .map((u) => (
                  <option key={u.id} value={u.id}>{u.displayName}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="text-gray-300 text-sm font-medium block mb-2">Amount</label>
            <input
              type="number"
              min={1}
              placeholder={`Amount in ${CURRENCY_SYMBOL}`}
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              className={inputCls}
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={() =>
              run(() =>
                requestLoan({
                  requesterId: userProfile.id,
                  lenderId: loanLenderId,
                  requestedAmount: parseFloat(loanAmount),
                })
              )
            }
            disabled={loading || !loanLenderId || !loanAmount}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
