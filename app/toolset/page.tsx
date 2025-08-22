'use client'
import { useState } from 'react'
import { Card, Badge, Metric } from '../../lib/ui'
import type { DashboardData } from '../../lib/types.oint'
import HexBackground from '../../components/HexBackground'
import { getOintData, setOintData } from '../../lib/toolsetState'

interface Recommendation { department: 'frontend'|'backend'|'ops'; insight: string }

export default function ToolsetPage() {
  const [data, setData] = useState<DashboardData | null>(getOintData())
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null)
  const [creating, setCreating] = useState(false)
  const [applying, setApplying] = useState(false)

  async function create() {
    setCreating(true)
    try {
      await fetch('/api/oint/create', { method: 'POST' })
      const res = await fetch('/api/oint/summary')
      const json = (await res.json()) as DashboardData
      setData(json)
      setOintData(json)
    } finally {
      setCreating(false)
    }
  }

  async function apply() {
    setApplying(true)
    try {
      const res = await fetch('/api/oint/apply', { method: 'POST' })
      const json = (await res.json()) as { recommendations: Recommendation[] }
      setRecommendations(json.recommendations)
    } finally {
      setApplying(false)
    }
  }

  function scoreColor(v: number) {
    return v >= 80 ? 'text-emerald-400' : v >= 60 ? 'text-amber-400' : 'text-rose-400'
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

  return (
    <main className="relative min-h-screen overflow-hidden">
      <HexBackground />
      <div className="relative z-10 p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Toolset — OINT Mission Control</h1>
        {!data && (
          <Card className="max-w-md">
            {creating ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-500" />
                <span className="text-sm">Mixing OINT ingredients…</span>
              </div>
            ) : (
              <button
                onClick={create}
                className="px-4 py-2 bg-emerald-600 text-sm font-medium rounded-lg hover:bg-emerald-500 transition"
              >
                Create OINT
              </button>
            )}
          </Card>
        )}
        {data && (
          <div className="space-y-6">
            <Card className="flex flex-wrap gap-6 text-sm">
              <div>Envs: {data.pulse.envs.join(', ')}</div>
              <div>Deploys today: {data.pulse.deploysToday}</div>
              <div>Critical alerts: {data.pulse.criticalAlerts}</div>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold mb-4">Top Integrations</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-1">Name</th>
                    <th className="py-1">Impact</th>
                    <th className="py-1">Security</th>
                    <th className="py-1">Ops</th>
                    <th className="py-1">Health</th>
                    <th className="py-1">Coupling</th>
                    <th className="py-1">Upgrade</th>
                  </tr>
                </thead>
                <tbody>
                  {data.integrationsTop10.slice(0, 4).map(row => (
                    <tr key={row.name} className="border-t border-zinc-800">
                      <td className="py-1 flex items-center gap-2">
                        {row.logoUrl && (
                          <img src={row.logoUrl} alt="" className="h-4 w-4" />
                        )}
                        {row.name}
                      </td>
                      <td className={`py-1 ${scoreColor(row.impact)}`}>{row.impact}</td>
                      <td className={`py-1 ${scoreColor(row.security)}`}>{row.security}</td>
                      <td className={`py-1 ${scoreColor(row.ops)}`}>{row.ops}</td>
                      <td className={`py-1 ${scoreColor(row.health)}`}>{row.health}</td>
                      <td className={`py-1 ${scoreColor(row.coupling)}`}>{row.coupling}</td>
                      <td className={`py-1 ${scoreColor(row.upgrade)}`}>{row.upgrade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold mb-4">Actions</h2>
              <ul className="space-y-2">
                {data.actions.map(a => (
                  <li key={a.id} className="flex items-center gap-2 text-sm">
                    <Badge className={`${severityColor(a.severity)} text-white`}>{a.severity}</Badge>
                    <span className="font-medium">{a.title}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold mb-4">Reliability Gate</h2>
              <div className="space-y-4">
                <Metric label="Coverage" value={data.reliability.coveragePct} />
                <Metric label="Evidence" value={data.reliability.evidenceCompletenessPct} />
                <Metric label="LLM Agreement" value={data.reliability.llmStaticAgreementPct} />
              </div>
            </Card>
            <Card className="max-w-md">
              {applying ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-500" />
                  <span className="text-sm">Dispensing OINT insights…</span>
                </div>
              ) : (
                <button
                  onClick={apply}
                  className="px-4 py-2 bg-blue-600 text-sm font-medium rounded-lg hover:bg-blue-500 transition"
                >
                  Apply OINT
                </button>
              )}
            </Card>
            {recommendations && (
              <div className="grid sm:grid-cols-3 gap-4">
                {recommendations.map(r => (
                  <Card key={r.department} className="space-y-2">
                    <div className="text-sm font-semibold capitalize">{r.department}</div>
                    <div className="text-xs text-zinc-400">{r.insight}</div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
