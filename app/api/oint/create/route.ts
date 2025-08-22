import { NextResponse } from 'next/server'
import { markCreated } from '../state'

export async function POST(req: Request) {
  const form = await req.formData()
  const docs = form.getAll('docs') as File[]
  const hasRepo = form.get('hasRepo') === 'true'
  const hasVuln = form.get('hasVuln') === 'true'
  if (docs.length === 0 || docs.length > 5 || !hasRepo || !hasVuln) {
    return NextResponse.json({ error: 'insufficient data for OINT' }, { status: 400 })
  }
  const hasFinance = docs.some(f => /fin|budget|cost|expense/i.test(f.name))
  markCreated(docs.length, hasRepo, hasVuln, hasFinance)
  return NextResponse.json({ status: 'created', jobId: 'demo-job' })
}
