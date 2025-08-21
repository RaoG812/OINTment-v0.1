// @ts-nocheck
import { NextResponse } from 'next/server'
import { suggestFixes } from '../../../../lib/openai'

export async function POST(req: Request) {
  try {
    const { files } = await req.json()
    const suggestions = await suggestFixes(Array.isArray(files) ? files : [])
    return NextResponse.json({ suggestions })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'fix suggestions failed' },
      { status: 500 }
    )
  }
}
