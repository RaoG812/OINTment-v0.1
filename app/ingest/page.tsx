'use client'
import { useEffect, useState } from 'react'
import type { RepoAnalysis } from '../../lib/openai'

type Result = { files: string[]; analysis: RepoAnalysis }

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl p-4 backdrop-blur-sm">
      {children}
    </div>
  )
}

export default function IngestPage() {
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [showConsole, setShowConsole] = useState(true)
  const [repo, setRepo] = useState('')
  const [branches, setBranches] = useState<string[]>([])
  const [branch, setBranch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('ingestResult')
    if (stored) setResult(JSON.parse(stored))
    const storedRepo = localStorage.getItem('repo')
    const storedBranch = localStorage.getItem('branch')
    if (storedRepo) setRepo(storedRepo)
    if (storedBranch) setBranch(storedBranch)
  }, [])

  useEffect(() => {
    if (repo) localStorage.setItem('repo', repo)
  }, [repo])
  useEffect(() => {
    if (branch) localStorage.setItem('branch', branch)
  }, [branch])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const file = (e.currentTarget.elements.namedItem('file') as HTMLInputElement).files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    setLoading(true)
    try {
      const res = await fetch('/api/ingest', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'analysis failed')
      setResult(data)
      localStorage.setItem('ingestResult', JSON.stringify(data))
      setError('')
    } catch (err) {
      console.error(err)
      setResult(null)
      localStorage.removeItem('ingestResult')
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function loadBranches() {
    if (!repo) return
    const res = await fetch(`/api/github/branches?repo=${repo}`)
    const data = await (res.ok ? res.json() : Promise.resolve([]))
    setBranches(Array.isArray(data) ? data : [])
  }

  async function analyzeRepo() {
    if (!repo || !branch) return
    const form = new FormData()
    form.append('repo', repo)
    form.append('branch', branch)
    setLoading(true)
    try {
      const res = await fetch('/api/ingest', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'analysis failed')
      setResult(data)
      localStorage.setItem('ingestResult', JSON.stringify(data))
      setError('')
    } catch (err) {
      console.error(err)
      setResult(null)
      localStorage.removeItem('ingestResult')
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-200 p-10 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Manual Ingest</h1>
      <div className="space-y-4 max-w-md">
        <div className="flex gap-2">
          <input
            value={repo}
            onChange={e => setRepo(e.target.value)}
            placeholder="owner/repo"
            className="flex-1 px-3 py-2 rounded bg-zinc-900 border border-zinc-800 text-sm"
          />
          <button
            type="button"
            onClick={loadBranches}
            className="px-3 py-2 bg-zinc-800 rounded text-xs"
          >
            Load
          </button>
        </div>
        {branches.length > 0 && (
          <select
            value={branch}
            onChange={e => setBranch(e.target.value)}
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-800 text-sm"
          >
            <option value="">select branch</option>
            {branches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={analyzeRepo}
          className="px-4 py-2 bg-emerald-600 text-sm font-medium rounded-lg hover:bg-emerald-500 transition"
        >
          Analyze Repo
        </button>
        <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="file"
          name="file"
          accept=".zip"
          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 text-sm font-medium rounded-lg hover:bg-emerald-500 transition"
        >
          Upload and Analyze
        </button>
        </form>
      </div>
      <button
        onClick={() => setShowConsole(s => !s)}
        className="text-xs text-zinc-400 hover:text-zinc-200 transition"
      >
        {showConsole ? 'Hide' : 'Show'} Console
      </button>
      {error && <div className="text-xs text-rose-400">{error}</div>}
      {showConsole && (
        <div className="relative">
          <pre className="text-xs bg-zinc-900 p-4 rounded-xl overflow-auto max-h-96 min-h-[200px]">
            {result ? JSON.stringify(result, null, 2) : ''}
          </pre>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-500" />
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="text-sm font-semibold mb-2">Takeaways</div>
            <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
              {result.analysis.takeaways.map(t => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Card>
          {(['complexity', 'documentation', 'tests'] as const).map(key => (
            <Card key={key}>
              <div className="text-sm font-semibold mb-2 capitalize">{key}</div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${result.analysis.metrics[key]}%` }}
                />
              </div>
              <div className="text-xs text-zinc-400 mt-1">{result.analysis.metrics[key]}%</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
