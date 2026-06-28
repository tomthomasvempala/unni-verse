import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '../config/firebase'
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../config/constants'

const provider = new GoogleAuthProvider()

export const signInWithGoogle = () => signInWithPopup(auth, provider)

// Admin email+password login. Auto-creates the account on first run
// if the correct default password is used.
export const signInAsAdmin = async (password) => {
  try {
    return await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password)
  } catch {
    // Account doesn't exist yet — create it (only with the correct default password)
    try {
      return await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, password)
    } catch (createErr) {
      if (createErr.code === 'auth/email-already-in-use') {
        throw new Error('Wrong admin password')
      }
      throw new Error('Admin login failed')
    }
  }
}

export const signOut = () => fbSignOut(auth)
