import { NextResponse } from 'next/server'
import type { DashboardData } from '../../../../lib/types.oint'
import { isCreated, hasFinanceData, getKnowledge } from '../state'
import pkg from '../../../../package.json'

export async function GET() {
  if (!isCreated()) {
    return NextResponse.json({ error: 'OINT not created' }, { status: 409 })
  }

  const { docs, files } = getKnowledge()

  const envs: string[] = []
  if (files.some(f => /prod/i.test(f))) envs.push('prod')
  if (files.some(f => /stag/i.test(f))) envs.push('stage')
  envs.push('dev')

  const testFiles = files.filter(f => /test|spec/i.test(f)).length
  const coverage = Math.round((testFiles / Math.max(files.length, 1)) * 100)

  const actions = [] as DashboardData['actions']
  if (docs.some(d => /todo/i.test(d.text))) {
    actions.push({
      id: 'act-todo',
      title: 'Resolve TODOs in documentation',
      severity: 'medium',
      rationale: 'Detected TODO markers in uploaded docs'
    })
  }
  if (files.length && testFiles === 0) {
    actions.push({
      id: 'act-tests',
      title: 'Add automated tests',
      severity: 'high',
      rationale: 'No test files found in repository snapshot'
    })
  }

  const onboardingPlan = docs.map((d, i) => ({
    day: `Day ${i + 1}`,
    step: `Review ${d.name}`
  }))

  const data: DashboardData = {
    generatedAt: new Date().toISOString(),
    pulse: {
      envs,
      deploysToday: files.filter(f => /deploy/i.test(f)).length,
      criticalAlerts: docs.some(d => /alert/i.test(d.text)) ? 1 : 0
    },
    stack: {
      appName: pkg.name || 'app',
      description: (pkg as any).description || '',
      integrations: Object.keys(pkg.dependencies || {}).map(name => ({ name }))
    },
    actions,
    onboardingPlan,
    reliability: {
      coveragePct: coverage,
      evidenceCompletenessPct: Math.round((docs.length / 5) * 100),
      llmStaticAgreementPct: 100 - Math.abs(50 - coverage)
    }
  }

  if (hasFinanceData()) {
    data.finance = { effectivenessPct: Math.max(0, 100 - docs.length * 10) }
  }

  return NextResponse.json(data)
}
