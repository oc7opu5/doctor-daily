import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { createTransaction } from '../api/service'

const CURRENCIES = [
  { value: 'BDT', label: '৳ BDT' },
  { value: 'USD', label: '$ USD' },
  { value: 'CAD', label: 'C$ CAD' },
]

export default function QuickAdd() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ raw_description: '', amount: '', currency: 'BDT', tx_type: 'expense', transaction_date: '' })

  const handleSave = async () => {
    if (!form.raw_description.trim() || !form.amount) return
    setLoading(true)
    try {
      await createTransaction({
        raw_description: form.raw_description,
        amount: parseFloat(form.amount),
        currency: form.currency,
        tx_type: form.tx_type,
        transaction_date: form.transaction_date || null,
      })
      setToast(`✅ Saved: ${form.raw_description}`)
      setForm({ raw_description: '', amount: '', currency: 'BDT', tx_type: 'expense', transaction_date: '' })
      setOpen(false)
      setTimeout(() => setToast(''), 3000)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* FAB */}
      <button onClick={() => setOpen(true)} className="fab" aria-label="Quick add transaction">
        <Plus size={24} />
      </button>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-pulse">
          {toast}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-dark-900 border border-dark-700 w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Quick Add</h2>
              <button onClick={() => setOpen(false)} className="text-dark-400 hover:text-white p-1"><X size={20} /></button>
            </div>
            <input value={form.raw_description} onChange={e => setForm({ ...form, raw_description: e.target.value })}
              placeholder="What was it? (lunch, uber, salary...)"
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none"
              autoFocus />
            <div className="flex gap-2">
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="Amount" step="0.01"
                className="flex-1 min-w-0 px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none" />
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                className="px-3 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none">
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setForm({ ...form, tx_type: 'expense' })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.tx_type === 'expense' ? 'bg-red-600 text-white' : 'bg-dark-800 text-dark-400'}`}>
                Expense
              </button>
              <button onClick={() => setForm({ ...form, tx_type: 'income' })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.tx_type === 'income' ? 'bg-green-600 text-white' : 'bg-dark-800 text-dark-400'}`}>
                Income
              </button>
            </div>
            <input type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none" />
            <button onClick={handleSave} disabled={loading || !form.raw_description.trim() || !form.amount}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
