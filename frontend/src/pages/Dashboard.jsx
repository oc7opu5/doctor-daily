import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Wallet, TrendingUp, TrendingDown, Sparkles, AlertTriangle } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { listDiary, getFinanceSummary, getMonthlyData, getWeeklySummary, getBudgetStatus } from '../api/service'

const COLORS = ['#818cf8', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#38bdf8', '#fb923c', '#e879f9']

export default function Dashboard() {
  const [diaryCount, setDiaryCount] = useState(0)
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [weekly, setWeekly] = useState('')
  const [weeklyLoading, setWeeklyLoading] = useState(false)
  const [budgets, setBudgets] = useState([])

  useEffect(() => {
    listDiary().then(e => setDiaryCount(e.length)).catch(() => {})
    getFinanceSummary().then(setSummary).catch(() => {})
    getMonthlyData().then(setMonthly).catch(() => {})
    getBudgetStatus().then(setBudgets).catch(() => {})
  }, [])

  const handleWeekly = async () => {
    setWeeklyLoading(true)
    try {
      const res = await getWeeklySummary()
      setWeekly(res.summary)
    } catch (err) {
      alert(err.message)
    } finally {
      setWeeklyLoading(false)
    }
  }

  const pieData = summary?.categories ? Object.entries(summary.categories).map(([name, value]) => ({ name, value })) : []
  const exceededBudgets = budgets.filter(b => b.exceeded)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-dark-400 text-sm md:text-base mt-1">Your life, organized beautifully.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-dark-900 rounded-xl p-4 md:p-5 border border-dark-700 col-span-2 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-600/20 rounded-lg shrink-0"><BookOpen className="text-brand-400" size={20} /></div>
            <div>
              <p className="text-dark-400 text-xs md:text-sm">Diary Entries</p>
              <p className="text-xl md:text-2xl font-bold text-white">{diaryCount}</p>
            </div>
          </div>
          <Link to="/diary" className="block mt-3 text-xs md:text-sm text-brand-400 hover:underline">Write new entry →</Link>
        </div>
        <div className="bg-dark-900 rounded-xl p-4 md:p-5 border border-dark-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600/20 rounded-lg shrink-0"><TrendingDown className="text-red-400" size={20} /></div>
            <div>
              <p className="text-dark-400 text-xs md:text-sm">Spent</p>
              <p className="text-xl md:text-2xl font-bold text-white">{(summary?.total_expense || 0).toFixed(0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-900 rounded-xl p-4 md:p-5 border border-dark-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600/20 rounded-lg shrink-0"><TrendingUp className="text-green-400" size={20} /></div>
            <div>
              <p className="text-dark-400 text-xs md:text-sm">Balance</p>
              <p className="text-xl md:text-2xl font-bold text-white">{(summary?.balance || 0).toFixed(0)}</p>
            </div>
          </div>
          <Link to="/finance" className="block mt-3 text-xs md:text-sm text-brand-400 hover:underline">View finance →</Link>
        </div>
      </div>

      {/* Budget Alerts */}
      {exceededBudgets.length > 0 && (
        <div className="bg-red-900/30 rounded-xl p-4 border border-red-700/50">
          <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
            <AlertTriangle size={16} /> Budget Exceeded
          </div>
          {exceededBudgets.map(b => (
            <p key={b.id} className="text-dark-300 text-sm">
              {b.category}: spent {b.spent.toFixed(0)} of {b.monthly_limit.toFixed(0)} ({b.percentage}%)
            </p>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie Chart */}
        {pieData.length > 0 && (
          <div className="bg-dark-900 rounded-xl p-4 md:p-5 border border-dark-700">
            <h3 className="text-sm font-semibold text-white mb-3">Spending by Category</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => v.toFixed(2)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bar Chart */}
        {monthly.length > 0 && (
          <div className="bg-dark-900 rounded-xl p-4 md:p-5 border border-dark-700">
            <h3 className="text-sm font-semibold text-white mb-3">Monthly Trends</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthly}>
                <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }} />
                <Bar dataKey="income" fill="#34d399" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Weekly AI Summary */}
      <div className="bg-dark-900 rounded-xl p-4 md:p-6 border border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="text-brand-400" size={18} /> Weekly Summary
          </h2>
          <button onClick={handleWeekly} disabled={weeklyLoading}
            className="px-3 py-1.5 bg-brand-600/20 text-brand-400 hover:bg-brand-600/30 rounded-lg text-xs transition-colors disabled:opacity-50">
            {weeklyLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
        {weekly ? (
          <div className="ai-content text-sm md:text-base"><div dangerouslySetInnerHTML={{ __html: weekly.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} /></div>
        ) : (
          <p className="text-dark-400 text-sm">Click "Generate" to get your AI weekly life summary.</p>
        )}
      </div>
    </div>
  )
}
