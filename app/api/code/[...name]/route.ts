// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import AdmZip from 'adm-zip'

export async function GET(
  req: NextRequest,
  { params }: { params: { name: string[] } }
) {
  const raw = Array.isArray(params.name) ? params.name.join('/') : params.name
  const base = raw.split(/[\\/@]/).pop() || raw
  const short = base.split('-')[0]
  const needles = Array.from(new Set([raw, base, short])).filter(Boolean)
  const repo = req.nextUrl.searchParams.get('repo')
  const branch = req.nextUrl.searchParams.get('branch') || 'main'

  const pattern = new RegExp(needles.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'))

  const results: { file: string; line: number; code: string }[] = []

  if (repo) {
    try {
      const url = `https://codeload.github.com/${repo}/zip/${branch}`
      const res = await fetch(url)
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer())
        const zip = new AdmZip(buffer)
        for (const entry of zip.getEntries()) {
          if (entry.isDirectory) continue
          const content = entry.getData().toString('utf-8')
          const lines = content.split(/\r?\n/)
          lines.forEach((line, idx) => {
            if (pattern.test(line)) {
              results.push({ file: entry.entryName, line: idx + 1, code: line.trim() })
            }
          })
        }
      }
    } catch {
      /* ignore */
    }
  } else {
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
        pattern.source
      ],
      { cwd: process.cwd() }
    )

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
  }

  return NextResponse.json(results.slice(0, 20))
}
