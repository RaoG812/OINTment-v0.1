import { NextResponse } from 'next/server'

let started = false

export async function POST() {
  started = true
  return NextResponse.json({ status: 'queued', jobId: 'demo-job' })
}

export function hasStarted() {
  return started
}
