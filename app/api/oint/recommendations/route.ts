import { NextResponse } from 'next/server'
import { isCreated } from '../state'

type Suggestion = { department: 'frontend'|'backend'|'ops'; comment: string; temperature: number }

export async function GET() {
  if (!isCreated()) {
    return NextResponse.json({ error: 'OINT not created' }, { status: 409 })
  }
  const comments: Suggestion[] = [
    { department: 'frontend', comment: 'Consider splitting large components', temperature: 0.2 },
    { department: 'backend', comment: 'Optimize database queries', temperature: 0.3 },
    { department: 'ops', comment: 'Add deployment health checks', temperature: 0.25 }
  ]
  return NextResponse.json({ comments })
}
