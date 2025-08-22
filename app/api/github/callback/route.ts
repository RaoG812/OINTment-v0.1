import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.json({ error: 'code required' }, { status: 400 })
  }
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'missing oauth env vars' }, { status: 500 })
  }
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
  })
  const data = await tokenRes.json()
  if (!tokenRes.ok || !data.access_token) {
    return NextResponse.json({ error: 'oauth exchange failed' }, { status: 500 })
  }
  const res = NextResponse.redirect('/')
  res.cookies.set('github_token', data.access_token, { httpOnly: true, secure: true, path: '/' })
  return res
}
