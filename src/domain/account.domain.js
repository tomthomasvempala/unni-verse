import { runTransaction, doc, collection, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { recordDailyBalance } from '../services/dailyBalance.service'
import { createMoneyRequest, updateMoneyRequest } from '../services/moneyRequest.service'

// ── User-facing: creates a pending request for the government to approve ─────

export const requestDeposit = async (userId, amount) => {
  if (!amount || amount <= 0) throw new Error('Amount must be positive')
  await createMoneyRequest({ userId, type: 'deposit', amount })
}

export const requestWithdrawal = async (userId, amount) => {
  if (!amount || amount <= 0) throw new Error('Amount must be positive')
  // Quick balance pre-check for UX (re-validated atomically in approveMoneyRequest)
  const userSnap = await getDoc(doc(db, 'users', userId))
  if (!userSnap.exists()) throw new Error('User not found')
  const balance = userSnap.data().balance
  if (balance < amount)
    throw new Error(
      `Insufficient balance. Available: ₹${balance.toLocaleString('en-IN')}`
    )
  await createMoneyRequest({ userId, type: 'withdrawal', amount })
}

// ── Admin-facing: approve or reject a pending money request ──────────────────

export const approveMoneyRequest = async (requestId) => {
  const reqRef = doc(db, 'moneyRequests', requestId)
  let reqData, newBalance

  await runTransaction(db, async (tx) => {
    const reqSnap = await tx.get(reqRef)
    if (!reqSnap.exists()) throw new Error('Request not found')
    reqData = reqSnap.data()
    if (reqData.status !== 'pending') throw new Error('Request already processed')

    const userRef = doc(db, 'users', reqData.userId)
    const userSnap = await tx.get(userRef)
    if (!userSnap.exists()) throw new Error('User not found')

    const currentBalance = userSnap.data().balance

    if (reqData.type === 'withdrawal') {
      if (currentBalance < reqData.amount)
        throw new Error(
          `User has insufficient balance. Available: ₹${currentBalance.toLocaleString('en-IN')}`
        )
      newBalance = currentBalance - reqData.amount
    } else {
      newBalance = currentBalance + reqData.amount
    }

    tx.update(userRef, { balance: newBalance })
    tx.update(reqRef, { status: 'approved', processedAt: serverTimestamp() })
    tx.set(doc(collection(db, 'transactions')), {
      fromId: reqData.type === 'deposit' ? 'external' : reqData.userId,
      toId: reqData.type === 'deposit' ? reqData.userId : 'external',
      amount: reqData.amount,
      type: reqData.type,
      timestamp: serverTimestamp(),
    })
  })

  await recordDailyBalance(reqData.userId, newBalance)
}

export const rejectMoneyRequest = async (requestId) => {
  await updateMoneyRequest(requestId, { status: 'rejected' })
}

