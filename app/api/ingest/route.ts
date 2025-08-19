import { NextRequest, NextResponse } from 'next/server'
import AdmZip from 'adm-zip'
import { summarizeRepo } from '../../../lib/openai'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file field required' }, { status: 400 })
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  const zip = new AdmZip(buffer)
  const entries = zip.getEntries().map(e => e.entryName)
  const analysis = await summarizeRepo(entries)
  return NextResponse.json({ files: entries, analysis })
}
