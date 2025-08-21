// @ts-nocheck
'use client'
import { useEffect, useState } from 'react'

type Result = { files: string[] }
type Comment = { department: string; comment: string; temperature: number }

export default function RoasterPage() {
  const [result, setResult] = useState<Result | null>(null)
  const [level, setLevel] = useState(0.5)
  const [roast, setRoast] = useState<Comment[] | null>(null)
  const [roasting, setRoasting] = useState(false)
  const [fixes, setFixes] = useState<string[] | null>(null)
  const [fixing, setFixing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('ingestResult')
    if (stored) setResult(JSON.parse(stored))
  }, [])

  async function runRoaster() {
    if (!result) return
    setRoasting(true)
    try {
      const res = await fetch('/api/roaster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: result.files, level })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'roaster failed')
      setRoast(data.comments || [])
      setError('')
    } catch (err) {
      setRoast(null)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRoasting(false)
    }
  }

  async function runFixes() {
    if (!result) return
    setFixing(true)
    try {
      const res = await fetch('/api/roaster/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: result.files })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'fix suggestions failed')
      setFixes(data.suggestions || [])
      setError('')
    } catch (err) {
      setFixes(null)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setFixing(false)
    }
  }

  useEffect(() => {
    if (result && !roast && !roasting) runRoaster()
  }, [result])

  const health = roast && roast.length
    ? 100 - Math.round((roast.reduce((s, r) => s + r.temperature, 0) / roast.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-200 p-10 space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Roaster</h1>
      <div className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-4">
            <div className="relative h-20 w-20">
              <div className="absolute inset-0 rounded-full bg-zinc-800" />
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: `conic-gradient(#10b981 ${health}%, transparent 0)` }}
              />
              <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold">{health}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Health</div>
              <div className="text-xs text-zinc-400">Overall project vitality</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Criticism Level: {Math.round(level * 100)}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(level * 100)}
              onChange={e => setLevel(parseInt(e.target.value) / 100)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={runRoaster}
              className="px-4 py-2 bg-emerald-600 text-sm font-medium rounded-lg hover:bg-emerald-500 transition"
            >
              Run Roaster
            </button>
            <button
              onClick={runFixes}
              className="px-4 py-2 bg-rose-600 text-sm font-medium rounded-lg hover:bg-rose-500 transition"
            >
              Fix
            </button>
          </div>
        </div>

        {error && <div className="text-xs text-rose-400">{error}</div>}

        {roast && (
          <ul className="space-y-4 mt-4">
            {roast.map(r => (
              <li key={r.department} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold">{r.department}</span>
                  <span className="text-xs text-zinc-400">{Math.round(r.temperature * 100)}%</span>
                </div>
                <div
                  className={`text-sm ${r.temperature > 0.66 ? 'text-rose-400' : r.temperature > 0.33 ? 'text-amber-300' : 'text-emerald-400'}`}
                >
                  {r.comment}
                </div>
                <div className="h-1 bg-zinc-800 rounded-full mt-2">
                  <div
                    className={`h-full rounded-full ${r.temperature > 0.66 ? 'bg-rose-500' : r.temperature > 0.33 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${r.temperature * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {fixes && (
          <div className="mt-6 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-sm font-semibold mb-2">Suggested Fixes</div>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {fixes.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        {(roasting || fixing) && (
          <div className="flex items-center justify-center mt-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-500" />
          </div>
        )}
      </div>
    </div>
  )
}
