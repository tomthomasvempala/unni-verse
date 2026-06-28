import { runTransaction, doc, collection, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { createLoan, updateLoan } from '../services/loan.service'
import { recordDailyBalance } from '../services/dailyBalance.service'

// ── Step 1: Borrower requests a loan from a specific lender ──────────────────
export const requestLoan = async ({ requesterId, lenderId, requestedAmount }) => {
  if (!requestedAmount || requestedAmount <= 0)
    throw new Error('Loan amount must be positive')
  if (requesterId === lenderId) throw new Error('Cannot request a loan from yourself')
  return createLoan({ requesterId, lenderId, requestedAmount })
}

// ── Step 2: Lender sets repayment terms and approves ─────────────────────────
export const offerLoan = async (loanId, repaymentAmount) => {
  if (!repaymentAmount || repaymentAmount <= 0)
    throw new Error('Repayment amount must be positive')
  await updateLoan(loanId, {
    status: 'offered',
    repaymentAmount,
    remainingBalance: repaymentAmount,
  })
}

// ── Step 3a: Borrower accepts — money moves atomically ───────────────────────
export const acceptLoan = async (loanId) => {
  const loanRef = doc(db, 'loans', loanId)
  let loanData

  await runTransaction(db, async (tx) => {
    const loanSnap = await tx.get(loanRef)
    if (!loanSnap.exists()) throw new Error('Loan not found')
    loanData = loanSnap.data()
    if (loanData.status !== 'offered') throw new Error('Loan is not in offered state')

    const lenderRef = doc(db, 'users', loanData.lenderId)
    const borrowerRef = doc(db, 'users', loanData.requesterId)
    const lenderSnap = await tx.get(lenderRef)
    const borrowerSnap = await tx.get(borrowerRef)

    if (!lenderSnap.exists()) throw new Error('Lender account not found')
    if (!borrowerSnap.exists()) throw new Error('Borrower account not found')

    const lenderBalance = lenderSnap.data().balance
    if (lenderBalance < loanData.requestedAmount)
      throw new Error(
        `Lender has insufficient funds. Available: ₹${lenderBalance.toLocaleString('en-IN')}`
      )

    tx.update(lenderRef, { balance: lenderBalance - loanData.requestedAmount })
    tx.update(borrowerRef, {
      balance: borrowerSnap.data().balance + loanData.requestedAmount,
    })
    tx.update(loanRef, { status: 'active', updatedAt: serverTimestamp() })
    tx.set(doc(collection(db, 'transactions')), {
      fromId: loanData.lenderId,
      toId: loanData.requesterId,
      amount: loanData.requestedAmount,
      type: 'loan_disbursement',
      loanId,
      timestamp: serverTimestamp(),
      fromBalanceAfter: lenderBalance - loanData.requestedAmount,
      toBalanceAfter: borrowerSnap.data().balance + loanData.requestedAmount,
    })
  })

  // Record daily balance snapshots (best-effort, non-blocking)
  const [lenderDoc, borrowerDoc] = await Promise.all([
    getDoc(doc(db, 'users', loanData.lenderId)),
    getDoc(doc(db, 'users', loanData.requesterId)),
  ])
  await Promise.all([
    recordDailyBalance(loanData.lenderId, lenderDoc.data().balance),
    recordDailyBalance(loanData.requesterId, borrowerDoc.data().balance),
  ])
}

// ── Step 3b: Either party rejects the loan ───────────────────────────────────
export const rejectLoan = async (loanId) => {
  await updateLoan(loanId, { status: 'rejected' })
}

// ── Lender: reduce remaining balance by a custom amount (forgive part) ───────
export const adjustLoanBalance = async (loanId, reduction) => {
  if (!reduction || reduction <= 0) throw new Error('Reduction must be positive')
  const loanRef = doc(db, 'loans', loanId)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(loanRef)
    if (!snap.exists()) throw new Error('Loan not found')
    const loan = snap.data()
    if (loan.status !== 'active') throw new Error('Loan is not active')
    const newRemaining = Math.max(0, loan.remainingBalance - reduction)
    tx.update(loanRef, {
      remainingBalance: newRemaining,
      status: newRemaining <= 0 ? 'repaid' : 'active',
      updatedAt: serverTimestamp(),
    })
  })
}

// ── Lender: fully settle/forgive the remaining balance ───────────────────────
export const settleLoan = async (loanId) => {
  const loanRef = doc(db, 'loans', loanId)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(loanRef)
    if (!snap.exists()) throw new Error('Loan not found')
    if (snap.data().status !== 'active') throw new Error('Loan is not active')
    tx.update(loanRef, { remainingBalance: 0, status: 'repaid', updatedAt: serverTimestamp() })
  })
}

// ── Ongoing: Borrower repays any amount at any time ──────────────────────────
export const repayLoan = async (loanId, repayerId, amount) => {
  if (!amount || amount <= 0) throw new Error('Repayment amount must be positive')

  const loanRef = doc(db, 'loans', loanId)
  let loanData, lenderNewBalance, repayerNewBalance

  await runTransaction(db, async (tx) => {
    const loanSnap = await tx.get(loanRef)
    if (!loanSnap.exists()) throw new Error('Loan not found')
    loanData = loanSnap.data()
    if (loanData.status !== 'active') throw new Error('Loan is not active')

    const repayerRef = doc(db, 'users', repayerId)
    const lenderRef = doc(db, 'users', loanData.lenderId)
    const repayerSnap = await tx.get(repayerRef)
    const lenderSnap = await tx.get(lenderRef)

    if (!repayerSnap.exists()) throw new Error('Repayer account not found')

    const repayerBalance = repayerSnap.data().balance
    const actualAmount = Math.min(amount, loanData.remainingBalance)

    if (repayerBalance < actualAmount)
      throw new Error(
        `Insufficient balance. Available: ₹${repayerBalance.toLocaleString('en-IN')}`
      )

    repayerNewBalance = repayerBalance - actualAmount
    lenderNewBalance = lenderSnap.data().balance + actualAmount
    const newRemaining = loanData.remainingBalance - actualAmount
    const newStatus = newRemaining <= 0 ? 'repaid' : 'active'

    tx.update(repayerRef, { balance: repayerNewBalance })
    tx.update(lenderRef, { balance: lenderNewBalance })
    tx.update(loanRef, {
      remainingBalance: newRemaining,
      status: newStatus,
      updatedAt: serverTimestamp(),
    })
    tx.set(doc(collection(db, 'transactions')), {
      fromId: repayerId,
      toId: loanData.lenderId,
      amount: actualAmount,
      type: 'loan_repayment',
      loanId,
      timestamp: serverTimestamp(),
      fromBalanceAfter: repayerNewBalance,
      toBalanceAfter: lenderNewBalance,
    })
  })

  await Promise.all([
    recordDailyBalance(repayerId, repayerNewBalance),
    recordDailyBalance(loanData.lenderId, lenderNewBalance),
  ])
}
