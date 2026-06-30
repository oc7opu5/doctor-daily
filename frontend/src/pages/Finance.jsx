import { useState, useEffect } from 'react'
import { Plus, Sparkles, Trash2, MessageCircle, X, Pencil, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { listTransactions, createTransaction, updateTransaction, deleteTransaction, getFinanceSummary, analyzeFinance, askFinanceAdvice } from '../api/service'

const CATEGORIES = [
  'Food & Dining', 'Transportation', 'Bills & Utilities', 'Entertainment',
  'Shopping', 'Health & Medical', 'Education', 'Salary & Wages',
  'Freelance & Side Income', 'Investment', 'Loan Given', 'Loan Received',
  'Savings', 'Transfer', 'Gift', 'Other'
]

const TX_TYPES = [
  { value: 'expense', label: 'Expense', color: 'text-red-400' },
  { value: 'income', label: 'Income', color: 'text-green-400' },
  { value: 'loan_given', label: 'Loan Given', color: 'text-orange-400' },
  { value: 'loan_received', label: 'Loan Received', color: 'text-blue-400' },
  { value: 'savings', label: 'Savings', color: 'text-purple-400' },
  { value: 'transfer', label: 'Transfer', color: 'text-cyan-400' },
]

const CURRENCIES = [
  { value: 'BDT', label: '৳ BDT', symbol: '৳' },
  { value: 'USD', label: '$ USD', symbol: '$' },
  { value: 'CAD', label: 'C$ CAD', symbol: 'C$' },
]

const getSymbol = (currency) => CURRENCIES.find(c => c.value === currency)?.symbol || currency + ' '

export default function Finance() {
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ raw_description: '', amount: '', currency: 'BDT', tx_type: '', transaction_date: '' })
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [adviceQ, setAdviceQ] = useState('')
  const [advice, setAdvice] = useState('')
  const [askingAdvice, setAskingAdvice] = useState(false)
  const [editingTx, setEditingTx] = useState(null)
  const [editForm, setEditForm] = useState({})

  const reload = () => {
    listTransactions().then(setTransactions).catch(() => {})
    getFinanceSummary().then(setSummary).catch(() => {})
  }

  useEffect(() => { reload() }, [])

  const handleCreate = async () => {
    if (!form.raw_description.trim() || !form.amount) return
    setLoading(true)
    try {
      const data = {
        raw_description: form.raw_description,
        amount: parseFloat(form.amount),
        currency: form.currency,
        transaction_date: form.transaction_date || null,
      }
      if (form.tx_type) data.tx_type = form.tx_type
      
      const tx = await createTransaction(data)
      setTransactions([tx, ...transactions])
      setForm({ raw_description: '', amount: '', currency: 'BDT', tx_type: '', transaction_date: '' })
      setShowNew(false)
      reload()
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return
    try {
      await deleteTransaction(id)
      setTransactions(transactions.filter(t => t.id !== id))
      reload()
    } catch (err) {
      alert(err.message)
    }
  }

  const startEdit = (tx) => {
    setEditingTx(tx.id)
    setEditForm({
      raw_description: tx.raw_description,
      amount: tx.amount,
      currency: tx.currency || 'BDT',
      tx_type: tx.tx_type,
      organized_category: tx.organized_category || '',
      transaction_date: tx.transaction_date || '',
    })
  }

  const saveEdit = async () => {
    try {
      const updated = await updateTransaction(editingTx, {
        ...editForm,
        amount: parseFloat(editForm.amount),
      })
      setTransactions(transactions.map(t => t.id === editingTx ? updated : t))
      setEditingTx(null)
      reload()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setAnalysis('')
    try {
      const res = await analyzeFinance()
      setAnalysis(res.analysis)
    } catch (err) {
      alert('Analysis failed: ' + err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAskAdvice = async () => {
    if (!adviceQ.trim()) return
    setAskingAdvice(true)
    setAdvice('')
    try {
      const res = await askFinanceAdvice(adviceQ)
      setAdvice(res.advice)
      setAdviceQ('')
    } catch (err) {
      alert('Advisor failed: ' + err.message)
    } finally {
      setAskingAdvice(false)
    }
  }

  const getTxLabel = (type) => TX_TYPES.find(t => t.value === type)?.label || type
  const getTxColor = (type) => TX_TYPES.find(t => t.value === type)?.color || 'text-dark-400'

  // Group summary by currency
  const currencySummary = summary?.by_currency || {}

  return (
    <div className="max-w-5xl mx-auto space-y-5 md:space-y-6">
      <div className="flex items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Finance</h1>
          <p className="text-dark-400 text-sm md:text-base mt-1">Your AI chartered accountant.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors text-sm shrink-0">
          <Plus size={18} /> <span className="hidden sm:inline">Add Transaction</span><span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Summary Cards — grouped by currency */}
      {summary && Object.keys(currencySummary).length > 0 && (
        <div className="space-y-3">
          {Object.entries(currencySummary).map(([cur, data]) => (
            <div key={cur} className="bg-dark-900 rounded-xl p-4 border border-dark-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-white">{getSymbol(cur)} {cur}</span>
                <span className="text-xs text-dark-400">({data.count} transactions)</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-dark-400 text-xs">Income</p>
                  <p className="text-lg font-bold text-green-400">{getSymbol(cur)}{data.income.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-dark-400 text-xs">Expenses</p>
                  <p className="text-lg font-bold text-red-400">{getSymbol(cur)}{data.expense.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-dark-400 text-xs">Balance</p>
                  <p className={`text-lg font-bold ${data.income - data.expense >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {getSymbol(cur)}{(data.income - data.expense).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Analysis */}
      <div className="bg-dark-900 rounded-xl p-4 md:p-6 border border-dark-700">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="text-brand-400 shrink-0" size={18} /> AI Analysis
          </h2>
          <button onClick={handleAnalyze} disabled={analyzing || transactions.length === 0}
            className="px-3 md:px-4 py-2 bg-brand-600/20 text-brand-400 hover:bg-brand-600/30 rounded-lg text-xs md:text-sm transition-colors disabled:opacity-50 shrink-0">
            {analyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {analysis ? (
          <div className="ai-content text-sm md:text-base"><ReactMarkdown>{analysis}</ReactMarkdown></div>
        ) : (
          <p className="text-dark-400 text-sm">{analyzing ? '⏳ AI is analyzing your spending... this may take a moment on free models.' : 'Add transactions and click "Analyze" to get AI insights.'}</p>
        )}
      </div>

      {/* Ask AI Advisor */}
      <div className="bg-dark-900 rounded-xl p-4 md:p-6 border border-dark-700">
        <h2 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageCircle className="text-brand-400 shrink-0" size={18} /> Financial Advisor
        </h2>
        <div className="flex gap-2 md:gap-3">
          <input value={adviceQ} onChange={e => setAdviceQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAskAdvice()}
            placeholder="Where can I cut expenses?"
            className="flex-1 min-w-0 px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none" />
          <button onClick={handleAskAdvice} disabled={askingAdvice || !adviceQ.trim()}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 shrink-0">
            {askingAdvice ? '...' : 'Ask'}
          </button>
        </div>
        {advice ? (
          <div className="mt-4 ai-content text-sm md:text-base"><ReactMarkdown>{advice}</ReactMarkdown></div>
        ) : (
          askingAdvice && <p className="mt-3 text-dark-400 text-sm">⏳ AI advisor is thinking... this may take a moment on free models.</p>
        )}
      </div>

      {/* New Transaction Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-dark-900 border border-dark-700 w-full md:max-w-lg md:rounded-2xl rounded-t-2xl p-5 md:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-semibold text-white">Add Transaction</h2>
              <button onClick={() => setShowNew(false)} className="text-dark-400 hover:text-white p-1"><X size={22} /></button>
            </div>
            <input value={form.raw_description} onChange={e => setForm({ ...form, raw_description: e.target.value })}
              placeholder="What did you spend on? (lunch, uber, salary)"
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none" />
            <div className="flex gap-3">
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="Amount" step="0.01"
                className="flex-1 min-w-0 px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none" />
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                className="px-3 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none">
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <select value={form.tx_type} onChange={e => setForm({ ...form, tx_type: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none">
              <option value="">AI decides type</option>
              {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none" />
            <p className="text-xs text-dark-500">AI will auto-categorize based on your description.</p>
            <button onClick={handleCreate} disabled={loading || !form.raw_description.trim() || !form.amount}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium">
              {loading ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-dark-900 border border-dark-700 w-full md:max-w-lg md:rounded-2xl rounded-t-2xl p-5 md:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-semibold text-white">Edit Transaction</h2>
              <button onClick={() => setEditingTx(null)} className="text-dark-400 hover:text-white p-1"><X size={22} /></button>
            </div>
            <input value={editForm.raw_description} onChange={e => setEditForm({ ...editForm, raw_description: e.target.value })}
              placeholder="Description"
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none" />
            <div className="flex gap-3">
              <input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                placeholder="Amount" step="0.01"
                className="flex-1 min-w-0 px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none" />
              <select value={editForm.currency} onChange={e => setEditForm({ ...editForm, currency: e.target.value })}
                className="px-3 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none">
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <select value={editForm.tx_type} onChange={e => setEditForm({ ...editForm, tx_type: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none">
              {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={editForm.organized_category} onChange={e => setEditForm({ ...editForm, organized_category: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={editForm.transaction_date} onChange={e => setEditForm({ ...editForm, transaction_date: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none" />
            <button onClick={saveEdit}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2">
              <Check size={16} /> Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
        <div className="p-4 border-b border-dark-700">
          <h2 className="text-base md:text-lg font-semibold text-white">Transactions</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-dark-400 text-sm">No transactions yet. Add one above.</div>
        ) : (
          <div className="divide-y divide-dark-700">
            {transactions.map(tx => (
              <div key={tx.id} className="p-3 md:p-4 hover:bg-dark-800 active:bg-dark-700 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{tx.raw_description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                      <span className="text-dark-400">{tx.transaction_date || 'No date'}</span>
                      <span className="text-dark-500">•</span>
                      <span className="text-dark-300">{getSymbol(tx.currency || 'BDT')}{tx.amount.toFixed(2)}</span>
                      {tx.organized_category && (
                        <span className="px-2 py-0.5 bg-dark-700 text-dark-300 rounded-full">{tx.organized_category}</span>
                      )}
                      <span className={`px-2 py-0.5 bg-dark-700 rounded-full ${getTxColor(tx.tx_type)}`}>
                        {getTxLabel(tx.tx_type)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(tx)} className="text-dark-500 hover:text-brand-400 transition-colors p-1.5">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(tx.id)} className="text-dark-500 hover:text-red-400 transition-colors p-1.5">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
