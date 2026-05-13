import { useState, useEffect, useCallback } from 'react'
import { getAllOwners, createOwner, updateOwner, resetOwnerPassword } from '@shared/api/owners'
import { getPGList } from '@shared/api/pgs'
import { useToast } from '@shared/components/Toast'

const inputCls = 'w-full border border-[#e0e0e0] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action focus:border-action bg-gray-50'

function CreateOwnerModal({ pgs, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', pgId: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  async function handleSubmit() {
    if (!form.name || !form.email || !form.password || !form.pgId) {
      setError('All fields are required')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await createOwner(form)
      toast('Owner account created', 'success')
      onCreated(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create owner')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Create Owner Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Name</label>
            <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Owner name" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
            <input type="email" className={inputCls} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="owner@example.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Temp Password</label>
            <input type="password" className={inputCls} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Link to PG</label>
            <select className={`${inputCls} bg-white`} value={form.pgId} onChange={e => setForm(f => ({ ...f, pgId: e.target.value }))}>
              <option value="">Select a PG…</option>
              {pgs.map(pg => (
                <option key={pg._id} value={pg._id}>{pg.name} — {pg.location?.city}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 border border-[#e0e0e0] text-gray-700 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-[10px]">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-brand hover:bg-brand-light disabled:opacity-60 text-black text-sm font-medium py-2.5 rounded-[10px]">
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ResetPasswordModal({ owner, onClose }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  async function handleSubmit() {
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError('')
    setLoading(true)
    try {
      await resetOwnerPassword(owner._id, password)
      toast('Password updated', 'success')
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Reset Password</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">Set a new password for <strong>{owner.name}</strong>.</p>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">New Password</label>
            <input type="password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 border border-[#e0e0e0] text-gray-700 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-[10px]">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-brand hover:bg-brand-light disabled:opacity-60 text-black text-sm font-medium py-2.5 rounded-[10px]">
            {loading ? 'Saving…' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReassignModal({ owner, pgs, onClose, onUpdated }) {
  const [pgId, setPgId] = useState(owner.pgId?._id || owner.pgId || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      const res = await updateOwner(owner._id, { pgId })
      toast('Owner updated', 'success')
      onUpdated(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Reassign PG</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">Change which PG <strong>{owner.name}</strong> manages.</p>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">PG</label>
            <select className={`${inputCls} bg-white`} value={pgId} onChange={e => setPgId(e.target.value)}>
              <option value="">No PG (unlinked)</option>
              {pgs.map(pg => (
                <option key={pg._id} value={pg._id}>{pg.name} — {pg.location?.city}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 border border-[#e0e0e0] text-gray-700 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-[10px]">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-brand hover:bg-brand-light disabled:opacity-60 text-black text-sm font-medium py-2.5 rounded-[10px]">
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RowSkeleton() {
  return (
    <tr className="animate-pulse">
      {[1,2,3,4,5].map(i => (
        <td key={i} className="px-4 py-3.5"><div className="h-4 bg-gray-200 rounded" /></td>
      ))}
    </tr>
  )
}

export default function OwnersPage() {
  const [owners, setOwners] = useState([])
  const [pgs, setPgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)
  const [reassignTarget, setReassignTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [ownersRes, pgsRes] = await Promise.all([
        getAllOwners(),
        getPGList({ limit: 100 }),
      ])
      setOwners(ownersRes.data)
      setPgs(pgsRes.data)
    } catch {
      setError('Failed to load owners')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function handleCreated(owner) {
    setOwners(prev => [owner, ...prev])
  }

  function handleUpdated(owner) {
    setOwners(prev => prev.map(o => o._id === owner._id ? owner : o))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PG Owners</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage owner accounts and their PG assignments</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-brand hover:bg-brand-light text-black text-sm font-semibold px-4 py-2.5 rounded-[10px] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Owner
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">PG</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">City</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
                : owners.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">No owner accounts yet</td>
                  </tr>
                )
                : owners.map(owner => (
                  <tr key={owner._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-gray-900">{owner.name}</div>
                      <div className="text-xs text-gray-400">{owner.email}</div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-700">
                      {owner.pgId?.name || <span className="text-gray-400 italic">Unlinked</span>}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">
                      {owner.pgId?.location?.city || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">
                      {new Date(owner.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setReassignTarget(owner)}
                          className="text-xs font-medium px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                        >
                          Edit PG
                        </button>
                        <button
                          onClick={() => setResetTarget(owner)}
                          className="text-xs font-medium px-3 py-1.5 bg-action-50 hover:bg-action-100 text-action rounded-lg"
                        >
                          Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {createOpen && <CreateOwnerModal pgs={pgs} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />}
      {resetTarget && <ResetPasswordModal owner={resetTarget} onClose={() => setResetTarget(null)} />}
      {reassignTarget && <ReassignModal owner={reassignTarget} pgs={pgs} onClose={() => setReassignTarget(null)} onUpdated={handleUpdated} />}
    </div>
  )
}
