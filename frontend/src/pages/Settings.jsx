import { useState, useEffect } from 'react'
import { Save, Check } from 'lucide-react'
import { getSettings, updateSettings, listProviders } from '../api/service'

export default function Settings() {
  const [providers, setProviders] = useState({})
  const [selected, setSelected] = useState('opencode')
  const [apiKey, setApiKey] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listProviders().then(setProviders).catch(() => {})
    getSettings().then(s => {
      setSelected(s.ai_provider)
      setHasKey(s.api_key_set)
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      const data = { ai_provider: selected }
      if (apiKey) data.api_key = apiKey
      await updateSettings(data)
      setHasKey(!!apiKey || hasKey)
      setApiKey('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-dark-400 mt-1">Configure your AI provider.</p>
      </div>

      <div className="bg-dark-900 rounded-xl p-6 border border-dark-700 space-y-6">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-3">AI Provider</label>
          <div className="space-y-2">
            {Object.entries(providers).map(([key, info]) => (
              <label
                key={key}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selected === key
                    ? 'border-brand-500 bg-brand-600/10'
                    : 'border-dark-600 bg-dark-800 hover:border-dark-500'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value={key}
                  checked={selected === key}
                  onChange={() => setSelected(key)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selected === key ? 'border-brand-500' : 'border-dark-500'
                }`}>
                  {selected === key && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{info.name}</p>
                  {info.requires_key && <p className="text-dark-400 text-xs">Requires API key</p>}
                  {!info.requires_key && <p className="text-green-400 text-xs">Free — no key needed</p>}
                </div>
                {key === 'opencode' && <span className="text-xs text-brand-400 bg-brand-600/20 px-2 py-1 rounded-full">Recommended</span>}
              </label>
            ))}
          </div>
        </div>

        {providers[selected]?.requires_key && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">
              API Key {hasKey && <span className="text-green-400 text-xs">(key saved)</span>}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={hasKey ? "Enter new key to replace..." : "Paste your API key..."}
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {saved ? <><Check size={16} /> Saved!</> : loading ? 'Saving...' : <><Save size={16} /> Save Settings</>}
        </button>
      </div>

      <div className="bg-dark-900 rounded-xl p-6 border border-dark-700">
        <h2 className="text-lg font-semibold text-white mb-3">About Doctor Daily</h2>
        <p className="text-dark-300 text-sm leading-relaxed">
          Doctor Daily is your personal AI-powered diary and financial advisor. 
          Write your thoughts freely — AI will organize them into beautiful prose. 
          Track your spending — your AI accountant will help you save money.
        </p>
        <p className="text-dark-500 text-xs mt-4">Version 1.0.0 • Your data stays private • Multi-user support</p>
      </div>
    </div>
  )
}
