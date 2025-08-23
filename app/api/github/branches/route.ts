// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { categorizeCommits, jitterOffsets } from '../../../../lib/openai'
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
  let cats: { domain: string; type: string }[] = []
  try {
    const [offs, doms] = await Promise.all([
      jitterOffsets(names),
      categorizeCommits(names)
    ])
    offsets = offs
    cats = doms
  } catch {
    offsets = names.map(() => ({ x: 0, y: 0, z: 0 }))
    cats = names.map(n => ({ domain: guessDomainFromName(n), type: 'other' }))
  }
  const branches = names.map((name, i) => ({
    name,
    offset: offsets[i],
    domain: cats[i]?.domain || guessDomainFromName(name)
  }))
  return NextResponse.json(branches)
}

function guessDomainFromName(name: string) {
  const n = name.toLowerCase()
  if (/front|ui|client/.test(n)) return 'frontend'
  if (/back|api|server/.test(n)) return 'backend'
  if (/db|data|sql/.test(n)) return 'db'
  return 'other'
}

