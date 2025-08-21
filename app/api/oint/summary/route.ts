import { NextResponse } from 'next/server'
import type { DashboardData } from '../../../../lib/types.oint'

export async function GET() {
  const data: DashboardData & Record<string, unknown> = {
    generatedAt: '2024-04-01T00:00:00Z',
    pulse: { envs: ['prod', 'stage'], deploysToday: 2, criticalAlerts: 0 },
    integrationsTop10: [
      { name: 'Supabase', category: 'database', impact: 88, security: 90, ops: 70, health: 85, coupling: 40, upgrade: 80, logoUrl: '/logos/supabase.svg' },
      { name: 'Next.js', category: 'framework', impact: 92, security: 88, ops: 75, health: 90, coupling: 60, upgrade: 65, logoUrl: '/logos/nextjs.svg' },
      { name: 'Redis', category: 'cache', impact: 78, security: 70, ops: 60, health: 80, coupling: 50, upgrade: 75, logoUrl: '/logos/redis.svg' },
      { name: 'Sentry', category: 'monitoring', impact: 60, security: 65, ops: 55, health: 70, coupling: 30, upgrade: 80, logoUrl: '/logos/sentry.svg' }
    ],
    hotspots: [],
    actions: [
      { id: 'act-1', title: 'Upgrade Next.js to v14', severity: 'high', rationale: 'Latest security fixes' },
      { id: 'act-2', title: 'Review Redis configuration', severity: 'medium', rationale: 'Potential performance issues' },
      { id: 'act-3', title: 'Add tests for new API endpoints', severity: 'low', rationale: 'Improve coverage' }
    ],
    ownership: [],
    topology: {},
    pipeline: {},
    security: {},
    apiSurface: {},
    docs: {},
    commitMatrix: {},
    reliability: { coveragePct: 76, evidenceCompletenessPct: 50, llmStaticAgreementPct: 66 }
  }
  return NextResponse.json(data)
}
