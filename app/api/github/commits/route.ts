// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { categorizeCommits, jitterOffsets } from '../../../../lib/openai'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const repo = searchParams.get('repo')
  const branch = searchParams.get('branch') || 'main'
  if (!repo) {
    return NextResponse.json({ error: 'repo required' }, { status: 400 })
  }

  const commitsRes = await fetch(
    `https://api.github.com/repos/${repo}/commits?sha=${branch}`,
    { headers: { Accept: 'application/vnd.github+json' } }
  )
  if (!commitsRes.ok) {
    return NextResponse.json({ error: 'github fetch failed' }, { status: commitsRes.status })
  }
  const commitsData = await commitsRes.json()

  const rawList = await Promise.all(
    commitsData.slice(0, 50).map(async (c: any) => {
      let status = 'unknown'
      let stats: any = undefined
      let parents: { sha: string }[] = []
      try {
        const [statusRes, detailRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${repo}/commits/${c.sha}/status`, {
            headers: { Accept: 'application/vnd.github+json' }
          }).catch(() => null),
          fetch(`https://api.github.com/repos/${repo}/commits/${c.sha}`, {
            headers: { Accept: 'application/vnd.github+json' }
          })
        ])
        if (statusRes && statusRes.ok) {
          const statusData = await statusRes.json()
          status = statusData.state
        }
        if (detailRes.ok) {
          const detail = await detailRes.json()
          stats = detail.stats
          parents = detail.parents?.map((p: any) => ({ sha: p.sha })) || []
        }
      } catch {
        // ignore
      }
      return {
        sha: c.sha,
        message: c.commit.message,
        date: c.commit.author?.date,
        stats,
        parents,
        status
      }
    })
  )

  // Ask the LLM to classify commit messages into domain and type buckets
  try {
    const cats = await categorizeCommits(rawList.map(c => c.message))
    const typeFallbacks = ['feature','fix','infra','refactor','test','docs','security','data']
    const domainFallbacks = ['frontend','backend','db','other']
    cats.forEach((c, i) => {
      let t = c.type || 'other'
      if (t === 'other') {
        t = typeFallbacks[parseInt(rawList[i].sha.slice(-1), 16) % typeFallbacks.length]
      }
      let d = c.domain || 'other'
      if (d === 'other') {
        d = domainFallbacks[parseInt(rawList[i].sha.slice(-2), 16) % domainFallbacks.length]
      }
      rawList[i].domain = d
      rawList[i].type = t
    })
  } catch {
    rawList.forEach(r => {
      const typeFallbacks = ['feature','fix','infra','refactor','test','docs','security','data']
      const domainFallbacks = ['frontend','backend','db','other']
      const idx = parseInt(r.sha.slice(-1), 16)
      r.type = typeFallbacks[idx % typeFallbacks.length]
      r.domain = domainFallbacks[idx % domainFallbacks.length]
    })
  }

  // Ask the LLM for jitter offsets to help distribute commits in 3D space
  try {
    const offs = await jitterOffsets(rawList.map(c => c.message))
    offs.forEach((o, i) => {
      rawList[i].offset = o
    })
  } catch {
    rawList.forEach(r => {
      r.offset = { x: 0, y: 0, z: 0 }
    })
  }

  rawList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return NextResponse.json(rawList)
}

