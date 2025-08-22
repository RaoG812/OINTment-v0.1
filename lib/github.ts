import { NextRequest } from 'next/server'

export function githubHeaders(req: NextRequest): HeadersInit {
  const headers: HeadersInit = { Accept: 'application/vnd.github+json' }
  const token =
    req.headers.get('x-github-token') ||
    req.cookies.get('github_token')?.value ||
    process.env.GITHUB_TOKEN
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}
