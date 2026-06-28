import { useState, useEffect } from 'react'
import { subscribeToUserLoans, subscribeToAllLoans } from '../services/loan.service'

export const useLoans = (userId, isAdmin = false) => {
  const [loans, setLoans] = useState([])
  useEffect(() => {
    if (isAdmin) return subscribeToAllLoans(setLoans)
    if (!userId) return
    return subscribeToUserLoans(userId, setLoans)
  }, [userId, isAdmin])
  return loans
}
