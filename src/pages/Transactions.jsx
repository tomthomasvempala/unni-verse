import { useAuth } from '../context/AuthContext'
import { useTransactions } from '../hooks/useTransactions'
import TransactionItem from '../components/TransactionItem'

export default function Transactions() {
  const { userProfile } = useAuth()
  const transactions = useTransactions(userProfile?.id)

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <h1 className="text-white text-2xl font-bold hidden md:block">Transaction History</h1>

      {transactions.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-12">No transactions yet</p>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700/50">
          {transactions.map((tx) => (
            <div key={tx.id} className="px-4">
              <TransactionItem transaction={tx} currentUserId={userProfile?.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
