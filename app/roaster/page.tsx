// @ts-nocheck
'use client'
import { useEffect, useState } from 'react'
import { Flame, RefreshCw, AlertTriangle } from 'lucide-react'

type Analysis = {
  overview: string
  takeaways: string[]
  metrics: { complexity: number; documentation: number; tests: number }
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl p-4 backdrop-blur-sm">
      {children}
    </div>
  )
}

function Gauge({ value }: { value: number }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const color = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <svg viewBox="0 0 120 60" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <path d="M10 50 A 50 50 0 0 1 110 50" stroke="#27272a" strokeWidth={8} fill="none" />
      <path
        d="M10 50 A 50 50 0 0 1 110 50"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        fill="none"
      />
      <text x="60" y="45" textAnchor="middle" fontSize="12" fill="#a1a1aa">
        {value}%
      </text>
    </svg>
  )
}

export default function RoasterPage() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [repo, setRepo] = useState('')
  const [branch, setBranch] = useState('')
  const [loading, setLoading] = useState(false)
  const [temp, setTemp] = useState(1)

  useEffect(() => {
    const stored = localStorage.getItem('ingestResult')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.analysis) setAnalysis(parsed.analysis)
      } catch {}
    }
    const r = localStorage.getItem('repo')
    const b = localStorage.getItem('branch')
    if (r) setRepo(r)
    if (b) setBranch(b)
  }, [])

  const health = analysis
    ? Math.round(
        (analysis.metrics.documentation + analysis.metrics.tests + (100 - analysis.metrics.complexity)) /
          3
      )
    : 0

  const prefix = ['FYI:', 'Heads up:', 'Brace yourselves:'][temp]

  const takeaways = analysis?.takeaways || []
  const critMap: Record<string, string> = {
    Backend: takeaways[0] || 'No backend insights available.',
    Frontend: takeaways[1] || 'No frontend insights available.',
    DB: takeaways[2] || 'No database insights available.',
    Other: takeaways[3] || 'Review cross-team responsibilities.'
  }

  function urgentSuggestion() {
    if (!analysis) return 'No analysis available.'
    const { complexity, documentation, tests } = analysis.metrics
    if (tests < 50) return 'Increase automated test coverage immediately.'
    if (documentation < 50) return 'Document core modules for knowledge transfer.'
    if (complexity > 70) return 'Refactor high-complexity areas to reduce risk.'
    return 'Maintain momentum, but continue monitoring health metrics.'
  }

  async function roast() {
    if (!repo || !branch) return
    const form = new FormData()
    form.append('repo', repo)
    form.append('branch', branch)
    setLoading(true)
    try {
      const res = await fetch('/api/ingest', { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok) {
        setAnalysis(data.analysis)
        localStorage.setItem('ingestResult', JSON.stringify(data))
      }
    } catch {}
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-200 p-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roaster</h1>
          <p className="text-sm text-zinc-400">Critique snapshot for {repo}{branch && `@${branch}`}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center text-[10px] text-zinc-400">
            <input
              type="range"
              min={0}
              max={2}
              value={temp}
              onChange={e => setTemp(parseInt(e.target.value))}
              className="w-24 accent-emerald-500"
            />
            <div className="flex justify-between w-full">
              <span>Mild</span>
              <span>Hot</span>
            </div>
          </div>
          <button
            onClick={roast}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded text-sm hover:bg-zinc-700"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Flame className="w-4 h-4 text-rose-400" />
            )}
            Roast
          </button>
        </div>
      </div>

      {analysis ? (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold">Project Health</span>
            </div>
            <Gauge value={health} />
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {['Backend', 'Frontend', 'DB', 'Other'].map(cat => (
              <Card key={cat}>
                <div className="text-sm font-semibold mb-1">{cat} Dept.</div>
                <p className="text-xs text-zinc-400">
                  {prefix} {critMap[cat]}
                </p>
              </Card>
            ))}
          </div>

          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Urgent Action
            </div>
            <p className="text-xs text-zinc-400 mt-2">{urgentSuggestion()}</p>
          </Card>
        </div>
      ) : (
        <p className="text-sm text-zinc-400">No analysis available. Ingest a repository to begin.</p>
      )}
    </div>
  )
}

