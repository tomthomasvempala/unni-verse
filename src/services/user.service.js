import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { DEFAULT_BALANCE } from '../config/constants'

export const createUserIfNotExists = async (firebaseUser, isAdmin = false) => {
  const ref = doc(db, 'users', firebaseUser.uid)
  const snap = await getDoc(ref)

  const displayName =
    firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: firebaseUser.uid,
      displayName,
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL || null,
      balance: DEFAULT_BALANCE,
      isAdmin,
      createdAt: serverTimestamp(),
    })
  } else if (isAdmin && !snap.data().isAdmin) {
    // Promote to admin if email matches ADMIN_EMAILS and wasn't already admin
    await updateDoc(ref, { isAdmin: true })
  }
}

export const getUser = async (userId) => {
  const snap = await getDoc(doc(db, 'users', userId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const subscribeToUser = (userId, callback) => {
  return onSnapshot(doc(db, 'users', userId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() })
  })
}

export const listUsers = (callback) => {
  return onSnapshot(
    query(collection(db, 'users'), orderBy('displayName')),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  )
}
