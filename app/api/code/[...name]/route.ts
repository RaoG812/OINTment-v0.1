// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'

export async function GET(
  req: NextRequest,
  { params }: { params: { name: string[] } }
) {
  const raw = Array.isArray(params.name) ? params.name.join('/') : params.name
  const base = raw.split(/[\\/@]/).pop() || raw
  const short = base.split('-')[0]
  const needles = Array.from(new Set([raw, base, short])).filter(Boolean)
  const pattern = needles
    .map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')

  const rg = spawn(
    'rg',
    [
      '-n',
      '--no-heading',
      '--color',
      'never',
      '-g',
      '!node_modules',
      '-g',
      '!.next',
      pattern
    ],
    { cwd: process.cwd() }
  )

  const results: { file: string; line: number; code: string }[] = []

  await new Promise<void>((resolve) => {
    rg.stdout.on('data', (chunk) => {
      const lines = chunk
        .toString()
        .split(/\r?\n/)
        .filter(Boolean)
      for (const line of lines) {
        const [file, lineno, code] = line.split(/:/)
        if (file && lineno && code) {
          results.push({
            file: file.replace(process.cwd() + '/', ''),
            line: Number(lineno),
            code: code.trim()
          })
        }
      }
    })
    rg.on('close', () => resolve())
  })

  return NextResponse.json(results.slice(0, 20))
}
