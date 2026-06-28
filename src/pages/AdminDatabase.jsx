import { useRef, useState } from 'react'
import { Download, Upload, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { exportDatabase, importDatabase, resetEconomy } from '../services/database.service'

// ── Confirmation modal ────────────────────────────────────────────────────────
function ConfirmModal({ title, description, danger, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className={danger ? 'text-red-400 flex-shrink-0 mt-0.5' : 'text-amber-400 flex-shrink-0 mt-0.5'} size={22} />
          <div>
            <h3 className="text-white font-semibold text-base">{title}</h3>
            <p className="text-gray-400 text-sm mt-1">{description}</p>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-600 text-gray-300 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              danger
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            {loading ? 'Working…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ icon: Icon, iconColor, title, subtitle, danger, children }) {
  return (
    <div className={`bg-gray-900 border rounded-2xl p-6 space-y-4 ${danger ? 'border-red-900/50' : 'border-gray-800'}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${danger ? 'bg-red-950' : 'bg-gray-800'}`}>
          <Icon className={iconColor} size={20} />
        </div>
        <div>
          <h2 className="text-white font-semibold">{title}</h2>
          <p className="text-gray-400 text-sm mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

// ── Feedback banner ───────────────────────────────────────────────────────────
function Feedback({ msg, ok }) {
  if (!msg) return null
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${ok ? 'bg-emerald-950 border border-emerald-800 text-emerald-300' : 'bg-red-950 border border-red-800 text-red-300'}`}>
      {ok ? <CheckCircle size={15} /> : <XCircle size={15} />}
      {msg}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminDatabase() {
  const fileInputRef = useRef(null)
  const [modal, setModal] = useState(null) // { type: 'import'|'reset', pendingData? }
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState({ msg: '', ok: true })
  const [importFileName, setImportFileName] = useState('')

  const showFeedback = (msg, ok) => setFeedback({ msg, ok })

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setLoading(true)
    setFeedback({ msg: '', ok: true })
    try {
      const snapshot = await exportDatabase()
      const json = JSON.stringify(snapshot, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      a.download = `unniverse-snapshot-${ts}.json`
      a.click()
      URL.revokeObjectURL(url)
      showFeedback('Snapshot exported successfully.', true)
    } catch (e) {
      showFeedback(e.message, false)
    } finally {
      setLoading(false)
    }
  }

  // ── Import — file selection ─────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result)
        setModal({ type: 'import', pendingData: parsed })
      } catch {
        showFeedback('Invalid JSON file.', false)
      }
    }
    reader.readAsText(file)
    // Reset input so the same file can be selected again
    e.target.value = ''
  }

  // ── Import — confirmed ──────────────────────────────────────────────────────
  const handleImportConfirm = async () => {
    setLoading(true)
    try {
      await importDatabase(modal.pendingData)
      setModal(null)
      setImportFileName('')
      showFeedback('Database imported successfully.', true)
    } catch (e) {
      showFeedback(e.message, false)
    } finally {
      setLoading(false)
    }
  }

  // ── Reset — confirmed ───────────────────────────────────────────────────────
  const handleResetConfirm = async () => {
    setLoading(true)
    try {
      await resetEconomy()
      setModal(null)
      showFeedback('Economy reset. All balances set to default.', true)
    } catch (e) {
      showFeedback(e.message, false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <h1 className="text-white text-2xl font-bold hidden md:block">Database</h1>

      <Feedback {...feedback} />

      {/* ── Export ─────────────────────────────────────────────────────────── */}
      <SectionCard
        icon={Download}
        iconColor="text-emerald-400"
        title="Export"
        subtitle="Download a full JSON snapshot of all balances, transaction history, loans, and money requests."
      >
        <button
          onClick={handleExport}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Download size={15} />
          Download Snapshot
        </button>
      </SectionCard>

      {/* ── Import ─────────────────────────────────────────────────────────── */}
      <SectionCard
        icon={Upload}
        iconColor="text-amber-400"
        title="Import"
        subtitle="Restore from a previously exported JSON snapshot. This will overwrite existing economy data and user balances."
      >
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Upload size={15} />
            Select Snapshot File
          </button>
          {importFileName && (
            <span className="text-gray-400 text-sm truncate max-w-xs">{importFileName}</span>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />
      </SectionCard>

      {/* ── Reset Economy ───────────────────────────────────────────────────── */}
      <SectionCard
        icon={Trash2}
        iconColor="text-red-400"
        title="Reset Economy"
        subtitle="Permanently deletes all transactions, loans, and money request history. Resets every player balance to the default. User accounts are retained."
        danger
      >
        <button
          onClick={() => setModal({ type: 'reset' })}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Trash2 size={15} />
          Reset Economy
        </button>
      </SectionCard>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {modal?.type === 'import' && (
        <ConfirmModal
          title="Import Snapshot"
          description="This will overwrite all existing economy data and player balances with the contents of the selected file. User accounts are retained but their balances will be replaced. This action cannot be undone."
          danger={false}
          loading={loading}
          onConfirm={handleImportConfirm}
          onCancel={() => { setModal(null); setImportFileName('') }}
        />
      )}
      {modal?.type === 'reset' && (
        <ConfirmModal
          title="Reset Economy"
          description="This will permanently delete all transactions, loans, daily balance history, and money requests. Every player's balance will be reset to the default. User accounts are not affected. This cannot be undone."
          danger
          loading={loading}
          onConfirm={handleResetConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  )
}
