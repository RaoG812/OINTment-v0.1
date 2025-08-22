import { NextResponse } from 'next/server'
import { isCreated, getKnowledge } from '../state'

export async function POST(req: Request) {
  if (!isCreated()) {
    return NextResponse.json({ error: 'OINT not created' }, { status: 409 })
  }

  const body = await req.json().catch(() => ({}))
  const roast = Array.isArray(body.roast) ? body.roast : []

  let { docs, files } = getKnowledge()
  if (body.knowledge) {
    const k = body.knowledge
    if (Array.isArray(k.docs) && Array.isArray(k.files)) {
      docs = k.docs.map((d: any) => ({
        name: d.name,
        text: (d.text || d.content || '').toString()
      }))
      files = k.files
    }
  }

  const docText = docs.map(d => d.text.toLowerCase()).join(' ')

  const STOP = new Set(
    'the and for with this that from into your about there their will have has are were was its our out other such too can '.split(
      /\s+/
    )
  )

  function extractKeywords(text: string, dept: string) {
    const sentences = text
      .split(/[.!?]/)
      .filter(s => s.includes(dept.toLowerCase()))
    const counts = new Map<string, number>()
    for (const s of sentences) {
      for (const raw of s.split(/[^a-z0-9]+/)) {
        const w = raw.trim()
        if (!w || STOP.has(w) || w === dept.toLowerCase()) continue
        counts.set(w, (counts.get(w) || 0) + 1)
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([w]) => w)
  }

  const comments = roast.map((c: any) => {
    const keywords = extractKeywords(docText, c.department)
    let comment: string
    if (keywords.length) {
      comment = `Key topics: ${keywords.join(', ')}`
    } else {
      const related = files
        .filter(f => f.toLowerCase().includes(c.department.toLowerCase()))
        .slice(0, 2)
      comment = related.length
        ? `Review ${related.join(', ')}`
        : `Audit ${c.department} code and add documentation`
    }
    return {
      department: c.department,
      comment,
      temperature: Math.max(0, c.temperature - 0.1)
    }
  })

  const docSteps = docs.map(d => `Review ${d.name}`)
  const keywordSteps = comments.flatMap(
    (c: { department: string; comment: string }) =>
      c.comment.startsWith('Key topics:')
        ? c.comment
            .replace('Key topics: ', '')
            .split(', ')
            .map((k: string) => `Investigate ${c.department} ${k}`)
        : []
  )
  const fileSteps = roast.flatMap((c: any) =>
    files
      .filter(f => f.toLowerCase().includes(c.department.toLowerCase()))
      .slice(0, 2)
      .map(f => `Refine ${c.department} work in ${f}`)
  )
  const fallbackSteps = roast.map((c: any) => `Resolve ${c.department} feedback`)
  const steps = Array.from(new Set([...docSteps, ...keywordSteps, ...fileSteps, ...fallbackSteps])).slice(0, 8)

  return NextResponse.json({ comments, steps })
}
