import { Plus, Minus } from 'lucide-react'
import { CURRENCY_SYMBOL } from '../config/constants'

export default function BalanceCard({ balance, onDeposit, onWithdraw }) {
  return (
    <div className="bg-gradient-to-br from-emerald-950 to-gray-900 border border-emerald-900/50 rounded-2xl p-6">
      <p className="text-gray-400 text-sm mb-1">Your Balance</p>
      <p className="text-white text-4xl font-bold mb-1">
        <span className="text-amber-400">{CURRENCY_SYMBOL}</span>
        {(balance ?? 0).toLocaleString('en-IN')}
      </p>
      <p className="text-gray-500 text-xs mb-6">Available funds</p>
      <div className="flex gap-3">
        <button
          onClick={onDeposit}
          className="flex items-center gap-2 flex-1 justify-center bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Deposit
        </button>
        <button
          onClick={onWithdraw}
          className="flex items-center gap-2 flex-1 justify-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors"
        >
          <Minus size={16} />
          Withdraw
        </button>
      </div>
    </div>
  )
}
