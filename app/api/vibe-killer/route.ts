// @ts-nocheck
import { NextResponse } from 'next/server'
import { detectAiArtifacts } from '../../../lib/openai'

export async function POST(req: Request) {
  try {
    const { files = [], commits = [] } = await req.json()
    const result = await detectAiArtifacts(
      Array.isArray(files) ? files : [],
      Array.isArray(commits) ? commits : []
    )
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'vibe killer failed' }, { status: 500 })
  }
}
