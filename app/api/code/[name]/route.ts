import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

async function search(dir: string, needle: string, out: any[]) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      await search(p, needle, out)
    } else if (/\.(ts|tsx|js|jsx|json)$/.test(entry.name)) {
      const content = await fs.readFile(p, 'utf8')
      const lines = content.split(/\r?\n/)
      lines.forEach((line, i) => {
        if (line.includes(needle)) {
          out.push({ file: path.relative(process.cwd(), p), line: i + 1, code: line.trim() })
        }
      })
    }
  }
}

export async function GET(_: Request, { params }: { params: { name: string } }) {
  const results: any[] = []
  await search(process.cwd(), params.name, results)
  return NextResponse.json(results.slice(0, 10))
}
