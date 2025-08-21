// @ts-nocheck
import { NextResponse } from 'next/server';
import pkg from '../../../package.json';
import AdmZip from 'adm-zip';

type Row = {
  name: string;
  category: string;
  logoUrl: string;
  impact: number;
  security: number;
  ops: number;
  health: number;
  coupling: number;
  upgrade: number;
};

function categorize(name: string): string {
  const categories: Record<string, string> = {
    next: 'Frameworks/Libs',
    react: 'Frameworks/Libs',
    'react-dom': 'Frameworks/Libs',
    openai: 'ML/AI',
    'lucide-react': 'Frameworks/Libs',
    'adm-zip': 'Infra & DevOps',
  };
  return categories[name] || 'Frameworks/Libs';
}

function scores(name: string) {
  const core = ['next', 'react', 'react-dom'];
  const impact = core.includes(name) ? 90 : 60;
  const security = 70;
  const ops = 60;
  const health = 80;
  const coupling = core.includes(name) ? 70 : 50;
  const upgrade = 60;
  return { impact, security, ops, health, coupling, upgrade };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const repo = searchParams.get('repo')
  const branch = searchParams.get('branch') || 'main'

  let deps: string[] = []
  if (repo) {
    try {
      const url = `https://codeload.github.com/${repo}/zip/${branch}`
      const res = await fetch(url)
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer())
        const zip = new AdmZip(buffer)
        const pkgEntry = zip.getEntries().find(e => e.entryName.endsWith('package.json'))
        if (pkgEntry) {
          const parsed = JSON.parse(pkgEntry.getData().toString('utf-8'))
          deps = Object.keys(parsed.dependencies || {})
        }
      }
    } catch {
      deps = []
    }
  } else {
    deps = Object.keys(pkg.dependencies ?? {})
  }

  const rows: Row[] = []
  for (const dep of deps) {
    let homepage = ''
    try {
      const res = await fetch(`https://registry.npmjs.org/${dep}`)
      if (res.ok) {
        const data = await res.json()
        homepage = data.homepage || (data.repository && (typeof data.repository === 'string' ? data.repository : data.repository.url)) || ''
      }
    } catch {
      // ignore fetch failures
    }
    const match = homepage.match(/https?:\/\/([^/]+)/)
    const domain = match ? match[1] : 'npmjs.com'
    const logoUrl = `https://logo.clearbit.com/${domain}`
    const category = categorize(dep)
    const { impact, security, ops, health, coupling, upgrade } = scores(dep)
    rows.push({ name: dep, category, logoUrl, impact, security, ops, health, coupling, upgrade })
  }
  return NextResponse.json(rows)
}

