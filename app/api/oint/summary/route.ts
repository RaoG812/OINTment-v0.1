import { NextResponse } from 'next/server'
import type { DashboardData } from '../../../../lib/types.oint'
import { isCreated, hasFinanceData } from '../state'

export async function GET() {
  if (!isCreated()) {
    return NextResponse.json({ error: 'OINT not created' }, { status: 409 })
  }
  const data: DashboardData = {
    generatedAt: '2024-04-01T00:00:00Z',
    pulse: { envs: ['prod', 'stage'], deploysToday: 2, criticalAlerts: 0 },
    stack: {
      appName: 'OINTment',
      description: 'Toolset revealing project integrations and operational readiness.',
      integrations: [
        { name: 'Supabase', logoUrl: '/logos/supabase.svg' },
        { name: 'Next.js', logoUrl: '/logos/nextjs.svg' },
        { name: 'Redis', logoUrl: '/logos/redis.svg' },
        { name: 'Sentry', logoUrl: '/logos/sentry.svg' }
      ]
    },
    actions: [
      { id: 'act-1', title: 'Upgrade Next.js to v14', severity: 'high', rationale: 'Latest security fixes' },
      { id: 'act-2', title: 'Review Redis configuration', severity: 'medium', rationale: 'Potential performance issues' },
      { id: 'act-3', title: 'Add tests for new API endpoints', severity: 'low', rationale: 'Improve coverage' }
    ],
    onboardingPlan: [
      { day: 'Days 1-3', step: 'Collect existing documentation and meet core team.' },
      { day: 'Days 4-7', step: 'Review architecture and integration stack.' },
      { day: 'Days 8-14', step: 'Align with stakeholders on priorities and risks.' },
      { day: 'Days 15-21', step: 'Draft improvement roadmap and assign owners.' },
      { day: 'Days 22-26', step: 'Initiate quick wins and monitor impact.' },
      { day: 'Days 27-30', step: 'Prepare report and present to leadership.' }
    ],
    reliability: { coveragePct: 76, evidenceCompletenessPct: 50, llmStaticAgreementPct: 66 }
  }
  if (hasFinanceData()) {
    data.finance = { effectivenessPct: 72 }
  }
  return NextResponse.json(data)
}
