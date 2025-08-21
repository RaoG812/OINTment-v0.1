// @ts-nocheck
import { NextResponse } from 'next/server'
import { roastRepo } from '../../../lib/openai'

export async function POST(req: Request) {
  try {
    const { files, level = 0.5 } = await req.json()
    const comments = await roastRepo(Array.isArray(files) ? files : [], level)
    return NextResponse.json({ comments })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'roaster failed' }, { status: 500 })
  }
}
