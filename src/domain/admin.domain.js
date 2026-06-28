import { runTransaction, doc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { GOVERNMENT_ID } from '../config/constants'
import { recordDailyBalance } from '../services/dailyBalance.service'

// ── Transfer between any two accounts (user ↔ user, gov ↔ user) ─────────────
export const transferFunds = async (fromId, toId, amount, note = '') => {
  if (!amount || amount <= 0) throw new Error('Amount must be positive')
  if (fromId === toId) throw new Error('Source and destination must differ')

  const isFromGov = fromId === GOVERNMENT_ID
  const isToGov = toId === GOVERNMENT_ID

  if (isFromGov && isToGov) throw new Error('Cannot transfer between government accounts')

  const govRef = doc(db, 'government', 'reserve')

  if (isFromGov) {
    // Government → User: deduct from reserve, credit user atomically
    const userRef = doc(db, 'users', toId)
    let userNewBalance

    await runTransaction(db, async (tx) => {
      const govSnap = await tx.get(govRef)
      const userSnap = await tx.get(userRef)
      if (!userSnap.exists()) throw new Error('Recipient not found')

      const reserve = govSnap.exists() ? govSnap.data().balance : 0
      if (reserve < amount)
        throw new Error(`Reserve insufficient. Available: ₹${reserve.toLocaleString('en-IN')}`)

      userNewBalance = userSnap.data().balance + amount
      tx.update(userRef, { balance: userNewBalance })
      govSnap.exists()
        ? tx.update(govRef, { balance: reserve - amount })
        : tx.set(govRef, { balance: reserve - amount })

      tx.set(doc(collection(db, 'transactions')), {
        fromId: GOVERNMENT_ID,
        toId,
        amount,
        type: 'admin_transfer',
        note,
        timestamp: serverTimestamp(),
      })
    })

    await recordDailyBalance(toId, userNewBalance)
  } else if (isToGov) {
    // User → Government: debit user, credit reserve atomically
    const userRef = doc(db, 'users', fromId)
    let userNewBalance

    await runTransaction(db, async (tx) => {
      const govSnap = await tx.get(govRef)
      const userSnap = await tx.get(userRef)
      if (!userSnap.exists()) throw new Error('Sender not found')

      const userBalance = userSnap.data().balance
      if (userBalance < amount)
        throw new Error(`Insufficient balance. Available: ₹${userBalance.toLocaleString('en-IN')}`)

      const reserve = govSnap.exists() ? govSnap.data().balance : 0
      userNewBalance = userBalance - amount

      tx.update(userRef, { balance: userNewBalance })
      govSnap.exists()
        ? tx.update(govRef, { balance: reserve + amount })
        : tx.set(govRef, { balance: reserve + amount })

      tx.set(doc(collection(db, 'transactions')), {
        fromId,
        toId: GOVERNMENT_ID,
        amount,
        type: 'admin_transfer',
        note,
        timestamp: serverTimestamp(),
      })
    })

    await recordDailyBalance(fromId, userNewBalance)
  } else {
    // User → User
    const fromRef = doc(db, 'users', fromId)
    const toRef = doc(db, 'users', toId)
    let fromNewBalance, toNewBalance

    await runTransaction(db, async (tx) => {
      const fromSnap = await tx.get(fromRef)
      const toSnap = await tx.get(toRef)
      if (!fromSnap.exists()) throw new Error('Sender not found')
      if (!toSnap.exists()) throw new Error('Recipient not found')

      const fromBalance = fromSnap.data().balance
      if (fromBalance < amount)
        throw new Error(`Insufficient balance. Available: ₹${fromBalance.toLocaleString('en-IN')}`)

      fromNewBalance = fromBalance - amount
      toNewBalance = toSnap.data().balance + amount

      tx.update(fromRef, { balance: fromNewBalance })
      tx.update(toRef, { balance: toNewBalance })
      tx.set(doc(collection(db, 'transactions')), {
        fromId,
        toId,
        amount,
        type: 'admin_transfer',
        note,
        timestamp: serverTimestamp(),
      })
    })

    await Promise.all([
      recordDailyBalance(fromId, fromNewBalance),
      recordDailyBalance(toId, toNewBalance),
    ])
  }
}

// ── Add to government reserve (print money) ──────────────────────────────────
export const addToReserve = async (amount) => {
  if (!amount || amount <= 0) throw new Error('Amount must be positive')

  const govRef = doc(db, 'government', 'reserve')

  await runTransaction(db, async (tx) => {
    const govSnap = await tx.get(govRef)
    const current = govSnap.exists() ? govSnap.data().balance : 0

    govSnap.exists()
      ? tx.update(govRef, { balance: current + amount })
      : tx.set(govRef, { balance: current + amount })

    tx.set(doc(collection(db, 'transactions')), {
      fromId: 'mint',
      toId: GOVERNMENT_ID,
      amount,
      type: 'admin_transfer',
      note: 'Reserve deposit',
      timestamp: serverTimestamp(),
    })
  })
}

// ── Placeholder for future tax feature ───────────────────────────────────────
export const taxUser = async (_userId, _amount) => {
  throw new Error('Tax feature not yet implemented')
}
