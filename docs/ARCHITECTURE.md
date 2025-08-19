# PM Control Suite — Architecture, Data Model, and Starter UI

A platform for project managers joining a project mid-stream that turns a GitHub repository into an actionable, trustworthy control panel: integrations discovered, risks, ownership, and consistency — all with a sleek, contemporary UI.

## 1. Product Vision
- **Goal**: Give PMs a fast, trustworthy overview of any repo: what it uses, why, where, how risky/critical each integration is, and what to do next.
- **North Stars**:
  - Trust-by-evidence: every claim ties to file+line+commit.
  - Matrix-first UX: a single Integration Matrix with drill‑downs.
  - Automated "Check Grid": parallel analysis jobs (static+LLM) produce structured, repeatable results.
  - Design language: calm dark mode, soft gradients, micro‑interactions, minimal chrome.

## 2. High-Level Architecture
```
flowchart LR
  A[GitHub Repo URL] -->|Webhook/Manual| B[Ingestor]
  B --> C[Artifact Extractor]
  C --> D[Static Analyzers]
  C --> E[Embeddings & Index]
  D --> F[Check Grid Orchestrator]
  E --> F
  F --> G[GPT-5 Analysis Workers]
  F --> H[Deterministic Checks]
  G --> I[Finding & Evidence Store]
  H --> I
  I --> J[Scoring & Matrix Engine]
  J --> K[UI API]
  K --> L[Next.js UI]
```

### Key modules
- **Ingestor**: clones repo (read-only) or uses GitHub API; schedules a Scan.
- **Artifact Extractor**: parses manifests (package.json, pnpm-lock.yaml, requirements.txt, go.mod, Dockerfiles, Terraform, GitHub Actions) + README/docs.
- **Static Analyzers**: AST + pattern scans (Semgrep, bespoke parsers), SBOM generation (CycloneDX), OSV vulnerability mapping.
- **Embeddings & Index**: chunked code/docs into vector DB (per-commit namespace) to allow narrow LLM contexts.
- **Check Grid Orchestrator**: queues granular checks per Element (integration, service, subsystem, workflow). Parallelizes with idempotent jobs; retries on failure.
- **GPT-5 Analysis Workers**: structured JSON outputs only, with “required evidence” policy (file path + line ranges + snippet SHA).
- **Deterministic Checks**: non-LLM verifications (license, version conflicts, secret detectors, CI drift, env var usage).
- **Scoring & Matrix Engine**: computes Impact, Risk, Consistency, Maturity; produces a normalized Integration Matrix and Repo Overview.

## 3. Integration Matrix — Taxonomy & Scoring
### Taxonomy (default categories)
- Core Runtime (node, python, go, tsconfig)
- Frameworks/Libs (nextjs, express, react, zod, prisma, tailwind)
- Infra & DevOps (docker, k8s, terraform, gh-actions)
- Data & Storage (postgres, supabase, redis, s3/minio)
- Auth & Identity (next-auth, clerk, auth0)
- Payments & Billing (stripe, braintree)
- Observability (sentry, datadog, opentelemetry)
- ML/AI (openai sdk, huggingface, vllm)
- Security (helmet, rate limiters, jwt, semgrep rules)
- Comms (twilio, sendgrid, nodemailer)

### Per-Integration Signals
- Impact: {Core, High, Medium, Low}
- Surface Area: code refs count, entrypoints touched
- Operational Complexity: env vars, services, infra prerequisites
- Security Exposure: secret usage, scopes, network egress
- License Risk: license type + policy fit
- Health: maintainer activity, release cadence, pinned version vs latest (w/ policy)
- Upgrade Risk: breaking-change notes, semver delta
- Coupling: dependency graph centrality
- Evidence: file/line/commit links

Score (0–100) = w1*Impact + w2*Security + w3*Health + w4*Ops + w5*Coupling + w6*UpgradeRisk with policy-tunable weights.

## 4. Reliability Protocol (Trust-by-Evidence)
- Evidence-first prompts: LLM must cite sources (file paths + line ranges + snippet hash). No evidence ⇒ result rejected.
- Dual-path agreement: LLM path (temp=0) must match deterministic scans (AST/SBOM/lockfiles). Disagreements → “Needs Review.”
- Self-consistency: 3 independent LLM runs with different seeds; accept only overlapping claims; minority reports logged.
- Traceability Ledger: Every claim ties to commit SHA + artifact hashes. UI shows “hover to reveal snippet.”
- Policy gates: Block decisions if coverage < threshold (e.g., <95% of repo chunks embedded/scanned).
- Reproducibility: Same commit re-run → same results (deterministic chunking, prompts, and seeds recorded).

## 5. Data Model (Postgres / Supabase)
```sql
create table repos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  default_branch text,
  created_at timestamptz default now()
);

create table scans (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid references repos(id),
  commit_sha text not null,
  status text check (status in ('queued','running','failed','complete')),
  started_at timestamptz, finished_at timestamptz
);

create table elements (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid references scans(id),
  kind text,        -- integration | service | workflow | package | infra
  name text,        -- e.g., "next-auth", "postgres"
  category text,    -- taxonomy bucket
  homepage text,    -- resolved from manifest metadata
  logo_url text,    -- resolved favicon/minified logo
  uniqueness_hash text
);

create table evidence (
  id uuid primary key default gen_random_uuid(),
  element_id uuid references elements(id),
  file_path text,
  start_line int,
  end_line int,
  snippet_sha text,
  commit_sha text
);

create table findings (
  id uuid primary key default gen_random_uuid(),
  element_id uuid references elements(id),
  source text,       -- 'llm' | 'static' | 'osv' | 'license' | 'ci'
  kind text,         -- 'risk' | 'inference' | 'metric'
  key text,          -- e.g., 'license', 'version_mismatch'
  value jsonb,
  confidence numeric check (confidence between 0 and 1)
);

create table scores (
  id uuid primary key default gen_random_uuid(),
  element_id uuid references elements(id),
  impact int,
  security int,
  ops int,
  health int,
  coupling int,
  upgrade_risk int,
  total int,
  rubric jsonb
);

create table actions (
  id uuid primary key default gen_random_uuid(),
  element_id uuid references elements(id),
  title text,
  severity text check (severity in ('low','medium','high','critical')),
  rationale text,
  created_at timestamptz default now()
);
```

## 6. Logo/Favicon Resolution
- Extract homepage / repository domain from package metadata (npm homepage, PyPI project_urls, etc.).
- Try in order:
  1. `https://{domain}/favicon.ico`
  2. `https://{domain}/apple-touch-icon.png`
  3. Public logo endpoints (configurable), with caching/proxying via `/api/logo?domain=…` to avoid mixed content and rate limits.
- Cache in object storage; store URL on `elements.logo_url`.

## 7. The "Check Grid" — Parallel Analysis Plan
Granularity: one job per (element × check-kind).

### Default checks per element
- Presence & Wiring: imports/usage sites, init order, providers, DI boundaries.
- Version & License: lockfile vs current; SPDX mapping; policy fit.
- Security: secret usage, scope, OSV advisories.
- Config Consistency: env vars declared vs used; CI parity vs runtime; tsconfig/browserslist alignment.
- Operational Footprint: required services, migrations, cron/queues, health checks.
- Upgrade Path: breaking changes from current→latest; deprecations.

### Execution model
- **Queue**: Redis/BullMQ (Upstash-ready) with concurrency per worker pool.
- **Inputs**: `(commit_sha, element_id, file shards, vector hits)`.
- **Outputs**: strictly typed JSON (see schemas below). Idempotent (same inputs ⇒ same outputs).

## 8. Structured Output Schemas
```ts
// Element summary
export type ElementSummary = {
  elementId: string
  name: string
  category: string
  version?: string
  homepage?: string
  logoUrl?: string
  evidence: Array<{ filePath:string; startLine:number; endLine:number; snippetSha:string; commitSha:string }>
};

// Finding (generic)
export type Finding = {
  elementId: string
  source: 'llm'|'static'|'osv'|'license'|'ci'
  kind: 'risk'|'metric'|'inference'
  key: string
  value: Record<string, any>
  confidence: number // 0..1
  evidenceRefs?: string[] // link to evidence rows
};

// Score
export type Score = {
  elementId: string
  impact: number
  security: number
  ops: number
  health: number
  coupling: number
  upgrade_risk: number
  total: number
  rubric: Record<string, any>
};
```
LLM must return one or more of the above structures, never free text.

## 9. Prompts (LLM worker) — Evidence-First, No Free-Text
**System**: You analyze a single integration in a code repo. Return only valid JSON matching the provided TypeScript types. Include evidence with exact file paths and line ranges. If uncertain, return empty arrays.

**User**: `{context: top K chunks (code/docs) + manifest excerpt + SBOM rows; element: {name, category, candidate files}}`

**Assistant**: `{ "element": ElementSummary, "findings": Finding[], "score": Score }`

Note: All reasoning happens internally; only structured output is recorded.

## 10. API Surface (Next.js App Router)
- `POST /api/scan`   `{ repoUrl: string, branch?: string }`
- `GET  /api/scan/:id`
- `GET  /api/repo/:id/matrix`
- `GET  /api/elements/:id`
- `GET  /api/logo?domain=example.com`

**Security**: signed user sessions; row-level security in Supabase; per-repo access control.

## 11. Contemporary UI — Screens & Interactions
### Design notes
- Dark base, soft cards, rounded-2xl, subtle blur, 60–90fps interactions, keyboardable.
- Visual identity: small favicons/minified logos per integration; tag chips; hover details.

### Screens
- Repo Overview: commit, branch, scan status, coverage %, risk heatmap.
- Integration Matrix: rows=integrations, columns=[Impact, Risk, Health, Ops, Coupling, Upgrade], sticky headers, quick filters.
- Element Detail: logo, summary, score sparkline, evidence browser with inline code snippets.
- Consistency Checks: version drift, env var issues, CI misalignments, secret findings.
- Actions/Decisions: prioritized todo list with rationales and one-click export.

## 12. Starter UI (React + Tailwind + shadcn/ui)
Drop this into a Next.js 14 project with Tailwind and shadcn/ui installed. It renders a sleek Integration Matrix with sample data and logo avatars.

```tsx
// app/matrix/page.tsx
'use client'
import * as React from 'react'
import { useMemo, useState } from 'react'
import Image from 'next/image'
import { ArrowUpDown, Search, ShieldAlert, Cpu } from 'lucide-react'

// Minimal shadcn pieces (replace with imported components in real app)
function Card({children}:{children:React.ReactNode}){return <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl p-4 backdrop-blur-sm">{children}</div>}
function Badge({children}:{children:React.ReactNode}){return <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 border border-zinc-700">{children}</span>}
function Pill({children}:{children:React.ReactNode}){return <span className="px-3 py-1 rounded-full text-xs bg-zinc-800/80 border border-zinc-700/80">{children}</span>}

export type Row = {
  logoUrl?: string
  name: string
  category: string
  impact: number // 0..100
  security: number
  ops: number
  health: number
  coupling: number
  upgrade: number
}

const SAMPLE: Row[] = [
  { logoUrl:'/logos/nextjs.svg', name:'nextjs', category:'Frameworks/Libs', impact:92, security:70, ops:50, health:85, coupling:68, upgrade:40 },
  { logoUrl:'/logos/supabase.svg', name:'supabase', category:'Data & Storage', impact:80, security:75, ops:60, health:78, coupling:50, upgrade:60 },
  { logoUrl:'/logos/redis.svg', name:'redis', category:'Data & Storage', impact:76, security:65, ops:55, health:83, coupling:45, upgrade:50 },
  { logoUrl:'/logos/sentry.svg', name:'sentry', category:'Observability', impact:62, security:72, ops:40, health:88, coupling:30, upgrade:70 },
]

function scoreColor(v:number){
  if(v>=80) return 'text-emerald-400'
  if(v>=60) return 'text-amber-300'
  return 'text-rose-400'
}

export default function MatrixPage(){
  const [query, setQuery] = useState('')
  const rows = useMemo(()=>SAMPLE.filter(r=>
    r.name.includes(query) || r.category.toLowerCase().includes(query.toLowerCase())
  ),[query])
  const [sortKey, setSortKey] = useState<keyof Row>('impact')
  const [asc, setAsc] = useState(false)
  const sorted = useMemo(()=>[...rows].sort((a,b)=>{
    const d = (a[sortKey] as number)-(b[sortKey] as number)
    return asc? d : -d
  }),[rows,sortKey,asc])

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-200">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Integration Matrix</h1>
            <p className="text-sm text-zinc-400">Evidence-backed snapshot of repo integrations</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search integrations…" className="pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"/>
              <Search className="w-4 h-4 absolute left-2 top-2.5 text-zinc-500"/>
            </div>
          </div>
        </div>

        <Card>
          <div className="grid grid-cols-[auto_1fr_repeat(6,96px)] items-center gap-3 text-xs font-medium text-zinc-400 pb-2 border-b border-zinc-800">
            <div className="pl-2">Integration</div>
            <div>Category</div>
            {['Impact','Security','Ops','Health','Coupling','Upgrade'].map(k=>
              <button key={k} onClick={()=>{setSortKey(k.toLowerCase() as keyof Row); setAsc(s=>!s)}} className="flex items-center gap-1 hover:text-zinc-200 transition">
                <ArrowUpDown className="w-3 h-3"/>{k}
              </button>
            )}
          </div>
          <div className="divide-y divide-zinc-900/60">
            {sorted.map((r)=> (
              <div key={r.name} className="grid grid-cols-[auto_1fr_repeat(6,96px)] items-center gap-3 py-3 hover:bg-zinc-900/40 rounded-xl">
                <div className="pl-2 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center">
                    {r.logoUrl? <Image src={r.logoUrl} alt={r.name} width={18} height={18}/> : <Cpu className="w-4 h-4 text-zinc-500"/>}
                  </div>
                  <div className="text-sm text-zinc-200">{r.name}</div>
                </div>
                <div className="text-xs text-zinc-400"><Pill>{r.category}</Pill></div>
                {[r.impact, r.security, r.ops, r.health, r.coupling, r.upgrade].map((v,i)=>
                  <div key={i} className={`text-sm font-semibold tabular-nums ${scoreColor(v)} text-center`}>{v}</div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <div className="text-sm font-semibold mb-2">Risk Highlights</div>
            <div className="text-xs text-zinc-400 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> 2 pending actions</div>
          </Card>
          <Card>
            <div className="text-sm font-semibold mb-2">Coverage</div>
            <div className="text-xs text-zinc-400">96% files scanned • 100% manifests parsed</div>
          </Card>
          <Card>
            <div className="text-sm font-semibold mb-2">Last Scan</div>
            <div className="text-xs text-zinc-400">commit abc123 • 14m ago</div>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

## 13. Backend Sketch (API + Queue)
### /api/scan (POST)
- Validate repoUrl.
- Create repo, scan; enqueue ingest:scan job.

### Worker steps
- Clone at commit_sha (or resolve HEAD).
- Generate SBOM (CycloneDX), parse lockfiles, extract manifests.
- Discover candidate elements (integrations) with rules + SBOM.
- For each element, schedule Check Grid jobs: presence, license, security, config, ops, upgrade.
- For each job:
  - Gather deterministic data + top‑K chunks.
  - Call LLM (if applicable); validate JSON; attach evidence; compute scores.
  - Aggregate → scores, actions; finalize scan.

Queue tech: BullMQ on Upstash Redis with concurrency controls; job dedupe by `(scan_id, element_id, check_kind)`.

## 14. Consistency & Drift Checks (Deterministic Set)
- Version drift: lockfile vs package.json ranges; multi-package workspaces alignment.
- Env var map: declared (.env.example, schema) vs referenced in code; required but missing.
- CI parity: scripts in package.json vs gh-actions; test/build commands mismatch.
- Type safety: TS strictness, any usage hotspots.
- Secret detectors: common token regexes with entropy gating.
- Dead code: import graph reachability.

All produce Findings with confidence and Evidence.

## 15. Export & Collaboration
- Exports: CSV/XLSX of Matrix and Actions; PDF brief; “Attach evidence” option.
- Share links: short-lived signed URLs per scan.
- Commenting: per element/action with @mentions (optional v2).

## 16. Implementation Plan (Milestones)
- **M0 — Bootstrap**: Next.js app, Supabase schema, auth, shadcn, dark theme.
- **M1 — Ingest & SBOM**: clone/API, SBOM + lockfile parsers, element discovery, favicon proxy.
- **M2 — Check Grid**: Redis queue, deterministic checks, LLM worker (JSON-only, evidence-first).
- **M3 — Matrix UI**: initial Matrix, detail view with evidence browser, filters.
- **M4 — Scoring & Actions**: configurable rubrics, priorities, exports.
- **M5 — Reliability**: self-consistency runs, agreement rules, coverage gates, replay.

## 17. Styling & Motion Notes
- Interactions: hover-elevate cards (y=2px), subtle shadow bloom; focus-visible rings.
- Reduce layout shift; prefer transform over layout changes.
- Use GPU‑friendly CSS (translate/opacity), avoid heavy blurs on large panes.

## 18. Future Extensions
- Multi‑repo portfolio view with trend lines.
- Live policy guardrails: block PR merges for high‑severity drifts.
- Risk forecasts: time‑to‑upgrade simulations.
- Knowledge pack: curated integration notes per vertical (e.g., Next.js SaaS baseline).

## 19. Notes for Your Stack
- First-class support for Vercel (UI/API) + Supabase (DB/auth/storage) + Upstash Redis (queue). All serverless-friendly.
- Optional Supabase Edge Functions for longer tasks; or a small Render/Fly.io worker for Check Grid.

*This document includes: end-to-end architecture, data model, reliability protocol, UI starter, and execution plan to build an apex PM control suite.*

