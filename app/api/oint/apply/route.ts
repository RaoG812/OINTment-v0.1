import { NextResponse } from 'next/server'
import { isCreated, getKnowledge } from '../state'

export async function POST(req: Request) {
  if (!isCreated()) {
    return NextResponse.json({ error: 'OINT not created' }, { status: 409 })
  }

  const body = await req.json().catch(() => ({}))
  const roast = Array.isArray(body.roast) ? body.roast : []

  let { docs, files, code } = getKnowledge()
  if (body.knowledge) {
    const k = body.knowledge
    if (Array.isArray(k.docs) && Array.isArray(k.files)) {
      docs = k.docs.map((d: any) => ({
        name: d.name,
        text: (d.text || d.content || '').toString()
      }))
      files = k.files
    }
    if (Array.isArray(k.code)) {
      code = k.code
        .filter((f: any) => f && typeof f.path === 'string')
        .map((f: any) => ({ path: f.path, content: String(f.content || '') }))
    }
  }

  const STOP = new Set(
    'the and for with this that from into your about there their will have has are were was its our out other such too can '.split(
      /\s+/
    )
  )

  function topKeywords(text: string, limit = 3) {
    const counts = new Map<string, number>()
    for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
      const w = raw.trim()
      if (!w || STOP.has(w)) continue
      counts.set(w, (counts.get(w) || 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([w]) => w)
  }

  const recommendations = roast.map((c: any) => {
    const issues = topKeywords(c.comment)
    const docHits = docs
      .filter(d => issues.some(k => d.text.toLowerCase().includes(k)))
      .map(d => d.name)
      .slice(0, 2)
    const codeHits = code
      .filter(f =>
        issues.some(k =>
          f.content.toLowerCase().includes(k) || f.path.toLowerCase().includes(k)
        )
      )
      .slice(0, 2)
    const refs = [
      ...docHits.map(d => `doc "${d}"`),
      ...codeHits.map(f => `file "${f.path}"`)
    ]
    const refText = refs.length ? ` See ${refs.join(' and ')}.` : ''
    const comment = `${c.comment.trim().replace(/\.$/, '')}.${refText}`
    return {
      department: c.department,
      comment,
      temperature: Math.max(0, c.temperature - 0.1)
    }
  })

  const allSteps = roast.map((c: any) => {
    const issues = topKeywords(c.comment)
    const docHits = docs
      .filter(d => issues.some(k => d.text.toLowerCase().includes(k)))
      .map(d => d.name)
      .slice(0, 2)
    const codeHits = code
      .filter(f =>
        issues.some(k =>
          f.content.toLowerCase().includes(k) || f.path.toLowerCase().includes(k)
        )
      )
      .slice(0, 2)
    const res: string[] = []
    docHits.forEach(d =>
      res.push(`Update ${d} to address ${issues.join(', ')}`)
    )
    codeHits.forEach(f =>
      res.push(`Improve ${f.path} around ${issues.join(', ')}`)
    )
    if (!docHits.length && !codeHits.length && issues.length) {
      res.push(`Document ${issues[0]} for the ${c.department} team`)
    }
    if (res.length === 0) res.push(`Resolve ${c.department} feedback: ${c.comment}`)
    return res
  })
  const steps = Array.from(new Set(allSteps.flat())).slice(0, 8)

  return NextResponse.json({ comments: recommendations, steps })
}
