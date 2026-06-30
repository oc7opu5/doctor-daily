import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { listDiary, getFinanceSummary } from '../api/service'

export default function Dashboard() {
  const [diaryCount, setDiaryCount] = useState(0)
  const [summary, setSummary] = useState(null)
  const [recentDiary, setRecentDiary] = useState([])

  useEffect(() => {
    listDiary().then(entries => {
      setDiaryCount(entries.length)
      setRecentDiary(entries.slice(0, 3))
    }).catch(() => {})
    getFinanceSummary().then(setSummary).catch(() => {})
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-dark-400 text-sm md:text-base mt-1">Your life, organized beautifully.</p>
      </div>

      {/* Stats Cards */}
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
              <p className="text-xl md:text-2xl font-bold text-white">${(summary?.total_expense || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-900 rounded-xl p-4 md:p-5 border border-dark-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600/20 rounded-lg shrink-0"><TrendingUp className="text-green-400" size={20} /></div>
            <div>
              <p className="text-dark-400 text-xs md:text-sm">Balance</p>
              <p className="text-xl md:text-2xl font-bold text-white">${(summary?.balance || 0).toFixed(2)}</p>
            </div>
          </div>
          <Link to="/finance" className="block mt-3 text-xs md:text-sm text-brand-400 hover:underline">View finance →</Link>
        </div>
      </div>

      {/* Recent Diary Entries */}
      <div className="bg-dark-900 rounded-xl p-4 md:p-6 border border-dark-700">
        <h2 className="text-base md:text-lg font-semibold text-white mb-4">Recent Diary Entries</h2>
        {recentDiary.length === 0 ? (
          <p className="text-dark-400 text-sm">No entries yet. Start writing!</p>
        ) : (
          <div className="space-y-3">
            {recentDiary.map(entry => (
              <div key={entry.id} className="bg-dark-800 rounded-lg p-3 md:p-4 border border-dark-600">
                <p className="text-dark-200 text-sm line-clamp-2">{entry.raw_content}</p>
                <p className="text-dark-500 text-xs mt-2">
                  {new Date(entry.created_at).toLocaleDateString()}
                  {entry.mood && ` • ${entry.mood}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
