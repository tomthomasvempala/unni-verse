import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '../config/firebase'

export const subscribeToUserTransactions = (userId, callback, maxResults = 100) => {
  let asSender = []
  let asReceiver = []

  const merge = () => {
    const map = new Map()
    ;[...asSender, ...asReceiver].forEach((t) => map.set(t.id, t))
    const all = Array.from(map.values())
    all.sort(
      (a, b) =>
        (b.timestamp?.toMillis?.() ?? 0) - (a.timestamp?.toMillis?.() ?? 0)
    )
    callback(all)
  }

  const q1 = query(
    collection(db, 'transactions'),
    where('fromId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(maxResults)
  )
  const q2 = query(
    collection(db, 'transactions'),
    where('toId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(maxResults)
  )

  const unsub1 = onSnapshot(q1, (snap) => {
    asSender = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    merge()
  })
  const unsub2 = onSnapshot(q2, (snap) => {
    asReceiver = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    merge()
  })

  return () => {
    unsub1()
    unsub2()
  }
}

export const subscribeToAllTransactions = (callback, maxResults = 200) => {
  return onSnapshot(
    query(
      collection(db, 'transactions'),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    ),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  )
}
