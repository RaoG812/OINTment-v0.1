import { NextResponse } from 'next/server'
import { isCreated } from '../state'

export async function POST() {
  if (!isCreated()) {
    return NextResponse.json({ error: 'OINT not created' }, { status: 409 })
  }
  const recommendations = [
    { department: 'frontend', insight: 'Adopt a unified design system across all apps to streamline UX.' },
    { department: 'backend', insight: 'Prioritize database indexing reviews to cut query times.' },
    { department: 'ops', insight: 'Establish weekly incident drills to improve response readiness.' }
  ] as const
  return NextResponse.json({ recommendations })
}
