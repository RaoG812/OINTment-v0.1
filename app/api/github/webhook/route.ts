import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function verifySignature(req: NextRequest, payload: string) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret) return true
  const signature = req.headers.get('x-hub-signature-256')
  if (!signature) return false
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const digest = `sha256=${hmac.digest('hex')}`
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

export async function POST(req: NextRequest) {
  const payload = await req.text()
  if (!verifySignature(req, payload)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}
