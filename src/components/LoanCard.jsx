import { useState } from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle, TrendingDown, ArrowDownLeft, ArrowUpRight, Scissors } from 'lucide-react'
import Modal from './Modal'
import { CURRENCY_SYMBOL } from '../config/constants'
import { offerLoan, acceptLoan, rejectLoan, repayLoan, adjustLoanBalance, settleLoan } from '../domain/loan.domain'

const STATUS = {
  pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-900/30', Icon: Clock },
  offered: { label: 'Terms Sent', color: 'text-blue-400', bg: 'bg-blue-900/30', Icon: AlertCircle },
  active: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-900/30', Icon: TrendingDown },
  repaid: { label: 'Repaid', color: 'text-gray-400', bg: 'bg-gray-800', Icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-900/30', Icon: XCircle },
}

export default function LoanCard({ loan, currentUserId, users }) {
  const [offerAmount, setOfferAmount] = useState('')
  const [repayAmount, setRepayAmount] = useState('')
  const [reduceAmount, setReduceAmount] = useState('')
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [showRepayModal, setShowRepayModal] = useState(false)
  const [showReduceModal, setShowReduceModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isRequester = loan.requesterId === currentUserId
  const isLender = loan.lenderId === currentUserId
  const s = STATUS[loan.status] ?? STATUS.pending
  const requester = users.find((u) => u.id === loan.requesterId)
  const lender = users.find((u) => u.id === loan.lenderId)
  const repaidAmount = (loan.repaymentAmount ?? 0) - (loan.remainingBalance ?? 0)
  const progress =
    loan.repaymentAmount > 0
      ? Math.min(100, Math.round((repaidAmount / loan.repaymentAmount) * 100))
      : 0

  const run = async (action, onDone) => {
    setLoading(true)
    setError('')
    try {
      await action()
      onDone?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOffer = () => {
    const amt = parseFloat(offerAmount)
    if (!amt || amt <= 0) return setError('Enter a valid amount')
    run(() => offerLoan(loan.id, amt), () => { setShowOfferModal(false); setOfferAmount('') })
  }

  const handleRepay = () => {
    const amt = parseFloat(repayAmount)
    if (!amt || amt <= 0) return setError('Enter a valid amount')
    run(() => repayLoan(loan.id, currentUserId, amt), () => { setShowRepayModal(false); setRepayAmount('') })
  }

  const handleReduce = () => {
    const amt = parseFloat(reduceAmount)
    if (!amt || amt <= 0) return setError('Enter a valid amount')
    run(() => adjustLoanBalance(loan.id, amt), () => { setShowReduceModal(false); setReduceAmount('') })
  }

  // Direction badge
  const directionBadge = loan.status !== 'repaid' && loan.status !== 'rejected' && (
    isLender
      ? <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-full flex-shrink-0"><ArrowDownLeft size={11} />Incoming</span>
      : <span className="flex items-center gap-1 text-xs font-medium text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-full flex-shrink-0"><ArrowUpRight size={11} />Outgoing</span>
  )

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">
            {isRequester
              ? `Borrowed from ${lender?.displayName ?? '…'}`
              : `Lent to ${requester?.displayName ?? '…'}`}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            Requested {CURRENCY_SYMBOL}
            {loan.requestedAmount?.toLocaleString('en-IN')}
            {loan.repaymentAmount != null &&
              ` · Repay ${CURRENCY_SYMBOL}${loan.repaymentAmount.toLocaleString('en-IN')}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {directionBadge}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${s.bg}`}>
            <s.Icon className={s.color} size={12} />
            <span className={`${s.color} text-xs font-medium`}>{s.label}</span>
          </div>
        </div>
      </div>

      {/* Progress bar — active loans only */}
      {loan.status === 'active' && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>
              Remaining {CURRENCY_SYMBOL}
              {loan.remainingBalance?.toLocaleString('en-IN')}
            </span>
            <span>{progress}% repaid</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {/* Lender sees pending loan */}
        {loan.status === 'pending' && isLender && (
          <>
            <button
              onClick={() => { setError(''); setShowOfferModal(true) }}
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 rounded-lg text-xs font-medium transition-colors"
            >
              Approve &amp; Set Terms
            </button>
            <button
              onClick={() => run(() => rejectLoan(loan.id))}
              disabled={loading}
              className="flex-1 bg-gray-700 hover:bg-red-900/50 text-gray-300 hover:text-red-300 disabled:opacity-50 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              Reject
            </button>
          </>
        )}

        {/* Borrower sees offered loan */}
        {loan.status === 'offered' && isRequester && (
          <>
            <button
              onClick={() => run(() => acceptLoan(loan.id))}
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 rounded-lg text-xs font-medium transition-colors"
            >
              Accept ({CURRENCY_SYMBOL}
              {loan.repaymentAmount?.toLocaleString('en-IN')} repay)
            </button>
            <button
              onClick={() => run(() => rejectLoan(loan.id))}
              disabled={loading}
              className="flex-1 bg-gray-700 hover:bg-red-900/50 text-gray-300 hover:text-red-300 disabled:opacity-50 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              Decline
            </button>
          </>
        )}

        {/* Waiting label for lender on offered loan */}
        {loan.status === 'offered' && isLender && (
          <p className="text-gray-500 text-xs py-2">
            Waiting for {requester?.displayName ?? 'borrower'} to accept…
          </p>
        )}

        {/* Borrower repays active loan */}
        {loan.status === 'active' && isRequester && (
          <button
            onClick={() => { setError(''); setShowRepayModal(true) }}
            disabled={loading}
            className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white py-2 rounded-lg text-xs font-medium transition-colors"
          >
            Make Repayment
          </button>
        )}

        {/* Lender can reduce balance or fully settle active loan */}
        {loan.status === 'active' && isLender && (
          <>
            <button
              onClick={() => { setError(''); setShowReduceModal(true) }}
              disabled={loading}
              className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-300 hover:text-white py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              <Scissors size={12} />
              Reduce
            </button>
            <button
              onClick={() => run(() => settleLoan(loan.id))}
              disabled={loading}
              className="flex-1 bg-emerald-900/50 hover:bg-emerald-700 disabled:opacity-50 text-emerald-300 hover:text-white py-2 rounded-lg text-xs font-medium transition-colors"
            >
              Settle
            </button>
          </>
        )}
      </div>

      {/* Offer terms modal */}
      <Modal isOpen={showOfferModal} onClose={() => setShowOfferModal(false)} title="Set Repayment Terms">
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Requested amount:{' '}
            <span className="text-white font-medium">
              {CURRENCY_SYMBOL}
              {loan.requestedAmount?.toLocaleString('en-IN')}
            </span>
          </p>
          <div>
            <label className="text-gray-300 text-sm font-medium block mb-2">
              Total repayment amount (incl. interest)
            </label>
            <input
              type="number"
              min={loan.requestedAmount}
              placeholder={`Min ${CURRENCY_SYMBOL}${loan.requestedAmount}`}
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleOffer}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? 'Sending…' : 'Send Offer'}
          </button>
        </div>
      </Modal>

      {/* Repay modal */}
      <Modal isOpen={showRepayModal} onClose={() => setShowRepayModal(false)} title="Make Repayment">
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Remaining:{' '}
            <span className="text-white font-medium">
              {CURRENCY_SYMBOL}
              {loan.remainingBalance?.toLocaleString('en-IN')}
            </span>
          </p>
          <div>
            <label className="text-gray-300 text-sm font-medium block mb-2">
              Repayment amount
            </label>
            <input
              type="number"
              min={1}
              max={loan.remainingBalance}
              placeholder={`Max ${CURRENCY_SYMBOL}${loan.remainingBalance}`}
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleRepay}
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? 'Processing…' : 'Repay'}
          </button>
        </div>
      </Modal>

      {/* Reduce balance modal */}
      <Modal isOpen={showReduceModal} onClose={() => setShowReduceModal(false)} title="Reduce Balance">
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Remaining:{' '}
            <span className="text-white font-medium">
              {CURRENCY_SYMBOL}
              {loan.remainingBalance?.toLocaleString('en-IN')}
            </span>
            <br />
            <span className="text-xs">
              Enter the amount to forgive. The borrower will owe less.
            </span>
          </p>
          <div>
            <label className="text-gray-300 text-sm font-medium block mb-2">
              Amount to reduce
            </label>
            <input
              type="number"
              min={1}
              max={loan.remainingBalance}
              placeholder={`Max ${CURRENCY_SYMBOL}${loan.remainingBalance}`}
              value={reduceAmount}
              onChange={(e) => setReduceAmount(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleReduce}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? 'Updating…' : 'Reduce Balance'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
