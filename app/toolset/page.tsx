'use client'
import { useState } from 'react'
import { Card, Badge, Metric } from '../../lib/ui'
import type { DashboardData } from '../../lib/types.oint'

export default function ToolsetPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)

  async function create() {
    setLoading(true)
    try {
      await fetch('/api/oint/apply', { method: 'POST' })
      const res = await fetch('/api/oint/summary')
      const json = (await res.json()) as DashboardData
      setData(json)
    } finally {
      setLoading(false)
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
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Toolset — OINT Mission Control</h1>
      {!data && (
        <Card className="max-w-md">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-500" />
              <span className="text-sm">Running OINT analysis…</span>
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
        </div>
      )}
    </div>
  )
}
