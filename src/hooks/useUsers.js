import { useState, useEffect } from 'react'
import { listUsers } from '../services/user.service'

export const useUsers = () => {
  const [users, setUsers] = useState([])
  useEffect(() => listUsers(setUsers), [])
  return users
}
