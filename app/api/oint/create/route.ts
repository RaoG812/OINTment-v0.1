import { NextResponse } from 'next/server'
import { markCreated } from '../state'

export async function POST(req: Request) {
  const form = await req.formData()
  const docs = form.getAll('docs') as File[]
  const filesField = form.get('files')?.toString() || '[]'
  let repoFiles: string[] = []
  try {
    const parsed = JSON.parse(filesField)
    if (Array.isArray(parsed)) repoFiles = parsed
  } catch {}
  const hasVuln = form.get('hasVuln') === 'true'

  const parsedDocs = await Promise.all(
    docs.map(async d => ({ name: d.name, text: await d.text() }))
  )

  if (parsedDocs.length === 0) {
    return NextResponse.json({ error: 'at least one doc required for OINT' }, { status: 400 })
  }

  if (parsedDocs.length > 5 || repoFiles.length === 0) {
    return NextResponse.json({ error: 'insufficient data for OINT' }, { status: 400 })
  }

  const hasFinance = parsedDocs.some(d =>
    /fin|budget|cost|expense/i.test(d.name + d.text)
  )

  markCreated(parsedDocs, repoFiles, hasVuln, hasFinance)

  return NextResponse.json({ status: 'created' })
}
