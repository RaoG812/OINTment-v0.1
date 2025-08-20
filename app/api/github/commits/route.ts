import { NextRequest, NextResponse } from 'next/server'
import { categorizeCommits } from '../../../../lib/openai'

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
    commitsData.slice(0, 20).map(async (c: any) => {
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
    cats.forEach((c, i) => {
      rawList[i].domain = c.domain || 'other'
      rawList[i].type = c.type || 'other'
    })
  } catch {
    rawList.forEach(r => {
      r.domain = 'other'
      r.type = 'other'
    })
  }

  rawList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return NextResponse.json(rawList)
}

