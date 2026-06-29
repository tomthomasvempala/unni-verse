import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { onSnapshot, doc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { signInWithGoogle, signOut as fbSignOut } from '../services/auth.service'
import { createUserIfNotExists } from '../services/user.service'
import { sha256 } from 'js-sha256'
import { ADMIN_EMAILS, ADMIN_PASSWORD_HASH } from '../config/constants'

const FAKE_ADMIN_USER = {
  uid: 'government',
  email: 'admin@unniverse.game',
  displayName: 'Government',
  photoURL: null,
}

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email)
        await createUserIfNotExists(firebaseUser, isAdmin)
        setCurrentUser(firebaseUser)
        setLoading(false)
      } else if (localStorage.getItem('adminSession') === 'true') {
        // Restore admin session — no Firebase auth needed
        await createUserIfNotExists(FAKE_ADMIN_USER, true)
        setCurrentUser(FAKE_ADMIN_USER)
        setLoading(false)
      } else {
        setCurrentUser(null)
        setUserProfile(null)
        setLoading(false)
      }
    })
    return unsub
  }, [])

  // Subscribe to real-time profile updates (balance changes reflected instantly)
  useEffect(() => {
    if (!currentUser) return
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
      if (snap.exists()) setUserProfile({ id: snap.id, ...snap.data() })
    })
    return unsub
  }, [currentUser])

  const login = () => signInWithGoogle()

  const adminLogin = async (password) => {
    if (ADMIN_PASSWORD_HASH === '') throw new Error('Admin login is not configured')
    if (sha256(password) !== ADMIN_PASSWORD_HASH) throw new Error('Wrong admin password')
    localStorage.setItem('adminSession', 'true')
    await createUserIfNotExists(FAKE_ADMIN_USER, true)
    setCurrentUser(FAKE_ADMIN_USER)
  }

  const logout = async () => {
    if (currentUser?.uid === 'government') {
      localStorage.removeItem('adminSession')
      setCurrentUser(null)
      setUserProfile(null)
    } else {
      await fbSignOut()
    }
  }

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, login, adminLogin, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
