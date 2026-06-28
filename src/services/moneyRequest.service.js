import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

export const createMoneyRequest = async (data) => {
  const ref = await addDoc(collection(db, 'moneyRequests'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export const updateMoneyRequest = async (requestId, updates) => {
  await updateDoc(doc(db, 'moneyRequests', requestId), {
    ...updates,
    processedAt: serverTimestamp(),
  })
}

export const subscribeToUserMoneyRequests = (userId, callback) => {
  return onSnapshot(
    query(
      collection(db, 'moneyRequests'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  )
}

export const subscribeToAllMoneyRequests = (callback) => {
  return onSnapshot(
    query(collection(db, 'moneyRequests'), orderBy('createdAt', 'desc')),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  )
}
