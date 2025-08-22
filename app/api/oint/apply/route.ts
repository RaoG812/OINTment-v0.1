import { NextResponse } from 'next/server'
import { isCreated, getKnowledge } from '../state'

export async function POST(req: Request) {
  if (!isCreated()) {
    return NextResponse.json({ error: 'OINT not created' }, { status: 409 })
  }

  const body = await req.json().catch(() => ({}))
  const roast = Array.isArray(body.roast) ? body.roast : []
  const { docs } = getKnowledge()
  const docText = docs.map(d => d.text.toLowerCase()).join(' ')

  const comments = roast.map((c: any) => ({
    department: c.department,
    comment: docText.includes(c.department.toLowerCase())
      ? `Cross-check ${c.department} docs and adjust accordingly.`
      : `Investigate ${c.department} area with limited documentation.`,
    temperature: Math.max(0, c.temperature - 0.1)
  }))

  const docSteps = docs.map(d => `Review ${d.name}`)
  const roastSteps = roast.map((c: any) => `Resolve ${c.department} feedback`)
  const steps = [...docSteps, ...roastSteps].slice(0, 5)

  return NextResponse.json({ comments, steps })
}
