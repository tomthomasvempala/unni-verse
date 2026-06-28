import {
  collection,
  getDocs,
  doc,
  setDoc,
  writeBatch,
  Timestamp,
  getDoc,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { DEFAULT_BALANCE } from '../config/constants'

const ECONOMY_COLLECTIONS = ['transactions', 'loans', 'moneyRequests', 'dailyBalances']
const BATCH_SIZE = 400

// ── Serialisation helpers ─────────────────────────────────────────────────────

const serializeValue = (v) => {
  if (v && typeof v === 'object' && typeof v.toMillis === 'function') {
    return { __type: 'Timestamp', millis: v.toMillis() }
  }
  return v
}

const serializeDoc = (data) => {
  const out = {}
  for (const [k, v] of Object.entries(data)) {
    out[k] = serializeValue(v)
  }
  return out
}

const deserializeValue = (v) => {
  if (v && typeof v === 'object' && v.__type === 'Timestamp' && typeof v.millis === 'number') {
    return Timestamp.fromMillis(v.millis)
  }
  return v
}

const deserializeDoc = (data) => {
  const out = {}
  for (const [k, v] of Object.entries(data)) {
    out[k] = deserializeValue(v)
  }
  return out
}

const fetchCollection = async (name) => {
  const snap = await getDocs(collection(db, name))
  return snap.docs.map((d) => ({ id: d.id, ...serializeDoc(d.data()) }))
}

// ── Export ────────────────────────────────────────────────────────────────────

export const exportDatabase = async () => {
  const [users, transactions, loans, moneyRequests, dailyBalances] = await Promise.all([
    fetchCollection('users'),
    fetchCollection('transactions'),
    fetchCollection('loans'),
    fetchCollection('moneyRequests'),
    fetchCollection('dailyBalances'),
  ])

  const govSnap = await getDoc(doc(db, 'government', 'reserve'))
  const government = govSnap.exists() ? serializeDoc(govSnap.data()) : { balance: 0 }

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    users,
    transactions,
    loans,
    moneyRequests,
    dailyBalances,
    government,
  }
}

// ── Import ────────────────────────────────────────────────────────────────────
// Restores economy data and user balances. Does NOT delete existing users that
// are absent from the snapshot (retains original users).

const writeCollectionFromSnapshot = async (name, docs) => {
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    docs.slice(i, i + BATCH_SIZE).forEach(({ id, ...data }) => {
      batch.set(doc(db, name, id), deserializeDoc(data))
    })
    await batch.commit()
  }
}

export const importDatabase = async (snapshot) => {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('Invalid snapshot format')
  }

  const tasks = []
  for (const name of ECONOMY_COLLECTIONS) {
    if (Array.isArray(snapshot[name])) {
      tasks.push(writeCollectionFromSnapshot(name, snapshot[name]))
    }
  }

  // Restore user documents (balances etc.) without deleting unmatched users
  if (Array.isArray(snapshot.users)) {
    tasks.push(writeCollectionFromSnapshot('users', snapshot.users))
  }

  // Restore government reserve
  if (snapshot.government && typeof snapshot.government === 'object') {
    tasks.push(setDoc(doc(db, 'government', 'reserve'), deserializeDoc(snapshot.government)))
  }

  await Promise.all(tasks)
}

// ── Reset Economy ─────────────────────────────────────────────────────────────
// Deletes all economy records, resets user balances to DEFAULT_BALANCE, and
// resets the government reserve to 0. Does NOT delete user accounts.

const deleteAllDocs = async (name) => {
  const snap = await getDocs(collection(db, name))
  const refs = snap.docs
  for (let i = 0; i < refs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    refs.slice(i, i + BATCH_SIZE).forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
}

export const resetEconomy = async () => {
  // Clear all economy collections in parallel
  await Promise.all(ECONOMY_COLLECTIONS.map(deleteAllDocs))

  // Reset all user balances
  const usersSnap = await getDocs(collection(db, 'users'))
  const userDocs = usersSnap.docs
  for (let i = 0; i < userDocs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    userDocs.slice(i, i + BATCH_SIZE).forEach((d) => {
      batch.update(d.ref, { balance: DEFAULT_BALANCE })
    })
    await batch.commit()
  }

  // Reset government reserve
  await setDoc(doc(db, 'government', 'reserve'), { balance: 0 })
}
