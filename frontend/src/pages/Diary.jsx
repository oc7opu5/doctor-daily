import { useState, useEffect } from 'react'
import { Plus, Sparkles, Trash2, X, BookOpen } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { listDiary, createDiary, deleteDiary, organizeDiary } from '../api/service'

export default function Diary() {
  const [entries, setEntries] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [rawContent, setRawContent] = useState('')
  const [mood, setMood] = useState('')
  const [loading, setLoading] = useState(false)
  const [organizingId, setOrganizingId] = useState(null)
  const [viewEntry, setViewEntry] = useState(null)

  useEffect(() => { listDiary().then(setEntries).catch(() => {}) }, [])

  const handleCreate = async () => {
    if (!rawContent.trim()) return
    setLoading(true)
    try {
      const entry = await createDiary({ raw_content: rawContent, mood: mood || null })
      setEntries([entry, ...entries])
      setRawContent('')
      setMood('')
      setShowNew(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOrganize = async (id) => {
    setOrganizingId(id)
    try {
      const updated = await organizeDiary(id)
      setEntries(entries.map(e => e.id === id ? updated : e))
      if (viewEntry?.id === id) setViewEntry(updated)
    } catch (err) {
      alert(err.message)
    } finally {
      setOrganizingId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return
    try {
      await deleteDiary(id)
      setEntries(entries.filter(e => e.id !== id))
      if (viewEntry?.id === id) setViewEntry(null)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Diary</h1>
          <p className="text-dark-400 text-sm md:text-base mt-1">Write your thoughts. AI makes them shine.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors text-sm shrink-0"
        >
          <Plus size={18} /> <span className="hidden sm:inline">New Entry</span><span className="sm:hidden">New</span>
        </button>
      </div>

      {/* New Entry Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-dark-900 border border-dark-700 w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl p-5 md:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-semibold text-white">New Diary Entry</h2>
              <button onClick={() => setShowNew(false)} className="text-dark-400 hover:text-white p-1"><X size={22} /></button>
            </div>
            <textarea
              value={rawContent}
              onChange={e => setRawContent(e.target.value)}
              placeholder="Write your thoughts here... Don't worry about being perfect. Just let it flow."
              className="w-full h-40 md:h-48 px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white resize-none focus:border-brand-500 focus:outline-none text-sm md:text-base"
              autoFocus
            />
            <input
              type="text"
              value={mood}
              onChange={e => setMood(e.target.value)}
              placeholder="Mood (optional): happy, tired, excited..."
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none"
            />
            <button
              onClick={handleCreate}
              disabled={loading || !rawContent.trim()}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>
      )}

      {/* View Entry Modal */}
      {viewEntry && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-dark-900 border border-dark-700 w-full md:max-w-3xl md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-white">Diary Entry</h2>
                <p className="text-dark-400 text-xs md:text-sm">{new Date(viewEntry.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setViewEntry(null)} className="text-dark-400 hover:text-white p-1"><X size={22} /></button>
            </div>

            {viewEntry.organized_content && (
              <div className="ai-content">
                <div className="flex items-center gap-2 text-brand-400 text-sm mb-3">
                  <Sparkles size={16} /> AI Organized Version
                </div>
                <div className="diary-content text-dark-100 text-sm md:text-base">
                  <ReactMarkdown>{viewEntry.organized_content}</ReactMarkdown>
                </div>
              </div>
            )}

            <div className="bg-dark-800 rounded-xl p-4 border border-dark-600">
              <p className="text-xs text-dark-400 mb-2">Your raw writing</p>
              <p className="text-dark-200 whitespace-pre-wrap text-sm md:text-base">{viewEntry.raw_content}</p>
            </div>

            <div className="flex gap-2 pb-4 md:pb-0">
              <button
                onClick={() => handleOrganize(viewEntry.id)}
                disabled={organizingId === viewEntry.id}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-600/20 text-brand-400 hover:bg-brand-600/30 rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                <Sparkles size={16} />
                {organizingId === viewEntry.id ? 'Organizing...' : viewEntry.organized_content ? 'Re-organize' : 'AI Organize'}
              </button>
              <button
                onClick={() => handleDelete(viewEntry.id)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors text-sm"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="text-center py-16 text-dark-400">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p>No diary entries yet.</p>
            <p className="text-sm mt-1">Tap "New" to start writing.</p>
          </div>
        ) : (
          entries.map(entry => (
            <div
              key={entry.id}
              onClick={() => setViewEntry(entry)}
              className="bg-dark-900 rounded-xl p-4 md:p-5 border border-dark-700 hover:border-dark-500 active:border-dark-400 cursor-pointer transition-colors"
            >
              <p className="text-dark-100 line-clamp-3 text-sm md:text-base">{entry.raw_content}</p>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-3 text-xs text-dark-400">
                <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                {entry.mood && <span className="px-2 py-0.5 bg-dark-800 rounded-full">{entry.mood}</span>}
                {entry.organized_content && (
                  <span className="px-2 py-0.5 bg-brand-600/20 text-brand-400 rounded-full flex items-center gap-1">
                    <Sparkles size={10} /> AI organized
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
