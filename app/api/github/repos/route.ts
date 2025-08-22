// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { githubHeaders } from '../../../../lib/github'

export async function GET(req: NextRequest) {
  try {
    const res = await fetch('https://api.github.com/user/repos', {
      headers: githubHeaders(req)
    })
    if (res.status === 401) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    if (!res.ok) {
      return NextResponse.json({ error: 'failed' }, { status: res.status })
    }
    const data = await res.json()
    const repos = Array.isArray(data) ? data.map((r: any) => ({ name: r.full_name })) : []
    return NextResponse.json(repos)
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
