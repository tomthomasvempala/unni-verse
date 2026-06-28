import { doc, setDoc, collection, query, where, limit, getDocs, serverTimestamp } from 'firebase/firestore'
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
  // No orderBy on compound query — avoids composite index requirement.
  const snap = await getDocs(
    query(
      collection(db, 'dailyBalances'),
      where('userId', '==', userId),
      limit(days)
    )
  )
  return snap.docs
    .map((d) => d.data())
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .slice(-days)
}
