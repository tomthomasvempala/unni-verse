import { useState, useEffect } from 'react'
import { subscribeToReserve } from '../services/government.service'

export const useGovernment = () => {
  const [reserve, setReserve] = useState(0)
  useEffect(() => subscribeToReserve(setReserve), [])
  return reserve
}
