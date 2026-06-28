import { useState, useEffect } from 'react'
import {
  subscribeToUserTransactions,
  subscribeToAllTransactions,
} from '../services/transaction.service'

export const useTransactions = (userId, isAdmin = false) => {
  const [transactions, setTransactions] = useState([])
  useEffect(() => {
    if (!userId) return
    return isAdmin
      ? subscribeToAllTransactions(setTransactions)
      : subscribeToUserTransactions(userId, setTransactions)
  }, [userId, isAdmin])
  return transactions
}
