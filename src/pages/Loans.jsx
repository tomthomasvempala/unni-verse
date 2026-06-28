import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLoans } from '../hooks/useLoans'
import { useUsers } from '../hooks/useUsers'
import LoanCard from '../components/LoanCard'

const TABS = ['Incoming', 'Outgoing', 'Active', 'History']

export default function Loans() {
  const { userProfile } = useAuth()
  const loans = useLoans(userProfile?.id)
  const users = useUsers()
  const [tab, setTab] = useState('Incoming')

  const uid = userProfile?.id

  const buckets = {
    Incoming: loans.filter(
      (l) => l.lenderId === uid && ['pending', 'offered'].includes(l.status)
    ),
    Outgoing: loans.filter(
      (l) => l.requesterId === uid && ['pending', 'offered'].includes(l.status)
    ),
    Active: loans.filter((l) => l.status === 'active'),
    History: loans.filter((l) => ['repaid', 'rejected'].includes(l.status)),
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <h1 className="text-white text-2xl font-bold hidden md:block">Loans</h1>

      {/* Tabs */}
      <div className="flex bg-gray-800 rounded-xl p-1 gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors relative ${
              tab === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t}
            {buckets[t].length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center bg-emerald-600 text-white text-xs rounded-full w-4 h-4">
                {buckets[t].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {buckets[tab].length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-12">
            No {tab.toLowerCase()} loans
          </p>
        ) : (
          buckets[tab].map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              currentUserId={uid}
              users={users}
            />
          ))
        )}
      </div>
    </div>
  )
}
