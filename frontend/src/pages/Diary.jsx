import { useState, useEffect } from 'react'
import { Plus, Sparkles, Trash2, X, BookOpen, Check, RotateCcw, Pencil, ArrowRightFromLine, Search, Calendar, List } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { listDiary, createDiary, deleteDiary, organizeDiary, selectDiaryVersion, updateDiary, extractDiaryTransactions, searchDiary, exportDiaryPDF } from '../api/service'

export default function Diary() {
  const [entries, setEntries] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [rawContent, setRawContent] = useState('')
  const [mood, setMood] = useState('')
  const [loading, setLoading] = useState(false)
  const [organizingId, setOrganizingId] = useState(null)
  const [viewEntry, setViewEntry] = useState(null)
  const [versions, setVersions] = useState(null)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [viewMode, setViewMode] = useState('list') // 'list' | 'calendar'
  const [calMonth, setCalMonth] = useState(new Date())

  useEffect(() => { listDiary().then(setEntries).catch(() => {}) }, [])

  const handleSearch = async (q) => {
    setSearchQ(q)
    if (q.trim()) {
      const results = await searchDiary(q).catch(() => [])
      setEntries(results)
    } else {
      listDiary().then(setEntries).catch(() => {})
    }
  }

  const handleCreate = async () => {
    if (!rawContent.trim()) return
    setLoading(true)
    try {
      const entry = await createDiary({ raw_content: rawContent, mood: mood || null })
      setEntries([entry, ...entries])
      setRawContent(''); setMood(''); setShowNew(false)
    } catch (err) { alert(err.message) } finally { setLoading(false) }
  }

  const handleOrganize = async (id) => {
    setOrganizingId(id); setVersions(null); setSelectedVersion(null)
    try {
      const updated = await organizeDiary(id)
      setEntries(entries.map(e => e.id === id ? updated : e))
      setViewEntry(updated)
      if (updated.organized_versions) setVersions(JSON.parse(updated.organized_versions))
    } catch (err) { alert(err.message) } finally { setOrganizingId(null) }
  }

  const handleSelectVersion = async (id, index) => {
    setSelectedVersion(index)
    try {
      const updated = await selectDiaryVersion(id, index)
      setEntries(entries.map(e => e.id === id ? updated : e))
      setViewEntry(updated); setVersions(null); setSelectedVersion(null)
    } catch (err) { alert(err.message) }
  }

  const handleKeepOriginal = async (id) => {
    try {
      const updated = await selectDiaryVersion(id, -1)
      setEntries(entries.map(e => e.id === id ? updated : e))
      setViewEntry(updated); setVersions(null)
    } catch (err) { alert(err.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return
    try { await deleteDiary(id); setEntries(entries.filter(e => e.id !== id)); if (viewEntry?.id === id) { setViewEntry(null); setVersions(null) } } catch (err) { alert(err.message) }
  }

  const handleExtract = async (id) => {
    setExtracting(true)
    try {
      const res = await extractDiaryTransactions(id)
      if (res.transactions_saved.length > 0) {
        alert(`✅ Extracted ${res.transactions_saved.length} transaction(s)!\n\n${res.transactions_saved.map(t => `• ${t.description}: ${t.currency} ${t.amount}`).join('\n')}`)
      } else { alert('No financial transactions found.') }
    } catch (err) { alert(err.message) } finally { setExtracting(false) }
  }

  const startEdit = (field) => { setEditing(field); setEditContent(field === 'raw' ? viewEntry.raw_content : (viewEntry.organized_content || '')) }
  const saveEdit = async () => {
    if (!editContent.trim()) return
    try {
      const data = editing === 'raw' ? { raw_content: editContent } : { organized_content: editContent }
      const updated = await updateDiary(viewEntry.id, data)
      setEntries(entries.map(e => e.id === updated.id ? updated : e)); setViewEntry(updated); setEditing(null)
    } catch (err) { alert(err.message) }
  }

  // Calendar helpers
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate()
  const firstDay = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay()
  const entryDates = new Set(entries.map(e => e.created_at.slice(0, 10)))
  const calDays = []
  for (let i = 0; i < firstDay; i++) calDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d)

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Diary</h1>
          <p className="text-dark-400 text-sm mt-1">Write your thoughts. AI makes them shine.</p>
        </div>
        <div className="flex gap-2">
          <a href={exportDiaryPDF()} target="_blank" className="p-2.5 bg-dark-800 border border-dark-600 rounded-lg text-dark-400 hover:text-white text-sm">Export</a>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm shrink-0">
            <Plus size={18} /> New
          </button>
        </div>
      </div>

      {/* Search + View Toggle */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input value={searchQ} onChange={e => handleSearch(e.target.value)} placeholder="Search diary..."
            className="w-full pl-9 pr-4 py-2.5 bg-dark-900 border border-dark-700 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none" />
        </div>
        <button onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
          className="p-2.5 bg-dark-900 border border-dark-700 rounded-lg text-dark-400 hover:text-white">
          {viewMode === 'list' ? <Calendar size={18} /> : <List size={18} />}
        </button>
      </div>

      {/* New Entry Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-dark-900 border border-dark-700 w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">New Diary Entry</h2>
              <button onClick={() => setShowNew(false)} className="text-dark-400 hover:text-white p-1"><X size={22} /></button>
            </div>
            <textarea value={rawContent} onChange={e => setRawContent(e.target.value)}
              placeholder="Write your thoughts here..."
              className="w-full h-40 px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white resize-none focus:border-brand-500 focus:outline-none text-sm" autoFocus />
            <input type="text" value={mood} onChange={e => setMood(e.target.value)} placeholder="Mood (optional)"
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm focus:border-brand-500 focus:outline-none" />
            <button onClick={handleCreate} disabled={loading || !rawContent.trim()}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>
      )}

      {/* View Entry Modal */}
      {viewEntry && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-dark-900 border border-dark-700 w-full md:max-w-3xl md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Diary Entry</h2>
                <p className="text-dark-400 text-xs">{new Date(viewEntry.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => { setViewEntry(null); setVersions(null); setEditing(null) }} className="text-dark-400 hover:text-white p-1"><X size={22} /></button>
            </div>

            {versions && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-brand-400 text-sm font-medium"><Sparkles size={16} /> Choose your favorite</div>
                {versions.map((v, i) => v && (
                  <button key={i} onClick={() => handleSelectVersion(viewEntry.id, i)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedVersion === i ? 'border-brand-500 bg-brand-600/20' : 'border-dark-600 bg-dark-800 hover:border-dark-400'}`}>
                    <span className="text-xs font-medium text-brand-400">Version {i + 1}</span>
                    <p className="text-dark-200 text-sm line-clamp-4 mt-1">{v}</p>
                  </button>
                ))}
                <button onClick={() => handleKeepOriginal(viewEntry.id)} className="w-full p-3 rounded-xl border border-dark-600 bg-dark-800 text-left text-dark-400 text-sm">Keep my original</button>
                <button onClick={() => handleOrganize(viewEntry.id)} disabled={organizingId === viewEntry.id}
                  className="w-full py-2.5 bg-brand-600/20 text-brand-400 hover:bg-brand-600/30 rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  <RotateCcw size={14} /> {organizingId === viewEntry.id ? 'Generating...' : 'Regenerate 3 versions'}
                </button>
              </div>
            )}

            {!versions && viewEntry.organized_content && (
              <div className="ai-content relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-brand-400 text-sm"><Sparkles size={16} /> AI Organized</div>
                  {editing !== 'organized' && <button onClick={() => startEdit('organized')} className="text-dark-400 hover:text-white p-1"><Pencil size={14} /></button>}
                </div>
                {editing === 'organized' ? (
                  <div className="space-y-2">
                    <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full h-64 px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-dark-100 resize-none focus:border-brand-500 focus:outline-none text-sm" />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex items-center gap-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm"><Check size={14} /> Save</button>
                      <button onClick={() => setEditing(null)} className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-300 rounded-lg text-sm">Cancel</button>
                    </div>
                  </div>
                ) : <div className="diary-content text-dark-100 text-sm"><ReactMarkdown>{viewEntry.organized_content}</ReactMarkdown></div>}
              </div>
            )}

            <div className="bg-dark-800 rounded-xl p-4 border border-dark-600 relative">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-dark-400">Your raw writing</p>
                {editing !== 'raw' && <button onClick={() => startEdit('raw')} className="text-dark-400 hover:text-white p-1"><Pencil size={14} /></button>}
              </div>
              {editing === 'raw' ? (
                <div className="space-y-2">
                  <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full h-48 px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-dark-100 resize-none focus:border-brand-500 focus:outline-none text-sm" />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex items-center gap-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm"><Check size={14} /> Save</button>
                    <button onClick={() => setEditing(null)} className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-300 rounded-lg text-sm">Cancel</button>
                  </div>
                </div>
              ) : <p className="text-dark-200 whitespace-pre-wrap text-sm">{viewEntry.raw_content}</p>}
            </div>

            {!versions && (
              <div className="flex flex-wrap gap-2 pb-4">
                <button onClick={() => handleOrganize(viewEntry.id)} disabled={organizingId === viewEntry.id}
                  className="flex items-center gap-2 px-4 py-2.5 bg-brand-600/20 text-brand-400 hover:bg-brand-600/30 rounded-lg text-sm disabled:opacity-50">
                  <Sparkles size={16} /> {organizingId === viewEntry.id ? 'Generating...' : viewEntry.organized_content ? 'Re-generate' : 'AI Organize'}
                </button>
                <button onClick={() => handleExtract(viewEntry.id)} disabled={extracting}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg text-sm disabled:opacity-50">
                  <ArrowRightFromLine size={16} /> {extracting ? 'Extracting...' : 'Extract to Finance'}
                </button>
                <button onClick={() => handleDelete(viewEntry.id)} className="flex items-center gap-2 px-4 py-2.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg text-sm">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <div className="bg-dark-900 rounded-xl p-4 border border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))} className="text-dark-400 hover:text-white px-2">←</button>
            <span className="text-white font-medium">{calMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))} className="text-dark-400 hover:text-white px-2">→</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="text-dark-500 text-xs py-1">{d}</div>)}
            {calDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />
              const dateStr = `${calMonth.getFullYear()}-${String(calMonth.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const hasEntry = entryDates.has(dateStr)
              return (
                <div key={day} className={`p-2 rounded-lg text-sm ${hasEntry ? 'bg-brand-600/30 text-brand-400 font-medium cursor-pointer hover:bg-brand-600/50' : 'text-dark-400'}`}>
                  {day}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {entries.length === 0 ? (
            <div className="text-center py-16 text-dark-400">
              <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
              <p>{searchQ ? 'No entries match your search.' : 'No diary entries yet.'}</p>
            </div>
          ) : entries.map(entry => (
            <div key={entry.id} onClick={() => { setViewEntry(entry); setVersions(null) }}
              className="bg-dark-900 rounded-xl p-4 border border-dark-700 hover:border-dark-500 active:border-dark-400 cursor-pointer transition-colors">
              <p className="text-dark-100 line-clamp-3 text-sm">{entry.raw_content}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-dark-400">
                <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                {entry.mood && <span className="px-2 py-0.5 bg-dark-800 rounded-full">{entry.mood}</span>}
                {entry.organized_content && <span className="px-2 py-0.5 bg-brand-600/20 text-brand-400 rounded-full flex items-center gap-1"><Sparkles size={10} /> AI organized</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
