import { useState, useEffect } from 'react'
import {
  subscribeToUserMoneyRequests,
  subscribeToAllMoneyRequests,
} from '../services/moneyRequest.service'

export const useMoneyRequests = (userId, isAdmin = false) => {
  const [requests, setRequests] = useState([])
  useEffect(() => {
    if (!userId) return
    return isAdmin
      ? subscribeToAllMoneyRequests(setRequests)
      : subscribeToUserMoneyRequests(userId, setRequests)
  }, [userId, isAdmin])
  return requests
}
