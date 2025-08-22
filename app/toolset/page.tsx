'use client'
import { useState } from 'react'
import { Card, Badge, Metric } from '../../lib/ui'
import type { DashboardData } from '../../lib/types.oint'
import HexBackground from '../../components/HexBackground'
import { getOintData, setOintData } from '../../lib/toolsetState'
import { getDocs } from '../../lib/docsState'

export default function ToolsetPage() {
  const [data, setData] = useState<DashboardData | null>(getOintData())
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function create() {
    setCreating(true)
    setError('')
    try {
      const docs = getDocs()
      const ingest = localStorage.getItem('ingestResult')
      const hasRepo = !!ingest
      const hasVuln = localStorage.getItem('vulnChecked') === 'true'
      if (docs.length === 0 || !hasRepo || !hasVuln) {
        throw new Error('insufficient data for OINT')
      }
      const form = new FormData()
      docs.forEach(f => form.append('docs', f))
      form.append('hasRepo', String(hasRepo))
      form.append('hasVuln', String(hasVuln))
      if (ingest) {
        try {
          const parsed = JSON.parse(ingest)
          form.append('files', JSON.stringify(parsed.files || []))
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
      <div className="relative z-10 p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Toolset — OINT Mission Control</h1>
        {!data && (
          <>
            <Card className="max-w-md">
              {creating ? (
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
            {error && <div className="text-xs text-rose-400">{error}</div>}
          </>
        )}
        {data && (
          <div className="space-y-6">
            <Card className="flex flex-wrap gap-6 text-sm">
              <div>Envs: {data.pulse.envs.join(', ')}</div>
              <div>Deploys today: {data.pulse.deploysToday}</div>
              <div>Critical alerts: {data.pulse.criticalAlerts}</div>
            </Card>
            <Card>
              <h2 className="text-xl font-semibold mb-2">{data.stack.appName}</h2>
              <p className="text-sm mb-4 text-zinc-300">{data.stack.description}</p>
              <div className="flex flex-wrap gap-4">
                {data.stack.integrations.map(i => (
                  <div key={i.name} className="flex items-center gap-2 text-sm">
                    {i.logoUrl && <img src={i.logoUrl} alt="" className="h-5 w-5" />}
                    {i.name}
                  </div>
                ))}
              </div>
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
            {data.finance && (
              <Card>
                <h2 className="text-lg font-semibold mb-2">Finance</h2>
                <p className="text-sm">Budget effectiveness: {data.finance.effectivenessPct}%</p>
              </Card>
            )}
            <Card>
              <h2 className="text-lg font-semibold mb-4">30-Day Onboarding Plan</h2>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                {data.onboardingPlan.map(item => (
                  <li key={item.day}>
                    <span className="font-medium">{item.day}:</span> {item.step}
                  </li>
                ))}
              </ol>
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
    </main>
  )
}
