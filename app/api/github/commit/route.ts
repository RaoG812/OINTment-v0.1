// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { githubHeaders } from '../../../../lib/github'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const repo = searchParams.get('repo')
  const sha = searchParams.get('sha')
  if (!repo || !sha) {
    return NextResponse.json({ error: 'repo and sha required' }, { status: 400 })
  }
  const res = await fetch(`https://api.github.com/repos/${repo}/commits/${sha}`, {
    headers: githubHeaders(req)
  })
  if (!res.ok) {
    return NextResponse.json({ error: 'github fetch failed' }, { status: res.status })
  }
  const data = await res.json()
  const files = Array.isArray(data.files)
    ? data.files.map((f: any) => ({ filename: f.filename, status: f.status, additions: f.additions, deletions: f.deletions, patch: f.patch }))
    : []
  return NextResponse.json({ files })
}
