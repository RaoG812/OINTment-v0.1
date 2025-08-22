import { NextResponse } from 'next/server'
import { markCreated } from '../state'

export async function POST(req: Request) {
  const form = await req.formData()
  const files = form.getAll('files') as File[]
  const hasFinance = files.some(f => /fin|budget|cost|expense/i.test(f.name))
  markCreated(hasFinance)
  return NextResponse.json({ status: 'created', jobId: 'demo-job' })
}
