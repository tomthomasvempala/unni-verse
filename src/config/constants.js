// ─────────────────────────────────────────────────────────────────────────────
// App Constants
//
// ADMIN_EMAILS: Add the Google email address(es) that should have admin access.
//   The first user to sign in with one of these emails gets isAdmin: true.
// ─────────────────────────────────────────────────────────────────────────────

export const ADMIN_EMAILS = [
  'tomthomas.mec@gmail.com',
  'admin@unniverse.game',
]

export const CURRENCY_SYMBOL = '₹'

export const DEFAULT_BALANCE = 0

export const GOVERNMENT_ID = 'government'
export const ADMIN_PASSWORD_HASH = import.meta.env.VITE_ADMIN_PASSWORD_HASH ?? ''
