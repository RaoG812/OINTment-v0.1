// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import AdmZip from 'adm-zip'
import { summarizeRepo } from '../../../lib/openai'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const repo = form.get('repo')
  const branch = form.get('branch') || 'main'
  let buffer: Buffer

  if (typeof repo === 'string' && repo) {
    const url = `https://codeload.github.com/${repo}/zip/${branch}`
    const res = await fetch(url)
    if (!res.ok) {
      return NextResponse.json({ error: 'failed to fetch repo' }, { status: 500 })
    }
    buffer = Buffer.from(await res.arrayBuffer())
  } else {
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file field required' }, { status: 400 })
    }
    buffer = Buffer.from(await file.arrayBuffer())
  }
  const zip = new AdmZip(buffer)
  const allEntries = zip.getEntries()
  const files = allEntries.filter(e => !e.isDirectory).map(e => e.entryName)

  try {
    const analysis = await summarizeRepo(files)
    return NextResponse.json({ files, analysis })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'analysis failed'
    console.error('analysis failed', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
