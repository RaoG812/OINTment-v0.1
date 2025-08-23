'use client'
import { useState } from 'react'
import { Card, Badge, Metric } from '../../lib/ui'
import dynamic from 'next/dynamic'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'
import { Upload, Network, Flame, Smile } from 'lucide-react'
import Link from 'next/link'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)
const Radar = dynamic(() => import('react-chartjs-2').then(m => m.Radar), { ssr: false })
import type { DashboardData } from '../../lib/types.oint'
import HexBackground from '../../components/HexBackground'
import AnimatedLogo from '../../components/AnimatedLogo'
import { getOintData, setOintData } from '../../lib/toolsetState'
import { getDocs, type DocItem } from '../../lib/docsState'
import { getRoasterState, type Comment } from '../../lib/roasterState'

export default function ToolsetPage() {
  const [data, setData] = useState<DashboardData | null>(getOintData())
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const roastState = getRoasterState()
  const hasRoast = Object.values(roastState.widgets).some(
    w => w.comment !== 'Awaiting review'
  )
  const roastComments: Comment[] =
    roastState.roast || (Object.values(roastState.widgets) as Comment[])

  async function create() {
    setCreating(true)
    setError('')
    try {
      const docs = getDocs().filter(Boolean) as DocItem[]
      const ingest = localStorage.getItem('ingestResult')
      const hasRepo = !!ingest
      if (docs.length === 0 || !hasRepo) {
        throw new Error('insufficient data for OINT')
      }
      const form = new FormData()
      docs.forEach(d =>
        form.append('docs', new File([d.file], d.name, { type: d.file.type }))
      )
      form.append('hasRepo', String(hasRepo))
      form.append('hasVuln', String(hasRoast))
      if (ingest) {
        try {
          const parsed = JSON.parse(ingest)
          form.append('files', JSON.stringify(parsed.files || []))
          form.append('code', JSON.stringify(parsed.code || []))
        } catch {}
      }
      const createRes = await fetch('/api/oint/create', { method: 'POST', body: form })
      const createJson = await createRes.json()
      if (!createRes.ok) throw new Error(createJson.error || 'create failed')
      const res = await fetch('/api/oint/summary')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'summary failed')
      setData(json as DashboardData)
      setOintData(json as DashboardData)
    } catch (err) {
      setData(null)
      setOintData(null)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setCreating(false)
    }
  }

  function severityColor(s: DashboardData['actions'][number]['severity']) {
    switch (s) {
      case 'critical':
        return 'bg-rose-600'
      case 'high':
        return 'bg-rose-500'
      case 'medium':
        return 'bg-amber-500'
      default:
        return 'bg-emerald-600'
    }
  }

  function shorten(text: string) {
    const words = (text || '').split(/\s+/)
    const count = Math.max(1, Math.round(words.length * 0.25))
    return words.slice(0, count).join(' ') + (words.length > count ? '…' : '')
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <HexBackground />
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(at 25% 25%, rgba(34,211,238,0.35), transparent 60%), radial-gradient(at 75% 25%, rgba(168,85,247,0.35), transparent 60%), radial-gradient(at 50% 75%, rgba(255,255,255,0.2), transparent 70%)',
            backgroundSize: '200% 200%',
            animation: 'bgMove 20s ease infinite',
            filter: 'blur(40px)'
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-20">
        <div
          className="absolute top-1/2 h-full -translate-x-1/2 -translate-y-1/2 scale-[1.5]"
          style={{ left: '16.7%' }}
        >
          <AnimatedLogo className="h-full w-auto text-white" />
        </div>
      </div>
      <div className="relative z-10 p-6 space-y-6 fade-in-fast">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Toolset</h1>
            {!data && (
              <Card className="max-w-md space-y-2">
                {creating ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-500" />
                    <span className="text-sm">Running OINT analysis…</span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={create}
                      className="px-4 py-2 bg-emerald-600 text-sm font-medium rounded-lg hover:bg-emerald-500 transition"
                    >
                      Create OINT
                    </button>
                    <p className="text-xs text-zinc-400">
                      Requires at least one supporting document. More insight available after a roast.
                    </p>
                  </>
                )}
              </Card>
            )}
            {data && (
              <button
                onClick={create}
                disabled={creating}
                className="px-4 py-2 bg-emerald-600 text-sm font-medium rounded-lg hover:bg-emerald-500 transition"
              >
                {creating ? 'Recreating…' : 'Recreate OINT'}
              </button>
            )}
            {error && <div className="text-xs text-rose-400">{error}</div>}
          </div>
          <div className="text-right leading-tight">
            <div className="text-5xl font-bold iridescent-text">Mission Control</div>
            <div className="text-sm text-zinc-400">Ingest, Map, Roast & Vibe in sync</div>
            {!creating && (
              <div className="relative mt-8 ml-auto w-80 h-60">
                <svg viewBox="0 0 320 240" className="absolute inset-0 text-zinc-600" fill="none">
                  <defs>
                    <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                      <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
                    </marker>
                  </defs>
                  <line x1="160" y1="28" x2="160" y2="120" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <line x1="292" y1="120" x2="160" y2="120" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <line x1="160" y1="212" x2="160" y2="120" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <line x1="28" y1="120" x2="160" y2="120" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" />
                </svg>
                <div className="absolute left-1/2 top-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center text-sm font-medium">OINT</div>
                <Link
                  href="/ingest"
                  className="absolute left-1/2 top-0 -translate-x-1/2 flex flex-col items-center group"
                >
                  <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400 transition-colors group-hover:border-emerald-500 group-hover:text-emerald-300">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="mt-1 text-xs">Ingest</span>
                </Link>
                <Link
                  href="/matrix"
                  className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center group"
                >
                  <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400 transition-colors group-hover:border-emerald-500 group-hover:text-emerald-300">
                    <Network className="w-5 h-5" />
                  </div>
                  <span className="mt-1 text-xs">Matrix</span>
                </Link>
                <Link
                  href="/roaster"
                  className="absolute left-1/2 bottom-0 -translate-x-1/2 flex flex-col items-center group"
                >
                  <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400 transition-colors group-hover:border-emerald-500 group-hover:text-emerald-300">
                    <Flame className="w-5 h-5" />
                  </div>
                  <span className="mt-1 text-xs">Roaster</span>
                </Link>
                <Link
                  href="/vibe-killer"
                  className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center group"
                >
                  <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400 transition-colors group-hover:border-emerald-500 group-hover:text-emerald-300">
                    <Smile className="w-5 h-5" />
                  </div>
                  <span className="mt-1 text-xs">Vibe</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {data && (
          <div className="space-y-6">
            {!hasRoast && (
              <div className="text-xs text-zinc-400">
                Run a roast to enrich these insights.
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Roast Findings (kept) */}
              {hasRoast && (
                <Card>
                  <h2 className="text-lg font-semibold mb-4">Roast Findings</h2>
                  <ul className="space-y-2">
                    {roastComments.map(c => (
                      <li key={c.department} className="text-sm">
                        <span className="font-medium capitalize">{c.department}:</span>{' '}
                        {shorten(c.comment)}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Pulse (enhanced) */}
              <Card className="p-6 bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 backdrop-blur-sm">
                <h2 className="text-lg font-semibold mb-4">Pulse</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-zinc-800/50 text-center">
                    <div
                      className="text-emerald-400 text-xl font-bold"
                      title={(data?.pulse?.envs ?? []).join(', ')}
                    >
                      {(data?.pulse?.envs ?? []).length}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">Environments</div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-800/50 text-center">
                    <div className="text-emerald-400 text-xl font-bold">
                      {data?.pulse?.deploysToday ?? 0}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">Deploys today</div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-800/50 text-center">
                    <div className="text-emerald-400 text-xl font-bold">
                      {data?.pulse?.criticalAlerts ?? 0}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">Critical alerts</div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-800/50 text-center">
                    <div className="text-emerald-400 text-xl font-bold">
                      {data?.pulse?.filesAnalyzed ?? 0}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">Files analyzed</div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-800/50 text-center">
                    <div className="text-emerald-400 text-xl font-bold">
                      {data?.pulse?.docsReviewed ?? 0}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">Docs reviewed</div>
                  </div>
                </div>
              </Card>

              {/* Stack (enhanced) */}
              <Card className="p-6 bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 rounded-xl border border-zinc-700/50 pointer-events-none" />
                <h2 className="text-xl font-semibold mb-1 relative z-10">{data?.stack?.appName}</h2>
                <p className="text-sm mb-6 text-zinc-300 relative z-10">
                  {data?.stack?.description}
                </p>
                <div className="flex flex-wrap gap-4 relative z-10">
                  {(data?.stack?.integrations ?? []).map(i => (
                    <div
                      key={i.name}
                      className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-2 py-1 text-sm"
                    >
                      {i.logoUrl && (
                        <img src={i.logoUrl} alt="" className="h-5 w-5 rounded" />
                      )}
                      <span>{i.name}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Actions */}
              <Card>
                <h2 className="text-lg font-semibold mb-4">Actions</h2>
                <ul className="space-y-2">
                  {data.actions?.map(a => (
                    <li key={a.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className={`${severityColor(a.severity)} text-white`}>{a.severity}</Badge>
                        <span className="font-medium">{a.title}</span>
                      </div>
                      <div className="text-xs text-zinc-400 ml-6">{a.rationale}</div>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Finance */}
              {data.finance && (
                <Card>
                  <h2 className="text-lg font-semibold mb-2">Finance</h2>
                  <div className="space-y-2">
                    <div className="h-2 bg-zinc-700 rounded">
                      <div
                        className="h-full bg-emerald-500 rounded"
                        style={{ width: `${data.finance.effectivenessPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-400">
                      Budget effectiveness: {data.finance.effectivenessPct}%
                    </p>
                  </div>
                </Card>
              )}

              {/* Timeline Estimate */}
              <Card>
                <h2 className="text-lg font-semibold mb-4">Timeline Estimate</h2>
                <ul className="space-y-3">
                  {data.timeline?.map(t => (
                    <li key={t.phase}>
                      <div className="text-sm font-medium">{t.phase}</div>
                      <div className="h-2 bg-zinc-700 rounded">
                        <div
                          className="h-full bg-emerald-500 rounded"
                          style={{ width: `${(t.days / 30) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-zinc-400 mt-1">{t.days} days</div>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* 30-Day Onboarding Plan */}
              <Card>
                <h2 className="text-lg font-semibold mb-4">30-Day Onboarding Plan</h2>
                <div className="relative pl-4">
                  <div className="absolute left-1 top-0 bottom-0 w-px bg-emerald-700/50" />
                  <ul className="space-y-4">
                    {data.onboardingPlan?.map(item => (
                      <li key={item.day} className="relative pl-6">
                        <span className="absolute left-1 top-1 w-2 h-2 rounded-full bg-emerald-500" />
                        <div className="text-xs text-emerald-400 font-medium">{item.day}</div>
                        <div className="text-sm text-zinc-300">{item.step}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              {/* Reliability Gate (merged: Radar + Metrics, conditional) */}
              {data.reliability && (
                <Card>
                  <h2 className="text-lg font-semibold mb-4">Reliability Gate</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6">
                    <div className="w-48 h-48 sm:w-60 sm:h-60 mx-auto">
                      <Radar
                        data={{
                          labels: ['Coverage', 'Evidence', 'LLM Agreement'],
                          datasets: [
                            {
                              label: 'Reliability',
                              data: [
                                data.reliability.coveragePct,
                                data.reliability.evidenceCompletenessPct,
                                data.reliability.llmStaticAgreementPct
                              ],
                              backgroundColor: 'rgba(16,185,129,0.3)',
                              borderColor: '#10b981',
                              pointBackgroundColor: '#10b981',
                              pointBorderColor: '#10b981',
                              fill: true
                            }
                          ]
                        }}
                        options={{
                          plugins: { legend: { display: false } },
                          scales: {
                            r: {
                              beginAtZero: true,
                              angleLines: { color: '#27272a' },
                              grid: { color: '#27272a' },
                              max: 100,
                              ticks: { display: false }
                            }
                          },
                          maintainAspectRatio: false
                        }}
                      />
                    </div>
                    <div className="flex-1 mt-6 sm:mt-0 space-y-4">
                      <Metric label="Coverage" value={data.reliability.coveragePct} />
                      <Metric label="Evidence" value={data.reliability.evidenceCompletenessPct} />
                      <Metric label="LLM Agreement" value={data.reliability.llmStaticAgreementPct} />
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
