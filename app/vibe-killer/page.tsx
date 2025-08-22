// @ts-nocheck
'use client'
import { useEffect, useState } from 'react'
import HexBackground from '../../components/HexBackground'

export default function VibeKillerPage() {
  const [files, setFiles] = useState<any[]>([])
  const [commits, setCommits] = useState<any[]>([])
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [repo, setRepo] = useState('')
  const [branch, setBranch] = useState('main')

  useEffect(() => {
    const stored = localStorage.getItem('ingestResult')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setFiles(parsed.files || [])
      } catch {}
    }
    const r = localStorage.getItem('repo') || ''
    const b = localStorage.getItem('branch') || 'main'
    setRepo(r)
    setBranch(b)
  }, [])

  useEffect(() => {
    if (!repo) return
    fetch(`/api/github/commits?repo=${repo}&branch=${branch}`)
      .then(r => r.json())
      .then(d => setCommits(Array.isArray(d) ? d : []))
      .catch(() => setCommits([]))
  }, [repo, branch])

  async function runScan() {
    setLoading(true)
    try {
      const res = await fetch('/api/vibe-killer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, commits })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'scan failed')
      setResult(data)
      setError('')
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative overflow-hidden min-h-screen">
      <HexBackground />
      <div className="relative z-10 p-10 space-y-6">
        <h1 className="text-2xl font-semibold">Vibe Killer</h1>
        <button
          onClick={runScan}
          disabled={loading || files.length === 0}
          className="px-4 py-2 bg-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? 'Scanning...' : 'Scan Repo'}
        </button>
        {error && <div className="text-xs text-rose-400">{error}</div>}
        {result && (
          <pre className="text-xs bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl max-h-[60vh] overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}
