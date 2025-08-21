import { NextResponse } from 'next/server'
import { markCreated } from '../state'

export async function POST() {
  markCreated()
  return NextResponse.json({ status: 'queued', jobId: 'demo-job' })
}
