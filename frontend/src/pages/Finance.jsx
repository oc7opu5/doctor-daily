import { useState, useEffect } from 'react'
import { Plus, Sparkles, Trash2, MessageCircle, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { listTransactions, createTransaction, deleteTransaction, getFinanceSummary, analyzeFinance, askFinanceAdvice } from '../api/service'

export default function Finance() {
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ raw_description: '', amount: '', tx_type: 'expense', transaction_date: '' })
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [adviceQ, setAdviceQ] = useState('')
  const [advice, setAdvice] = useState('')
  const [askingAdvice, setAskingAdvice] = useState(false)

  const reload = () => {
    listTransactions().then(setTransactions).catch(() => {})
    getFinanceSummary().then(setSummary).catch(() => {})
  }

  useEffect(() => { reload() }, [])

  const handleCreate = async () => {
    if (!form.raw_description.trim() || !form.amount) return
    setLoading(true)
    try {
      const tx = await createTransaction({
        raw_description: form.raw_description,
        amount: parseFloat(form.amount),
        tx_type: form.tx_type,
        transaction_date: form.transaction_date || null,
      })
      setTransactions([tx, ...transactions])
      setForm({ raw_description: '', amount: '', tx_type: 'expense', transaction_date: '' })
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

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      const res = await analyzeFinance()
      setAnalysis(res.analysis)
    } catch (err) {
      alert(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAskAdvice = async () => {
    if (!adviceQ.trim()) return
    setAskingAdvice(true)
    try {
      const res = await askFinanceAdvice(adviceQ)
      setAdvice(res.advice)
      setAdviceQ('')
    } catch (err) {
      alert(err.message)
    } finally {
      setAskingAdvice(false)
    }
  }

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

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-dark-900 rounded-xl p-3 md:p-4 border border-dark-700">
            <p className="text-dark-400 text-xs md:text-sm">Income</p>
            <p className="text-lg md:text-xl font-bold text-green-400">${summary.total_income.toFixed(2)}</p>
          </div>
          <div className="bg-dark-900 rounded-xl p-3 md:p-4 border border-dark-700">
            <p className="text-dark-400 text-xs md:text-sm">Expenses</p>
            <p className="text-lg md:text-xl font-bold text-red-400">${summary.total_expense.toFixed(2)}</p>
          </div>
          <div className="bg-dark-900 rounded-xl p-3 md:p-4 border border-dark-700">
            <p className="text-dark-400 text-xs md:text-sm">Balance</p>
            <p className={`text-lg md:text-xl font-bold ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>${summary.balance.toFixed(2)}</p>
          </div>
          <div className="bg-dark-900 rounded-xl p-3 md:p-4 border border-dark-700">
            <p className="text-dark-400 text-xs md:text-sm">Transactions</p>
            <p className="text-lg md:text-xl font-bold text-white">{summary.transaction_count}</p>
          </div>
        </div>
      )}

      {/* AI Analysis */}
      <div className="bg-dark-900 rounded-xl p-4 md:p-6 border border-dark-700">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="text-brand-400 shrink-0" size={18} /> <span className="hidden sm:inline">AI Financial Analysis</span><span className="sm:hidden">AI Analysis</span>
          </h2>
          <button onClick={handleAnalyze} disabled={analyzing || transactions.length === 0}
            className="px-3 md:px-4 py-2 bg-brand-600/20 text-brand-400 hover:bg-brand-600/30 rounded-lg text-xs md:text-sm transition-colors disabled:opacity-50 shrink-0">
            {analyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {analysis ? (
          <div className="ai-content text-sm md:text-base"><ReactMarkdown>{analysis}</ReactMarkdown></div>
        ) : (
          <p className="text-dark-400 text-sm">Add transactions and click "Analyze" to get AI insights.</p>
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
        {advice && <div className="mt-4 ai-content text-sm md:text-base"><ReactMarkdown>{advice}</ReactMarkdown></div>}
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
              <select value={form.tx_type} onChange={e => setForm({ ...form, tx_type: e.target.value })}
                className="px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <input type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none" />
            <button onClick={handleCreate} disabled={loading || !form.raw_description.trim() || !form.amount}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium">
              {loading ? 'Saving...' : 'Save Transaction'}
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
              <div key={tx.id} className="flex items-center justify-between p-3 md:p-4 hover:bg-dark-800 active:bg-dark-700 transition-colors gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{tx.raw_description}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-dark-400">
                    <span>{tx.transaction_date || 'No date'}</span>
                    {tx.organized_category && (
                      <span className="px-2 py-0.5 bg-dark-700 rounded-full">{tx.organized_category}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                  <span className={`font-semibold text-sm ${tx.tx_type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.tx_type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </span>
                  <button onClick={() => handleDelete(tx.id)} className="text-dark-500 hover:text-red-400 transition-colors p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
