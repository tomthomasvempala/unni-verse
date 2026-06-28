import { format } from 'date-fns'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  RefreshCw,
  ShieldCheck,
  Flame,
  Send,
} from 'lucide-react'
import { CURRENCY_SYMBOL } from '../config/constants'

const TYPE_CONFIG = {
  deposit: {
    label: 'Deposit',
    icon: ArrowDownLeft,
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/30',
  },
  withdrawal: {
    label: 'Withdrawal',
    icon: ArrowUpRight,
    color: 'text-red-400',
    bg: 'bg-red-900/30',
  },
  loan_disbursement: {
    label: 'Loan',
    icon: Landmark,
    color: 'text-blue-400',
    bg: 'bg-blue-900/30',
  },
  loan_repayment: {
    label: 'Repayment',
    icon: RefreshCw,
    color: 'text-amber-400',
    bg: 'bg-amber-900/30',
  },
  admin_transfer: {
    label: 'Gov. Transfer',
    icon: ShieldCheck,
    color: 'text-purple-400',
    bg: 'bg-purple-900/30',
  },
  transfer: {
    label: 'Transfer',
    icon: Send,
    color: 'text-cyan-400',
    bg: 'bg-cyan-900/30',
  },
}

export default function TransactionItem({ transaction, currentUserId, users, balanceAfter }) {
  const config = TYPE_CONFIG[transaction.type] ?? TYPE_CONFIG.admin_transfer
  const Icon = config.icon
  const isPositive = currentUserId ? transaction.toId === currentUserId : true

  const resolve = (id) => {
    if (id === 'external') return 'External'
    if (id === 'government') return '🏛 Government'
    if (id === 'mint') return '🖨 Mint'
    return users?.find((u) => u.id === id)?.displayName ?? id?.slice(0, 8)
  }

  const formattedDate = transaction.timestamp?.toDate
    ? format(transaction.timestamp.toDate(), 'MMM d, h:mm a')
    : 'Just now'

  // Admin view: show "From X → To Y"; user view: show relative direction
  const subtitle = currentUserId === null
    ? `${resolve(transaction.fromId)} → ${resolve(transaction.toId)}`
    : users && transaction.fromId !== currentUserId
    ? `From ${resolve(transaction.fromId)}`
    : users
    ? `To ${resolve(transaction.toId)}`
    : formattedDate

  return (
    <div className="flex items-center gap-4 py-3">
      <div
        className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}
      >
        <Icon className={config.color} size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium">
          {config.label}
          {transaction.note && (
            <span className="text-gray-400 font-normal"> · {transaction.note}</span>
          )}
        </p>
        <p className="text-gray-500 text-xs truncate">{subtitle}</p>
        <p className="text-gray-600 text-xs">{formattedDate}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? '+' : '-'}
          {CURRENCY_SYMBOL}
          {transaction.amount?.toLocaleString('en-IN')}
        </p>
        {balanceAfter != null && (
          <p className="text-gray-500 text-xs">
            bal {CURRENCY_SYMBOL}{balanceAfter.toLocaleString('en-IN')}
          </p>
        )}
      </div>
    </div>
  )
}

