import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

export const createLoan = async (loanData) => {
  const ref = await addDoc(collection(db, 'loans'), {
    ...loanData,
    status: 'pending',
    repaymentAmount: null,
    remainingBalance: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export const updateLoan = async (loanId, updates) => {
  await updateDoc(doc(db, 'loans', loanId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export const subscribeToUserLoans = (userId, callback) => {
  let asRequester = []
  let asLender = []

  const merge = () => {
    const all = [...asRequester, ...asLender]
    all.sort(
      (a, b) =>
        (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
    )
    callback(all)
  }

  const unsub1 = onSnapshot(
    query(collection(db, 'loans'), where('requesterId', '==', userId)),
    (snap) => {
      asRequester = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      merge()
    }
  )

  const unsub2 = onSnapshot(
    query(collection(db, 'loans'), where('lenderId', '==', userId)),
    (snap) => {
      asLender = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      merge()
    }
  )

  return () => {
    unsub1()
    unsub2()
  }
}

export const subscribeToAllLoans = (callback) => {
  return onSnapshot(collection(db, 'loans'), (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    all.sort(
      (a, b) =>
        (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
    )
    callback(all)
  })
}
