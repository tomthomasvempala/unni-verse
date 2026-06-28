import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'

const reserveRef = () => doc(db, 'government', 'reserve')

export const getReserve = async () => {
  const snap = await getDoc(reserveRef())
  if (!snap.exists()) {
    await setDoc(reserveRef(), { balance: 0 })
    return 0
  }
  return snap.data().balance
}

export const updateReserve = async (newBalance) => {
  const ref = reserveRef()
  const snap = await getDoc(ref)
  if (snap.exists()) {
    await updateDoc(ref, { balance: newBalance })
  } else {
    await setDoc(ref, { balance: newBalance })
  }
}

export const subscribeToReserve = (callback) => {
  return onSnapshot(reserveRef(), async (snap) => {
    if (!snap.exists()) {
      await setDoc(reserveRef(), { balance: 0 })
      callback(0)
    } else {
      callback(snap.data().balance)
    }
  })
}
