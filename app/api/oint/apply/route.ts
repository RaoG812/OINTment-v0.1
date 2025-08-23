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

  const comments = roast.map((c: any) => {
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
    const fileHits = codeHits.map(c => c.path)
    let detail = ''
    if (docHits.length) detail += `docs: ${docHits.join(', ')}`
    if (fileHits.length)
      detail += `${detail ? ' and ' : ''}files: ${fileHits.join(', ')}`
    let comment = c.comment
    if (issues.length) {
      const issueText = issues.join(' & ')
      comment = detail
        ? `Roast flagged ${issueText}; check ${detail}`
        : `Roast flagged ${issueText}; add references`
    }
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
    const codeHits = code
      .filter(f =>
        issues.some(k =>
          f.content.toLowerCase().includes(k) || f.path.toLowerCase().includes(k)
        )
      )
      .slice(0, 2)
    const res = new Set<string>()
    docHits.forEach(d => issues.forEach(k => res.add(`Update ${d} for ${k}`)))
    codeHits.forEach(f => issues.forEach(k => res.add(`Improve ${f.path} around ${k}`)))
    if (!docHits.length && !codeHits.length && issues.length) {
      res.add(`Document ${issues[0]} in ${c.department}`)
    }
    if (res.size === 0) res.add(`Resolve ${c.department} feedback`)
    return Array.from(res)
  })
  const steps = Array.from(new Set(allSteps.flat())).slice(0, 8)

  return NextResponse.json({ comments, steps })
}
