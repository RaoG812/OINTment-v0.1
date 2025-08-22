// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { jitterOffsets } from '../../../../lib/openai'
import { githubHeaders } from '../../../../lib/github'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo');
  if (!repo) {
    return NextResponse.json({ error: 'repo required' }, { status: 400 });
  }
  const res = await fetch(`https://api.github.com/repos/${repo}/branches`, {
    headers: githubHeaders(req)
  })
  if (!res.ok) {
    // Return an empty array with 200 status so the client can handle missing repos gracefully
    return NextResponse.json([])
  }
  const data = await res.json()
  const names = Array.isArray(data) ? data.map((b: any) => b.name) : []
  let offsets: { x: number; y: number; z: number }[] = []
  try {
    offsets = await jitterOffsets(names)
  } catch {
    offsets = names.map(() => ({ x: 0, y: 0, z: 0 }))
  }
  const branches = names.map((name, i) => ({ name, offset: offsets[i] }))
  return NextResponse.json(branches)
}

