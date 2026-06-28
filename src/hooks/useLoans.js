import { useState, useEffect } from 'react'
import { subscribeToUserLoans, subscribeToAllLoans } from '../services/loan.service'

export const useLoans = (userId, isAdmin = false) => {
  const [loans, setLoans] = useState([])
  useEffect(() => {
    if (!userId) return
    return isAdmin
      ? subscribeToAllLoans(setLoans)
      : subscribeToUserLoans(userId, setLoans)
  }, [userId, isAdmin])
  return loans
}
