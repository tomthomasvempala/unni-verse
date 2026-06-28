import { CURRENCY_SYMBOL } from '../config/constants'

export default function UserSelector({
  users,
  value,
  onChange,
  excludeId,
  label = 'Select user',
  includeGovernment = false,
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
    >
      <option value="">{label}</option>
      {includeGovernment && (
        <option value="government">🏛 Government Reserve</option>
      )}
      {users
        .filter((u) => u.id !== excludeId)
        .map((u) => (
          <option key={u.id} value={u.id}>
            {u.displayName}
            {u.isAdmin ? ' (Admin)' : ` — ${CURRENCY_SYMBOL}${(u.balance ?? 0).toLocaleString('en-IN')}`}
          </option>
        ))}
    </select>
  )
}
