// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { categorizeCommits, jitterOffsets } from '../../../../lib/openai'
import { githubHeaders } from '../../../../lib/github'

const typeBuckets = ['feature', 'fix', 'infra', 'refactor', 'test', 'docs', 'security', 'data']
const domainBuckets = ['frontend', 'backend', 'db', 'other']

function guessType(message = '') {
  const msg = message.toLowerCase()
  if (/(fix|bug|issue|error)/.test(msg)) return 'fix'
  if (/(feat|feature|add|implement)/.test(msg)) return 'feature'
  if (/(refactor|cleanup|rewrite)/.test(msg)) return 'refactor'
  if (/(test|spec|unit|integration)/.test(msg)) return 'test'
  if (/(doc|readme|documentation)/.test(msg)) return 'docs'
  if (/(infra|deploy|ci|build)/.test(msg)) return 'infra'
  if (/(security|auth|vuln|attack)/.test(msg)) return 'security'
  if (/(data|dataset|analytics)/.test(msg)) return 'data'
  return null
}

function guessDomain(message = '', files: string[] = []) {
  const msg = message.toLowerCase()
  if (
    files.some(f => /\.(tsx|ts|jsx|js|css|scss|html|vue|svelte)/i.test(f)) ||
    /(ui|frontend|client|css|react|component)/.test(msg)
  )
    return 'frontend'
  if (files.some(f => /(db|sql|schema|migrations?)/i.test(f)) || /(db|database|schema|migration)/.test(msg))
    return 'db'
  if (files.some(f => /\.env/i.test(f)) || /(env|config)/.test(msg)) return 'other'
  return null
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const repo = searchParams.get('repo')
  let branch = searchParams.get('branch') || ''
  if (!branch && repo) {
    try {
      const infoRes = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: githubHeaders(req)
      })
      if (infoRes.ok) {
        const info = await infoRes.json()
        branch = info.default_branch || 'main'
      }
    } catch {
      branch = 'main'
    }
  }
  if (!branch) branch = 'main'
  if (!repo) {
    return NextResponse.json({ error: 'repo required' }, { status: 400 })
  }

  const commitsRes = await fetch(
    `https://api.github.com/repos/${repo}/commits?sha=${branch}`,
    { headers: githubHeaders(req) }
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
      let files: string[] = []
      try {
        const [statusRes, detailRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${repo}/commits/${c.sha}/status`, {
            headers: githubHeaders(req)
          }).catch(() => null),
          fetch(`https://api.github.com/repos/${repo}/commits/${c.sha}`, {
            headers: githubHeaders(req)
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
          files = detail.files?.map((f: any) => f.filename) || []
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
        status,
        files
      }
    })
  )

  // Ask the LLM to classify commit messages into domain and type buckets
  try {
    const cats = await categorizeCommits(rawList.map(c => c.message))
    cats.forEach((c, i) => {
      const msg = rawList[i].message
      const filenames = rawList[i].files || []
      let t = c.type
      if (!typeBuckets.includes(t)) t = guessType(msg)
      if (!t)
        t = typeBuckets[parseInt(rawList[i].sha.slice(-1), 16) % typeBuckets.length]
      let d = c.domain
      if (!domainBuckets.includes(d)) d = guessDomain(msg, filenames)
      if (!d)
        d = domainBuckets[parseInt(rawList[i].sha.slice(-2), 16) % domainBuckets.length]
      rawList[i].domain = d
      rawList[i].type = t
    })
  } catch {
    rawList.forEach(r => {
      const msg = r.message
      const filenames = r.files || []
      let t = guessType(msg)
      let d = guessDomain(msg, filenames)
      const idx = parseInt(r.sha.slice(-1), 16)
      if (!t) t = typeBuckets[idx % typeBuckets.length]
      const idx2 = parseInt(r.sha.slice(-2), 16)
      if (!d) d = domainBuckets[idx2 % domainBuckets.length]
      r.type = t
      r.domain = d
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

  // remove temporary file lists before sending to client
  rawList.forEach(r => delete r.files)

  rawList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return NextResponse.json(rawList)
}

