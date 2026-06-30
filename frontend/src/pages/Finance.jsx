import { useState, useEffect } from 'react'
import { Plus, Sparkles, Trash2, MessageCircle, X, Pencil, Check, Search, Download } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { listTransactions, createTransaction, updateTransaction, deleteTransaction, getFinanceSummary, analyzeFinance, askFinanceAdvice, searchFinance, getMonthlyData, listBudgets, createBudget, deleteBudget, getBudgetStatus, exportFinanceCSV } from '../api/service'

const CATEGORIES = ['Food & Dining','Transportation','Bills & Utilities','Entertainment','Shopping','Health & Medical','Education','Salary & Wages','Freelance & Side Income','Investment','Loan Given','Loan Received','Savings','Transfer','Gift','Other']
const TX_TYPES = [{value:'expense',label:'Expense',color:'text-red-400'},{value:'income',label:'Income',color:'text-green-400'},{value:'loan_given',label:'Loan Given',color:'text-orange-400'},{value:'loan_received',label:'Loan Received',color:'text-blue-400'},{value:'savings',label:'Savings',color:'text-purple-400'},{value:'transfer',label:'Transfer',color:'text-cyan-400'}]
const CURRENCIES = [{value:'BDT',label:'৳ BDT',symbol:'৳'},{value:'USD',label:'$ USD',symbol:'$'},{value:'CAD',label:'C$ CAD',symbol:'C$'}]
const COLORS = ['#818cf8','#f87171','#34d399','#fbbf24','#a78bfa','#38bdf8','#fb923c','#e879f9']
const getSymbol = (c) => CURRENCIES.find(x => x.value === c)?.symbol || c + ' '

export default function Finance() {
  const [txs, setTxs] = useState([])
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ raw_description:'', amount:'', currency:'BDT', tx_type:'', transaction_date:'' })
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [adviceQ, setAdviceQ] = useState('')
  const [advice, setAdvice] = useState('')
  const [askingAdvice, setAskingAdvice] = useState(false)
  const [editingTx, setEditingTx] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [searchQ, setSearchQ] = useState('')
  const [budgets, setBudgets] = useState([])
  const [budgetStatus, setBudgetStatus] = useState([])
  const [showBudget, setShowBudget] = useState(false)
  const [budgetForm, setBudgetForm] = useState({ category:'Food & Dining', monthly_limit:'', currency:'BDT' })

  const reload = () => {
    listTransactions().then(setTxs).catch(() => {})
    getFinanceSummary().then(setSummary).catch(() => {})
    getMonthlyData().then(setMonthly).catch(() => {})
    listBudgets().then(setBudgets).catch(() => {})
    getBudgetStatus().then(setBudgetStatus).catch(() => {})
  }
  useEffect(() => { reload() }, [])

  const handleSearch = async (q) => {
    setSearchQ(q)
    if (q.trim()) { const r = await searchFinance(q).catch(() => []); setTxs(r) }
    else { listTransactions().then(setTxs).catch(() => {}) }
  }

  const handleCreate = async () => {
    if (!form.raw_description.trim() || !form.amount) return
    setLoading(true)
    try {
      const data = { raw_description: form.raw_description, amount: parseFloat(form.amount), currency: form.currency, transaction_date: form.transaction_date || null }
      if (form.tx_type) data.tx_type = form.tx_type
      const tx = await createTransaction(data)
      setTxs([tx, ...txs]); setForm({ raw_description:'', amount:'', currency:'BDT', tx_type:'', transaction_date:'' }); setShowNew(false); reload()
    } catch (err) { alert(err.message) } finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return
    try { await deleteTransaction(id); setTxs(txs.filter(t => t.id !== id)); reload() } catch (err) { alert(err.message) }
  }

  const startEdit = (tx) => { setEditingTx(tx.id); setEditForm({ raw_description:tx.raw_description, amount:tx.amount, currency:tx.currency||'BDT', tx_type:tx.tx_type, organized_category:tx.organized_category||'', transaction_date:tx.transaction_date||'' }) }
  const saveEdit = async () => {
    try { const u = await updateTransaction(editingTx, { ...editForm, amount:parseFloat(editForm.amount) }); setTxs(txs.map(t => t.id === editingTx ? u : t)); setEditingTx(null); reload() } catch (err) { alert(err.message) }
  }

  const handleAnalyze = async () => { setAnalyzing(true); setAnalysis(''); try { const r = await analyzeFinance(); setAnalysis(r.analysis) } catch (e) { alert('Failed: '+e.message) } finally { setAnalyzing(false) } }
  const handleAskAdvice = async () => {
    if (!adviceQ.trim()) return; setAskingAdvice(true); setAdvice('')
    try { const r = await askFinanceAdvice(adviceQ); setAdvice(r.advice); setAdviceQ('') } catch (e) { alert('Failed: '+e.message) } finally { setAskingAdvice(false) }
  }

  const handleAddBudget = async () => {
    if (!budgetForm.monthly_limit) return
    try { await createBudget({ ...budgetForm, monthly_limit:parseFloat(budgetForm.monthly_limit) }); setShowBudget(false); setBudgetForm({ category:'Food & Dining', monthly_limit:'', currency:'BDT' }); reload() } catch (e) { alert(e.message) }
  }
  const handleDeleteBudget = async (id) => { if (!confirm('Delete budget?')) return; try { await deleteBudget(id); reload() } catch (e) { alert(e.message) } }

  const getTxLabel = (t) => TX_TYPES.find(x => x.value === t)?.label || t
  const getTxColor = (t) => TX_TYPES.find(x => x.value === t)?.color || 'text-dark-400'
  const pieData = summary?.categories ? Object.entries(summary.categories).map(([name,value]) => ({name,value})) : []
  const curSummary = summary?.by_currency || {}

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start md:items-center justify-between gap-3">
        <div><h1 className="text-2xl md:text-3xl font-bold text-white">Finance</h1><p className="text-dark-400 text-sm mt-1">Your AI chartered accountant.</p></div>
        <div className="flex gap-2">
          <a href={exportFinanceCSV()} className="p-2.5 bg-dark-800 border border-dark-600 rounded-lg text-dark-400 hover:text-white text-sm"><Download size={16} /></a>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm shrink-0"><Plus size={18} /> Add</button>
        </div>
      </div>

      {/* Search */}
      <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
        <input value={searchQ} onChange={e => handleSearch(e.target.value)} placeholder="Search transactions..."
          className="w-full pl-9 pr-4 py-2.5 bg-dark-900 border border-dark-700 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none" />
      </div>

      {/* Summary by currency */}
      {summary && Object.keys(curSummary).length > 0 && (
        <div className="space-y-3">
          {Object.entries(curSummary).map(([cur, data]) => (
            <div key={cur} className="bg-dark-900 rounded-xl p-4 border border-dark-700">
              <p className="text-sm font-semibold text-white mb-2">{getSymbol(cur)} {cur} ({data.count} txns)</p>
              <div className="grid grid-cols-3 gap-3">
                <div><p className="text-dark-400 text-xs">Income</p><p className="text-lg font-bold text-green-400">{getSymbol(cur)}{data.income.toFixed(0)}</p></div>
                <div><p className="text-dark-400 text-xs">Expenses</p><p className="text-lg font-bold text-red-400">{getSymbol(cur)}{data.expense.toFixed(0)}</p></div>
                <div><p className="text-dark-400 text-xs">Balance</p><p className={`text-lg font-bold ${data.income-data.expense>=0?'text-green-400':'text-red-400'}`}>{getSymbol(cur)}{(data.income-data.expense).toFixed(0)}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pieData.length > 0 && (
          <div className="bg-dark-900 rounded-xl p-4 border border-dark-700">
            <h3 className="text-sm font-semibold text-white mb-3">By Category</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                {pieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie><Tooltip formatter={v=>v.toFixed(2)} /></PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {monthly.length > 0 && (
          <div className="bg-dark-900 rounded-xl p-4 border border-dark-700">
            <h3 className="text-sm font-semibold text-white mb-3">Monthly Trends</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthly}><XAxis dataKey="month" tick={{fill:'#888',fontSize:11}} /><YAxis tick={{fill:'#888',fontSize:11}} /><Tooltip contentStyle={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8}} />
                <Bar dataKey="income" fill="#34d399" radius={[4,4,0,0]} /><Bar dataKey="expense" fill="#f87171" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* AI Analysis */}
      <div className="bg-dark-900 rounded-xl p-4 border border-dark-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Sparkles className="text-brand-400" size={16} /> AI Analysis</h2>
          <button onClick={handleAnalyze} disabled={analyzing||txs.length===0} className="px-3 py-1.5 bg-brand-600/20 text-brand-400 hover:bg-brand-600/30 rounded-lg text-xs disabled:opacity-50">{analyzing?'Analyzing...':'Analyze'}</button>
        </div>
        {analysis ? <div className="ai-content text-sm"><ReactMarkdown>{analysis}</ReactMarkdown></div> : <p className="text-dark-400 text-xs">{analyzing?'⏳ Thinking...':'Click Analyze for AI insights.'}</p>}
      </div>

      {/* Advisor */}
      <div className="bg-dark-900 rounded-xl p-4 border border-dark-700">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><MessageCircle className="text-brand-400" size={16} /> Financial Advisor</h2>
        <div className="flex gap-2">
          <input value={adviceQ} onChange={e=>setAdviceQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAskAdvice()} placeholder="Ask anything..."
            className="flex-1 min-w-0 px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none" />
          <button onClick={handleAskAdvice} disabled={askingAdvice||!adviceQ.trim()} className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm disabled:opacity-50 shrink-0">{askingAdvice?'...':'Ask'}</button>
        </div>
        {advice && <div className="mt-3 ai-content text-sm"><ReactMarkdown>{advice}</ReactMarkdown></div>}
      </div>

      {/* Budgets */}
      <div className="bg-dark-900 rounded-xl p-4 border border-dark-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Budgets</h2>
          <button onClick={()=>setShowBudget(!showBudget)} className="text-brand-400 text-xs hover:underline">{showBudget?'Cancel':'+ Add Budget'}</button>
        </div>
        {showBudget && (
          <div className="flex gap-2 mb-3">
            <select value={budgetForm.category} onChange={e=>setBudgetForm({...budgetForm,category:e.target.value})} className="px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white text-xs">
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" value={budgetForm.monthly_limit} onChange={e=>setBudgetForm({...budgetForm,monthly_limit:e.target.value})} placeholder="Limit" className="w-24 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white text-xs" />
            <select value={budgetForm.currency} onChange={e=>setBudgetForm({...budgetForm,currency:e.target.value})} className="px-2 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white text-xs">
              {CURRENCIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <button onClick={handleAddBudget} className="px-3 py-2 bg-brand-600 text-white rounded-lg text-xs">Save</button>
          </div>
        )}
        {budgetStatus.length === 0 ? <p className="text-dark-400 text-xs">No budgets set.</p> : (
          <div className="space-y-2">
            {budgetStatus.map(b => (
              <div key={b.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-dark-300">{b.category}</span>
                    <span className={b.exceeded?'text-red-400':'text-dark-400'}>{b.spent.toFixed(0)} / {b.monthly_limit.toFixed(0)}</span>
                  </div>
                  <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${b.percentage>100?'bg-red-500':b.percentage>80?'bg-yellow-500':'bg-brand-500'}`} style={{width:`${Math.min(b.percentage,100)}%`}} />
                  </div>
                </div>
                <button onClick={()=>handleDeleteBudget(b.id)} className="text-dark-500 hover:text-red-400 p-1"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Transaction Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-dark-900 border border-dark-700 w-full md:max-w-lg md:rounded-2xl rounded-t-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Add Transaction</h2><button onClick={()=>setShowNew(false)} className="text-dark-400 hover:text-white p-1"><X size={22} /></button></div>
            <input value={form.raw_description} onChange={e=>setForm({...form,raw_description:e.target.value})} placeholder="What was it?" className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none" />
            <div className="flex gap-2">
              <input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="Amount" step="0.01" className="flex-1 min-w-0 px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none" />
              <select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})} className="px-3 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm">{CURRENCIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select>
            </div>
            <select value={form.tx_type} onChange={e=>setForm({...form,tx_type:e.target.value})} className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm">
              <option value="">AI decides type</option>{TX_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input type="date" value={form.transaction_date} onChange={e=>setForm({...form,transaction_date:e.target.value})} className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm" />
            <button onClick={handleCreate} disabled={loading||!form.raw_description.trim()||!form.amount} className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium disabled:opacity-50">{loading?'Saving...':'Save'}</button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTx && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-dark-900 border border-dark-700 w-full md:max-w-lg md:rounded-2xl rounded-t-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Edit</h2><button onClick={()=>setEditingTx(null)} className="text-dark-400 hover:text-white p-1"><X size={22} /></button></div>
            <input value={editForm.raw_description} onChange={e=>setEditForm({...editForm,raw_description:e.target.value})} className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm" />
            <div className="flex gap-2">
              <input type="number" value={editForm.amount} onChange={e=>setEditForm({...editForm,amount:e.target.value})} className="flex-1 min-w-0 px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm" />
              <select value={editForm.currency} onChange={e=>setEditForm({...editForm,currency:e.target.value})} className="px-3 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm">{CURRENCIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select>
            </div>
            <select value={editForm.tx_type} onChange={e=>setEditForm({...editForm,tx_type:e.target.value})} className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm">{TX_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select>
            <select value={editForm.organized_category} onChange={e=>setEditForm({...editForm,organized_category:e.target.value})} className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm"><option value="">Category</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
            <input type="date" value={editForm.transaction_date} onChange={e=>setEditForm({...editForm,transaction_date:e.target.value})} className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm" />
            <button onClick={saveEdit} className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"><Check size={16} /> Save</button>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
        <div className="p-4 border-b border-dark-700"><h2 className="text-sm font-semibold text-white">Transactions</h2></div>
        {txs.length===0 ? <div className="p-8 text-center text-dark-400 text-sm">{searchQ?'No results.':'No transactions yet.'}</div> : (
          <div className="divide-y divide-dark-700">
            {txs.map(tx => (
              <div key={tx.id} className="p-3 hover:bg-dark-800 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{tx.raw_description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                      <span className="text-dark-400">{tx.transaction_date||'No date'}</span>
                      <span className="text-dark-300">{getSymbol(tx.currency||'BDT')}{tx.amount.toFixed(2)}</span>
                      {tx.organized_category && <span className="px-2 py-0.5 bg-dark-700 text-dark-300 rounded-full">{tx.organized_category}</span>}
                      <span className={`px-2 py-0.5 bg-dark-700 rounded-full ${getTxColor(tx.tx_type)}`}>{getTxLabel(tx.tx_type)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={()=>startEdit(tx)} className="text-dark-500 hover:text-brand-400 p-1.5"><Pencil size={14} /></button>
                    <button onClick={()=>handleDelete(tx.id)} className="text-dark-500 hover:text-red-400 p-1.5"><Trash2 size={14} /></button>
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
