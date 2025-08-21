// @ts-nocheck
import { NextResponse } from 'next/server'
import { roastRepo } from '../../../lib/openai'

export async function POST(req: Request) {
  try {
    const { files } = await req.json()
    const comments = await roastRepo(Array.isArray(files) ? files : [])
    return NextResponse.json({ comments })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'roaster failed' }, { status: 500 })
  }
}
