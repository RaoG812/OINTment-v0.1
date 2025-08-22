// @ts-nocheck
'use client'
import { useEffect, useState } from 'react'
import HexBackground from '../../components/HexBackground'

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl p-4 backdrop-blur-sm">
      {children}
    </div>
  )
}

function Bar({ value }: { value: number }) {
  return (
    <div className="w-full bg-zinc-800 rounded h-2">
      <div
        className="h-2 bg-emerald-500 rounded"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

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
        setFiles(parsed.code || [])
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
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <div className="text-sm font-semibold mb-2">AI Presence</div>
                <div className="text-2xl font-bold">
                  {Math.round((result.repo_summary?.percent_ai_repo || 0) * 100)}%
                </div>
              </Card>
              <Card>
                <div className="text-sm font-semibold mb-2">Files Scanned</div>
                <div className="text-2xl font-bold">
                  {result.repo_summary?.files_scanned || 0}
                </div>
              </Card>
              <Card>
                <div className="text-sm font-semibold mb-2">AI-Flagged Files</div>
                <div className="text-2xl font-bold">
                  {result.repo_summary?.ai_files || 0}
                </div>
              </Card>
            </div>

            {result.files?.length > 0 && (
              <div>
                <h2 className="text-lg font-medium mb-2">Flagged Files</h2>
                <div className="overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left text-zinc-400">
                      <tr>
                        <th className="p-2">Path</th>
                        <th className="p-2 w-32">Likelihood</th>
                        <th className="p-2 w-32">AI Lines</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...result.files]
                        .sort((a, b) => (b.ai_likelihood || 0) - (a.ai_likelihood || 0))
                        .slice(0, 5)
                        .map((f: any) => (
                          <tr key={f.path} className="border-t border-zinc-800">
                            <td className="p-2 truncate max-w-[200px]">{f.path}</td>
                            <td className="p-2">
                              <Bar value={(f.ai_likelihood || 0) * 100} />
                            </td>
                            <td className="p-2">
                              <Bar value={(f.percent_ai_lines || 0) * 100} />
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {result.commits?.length > 0 && (
              <div>
                <h2 className="text-lg font-medium mb-2">Flagged Commits</h2>
                <div className="overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left text-zinc-400">
                      <tr>
                        <th className="p-2">Hash</th>
                        <th className="p-2 w-32">Likelihood</th>
                        <th className="p-2 w-32">AI Lines</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...result.commits]
                        .sort((a, b) => (b.ai_likelihood || 0) - (a.ai_likelihood || 0))
                        .slice(0, 5)
                        .map((c: any) => (
                          <tr key={c.hash} className="border-t border-zinc-800">
                            <td className="p-2 truncate max-w-[200px]">{c.hash}</td>
                            <td className="p-2">
                              <Bar value={(c.ai_likelihood || 0) * 100} />
                            </td>
                            <td className="p-2">
                              <Bar value={(c.percent_ai_lines || 0) * 100} />
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <details>
              <summary className="cursor-pointer text-xs text-zinc-400">Raw Output</summary>
              <pre className="mt-2 text-xs bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl max-h-[60vh] overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}
