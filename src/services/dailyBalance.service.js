import { doc, setDoc, collection, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { format } from 'date-fns'

export const recordDailyBalance = async (userId, balance) => {
  const date = format(new Date(), 'yyyy-MM-dd')
  const id = `${userId}_${date}`
  await setDoc(
    doc(db, 'dailyBalances', id),
    { userId, date, balance, recordedAt: serverTimestamp() },
    { merge: true }
  )
}

export const getDailyBalances = async (userId, days = 30) => {
  const snap = await getDocs(
    query(
      collection(db, 'dailyBalances'),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(days)
    )
  )
  return snap.docs.map((d) => d.data()).reverse()
}
