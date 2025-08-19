'use client'
import * as React from 'react'
import { useMemo, useState } from 'react'
import Image from 'next/image'
import { ArrowUpDown, Search, ShieldAlert, Cpu } from 'lucide-react'

// Minimal shadcn pieces (replace with imported components in real app)
function Card({children}:{children:React.ReactNode}){return <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl p-4 backdrop-blur-sm">{children}</div>}
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
  const readiness = useMemo(()=>{
    const totals = rows.map(r => (r.impact + r.security + r.ops + r.health + r.coupling + r.upgrade) / 6)
    return totals.reduce((a,b)=>a+b,0) / (totals.length || 1)
  },[rows])
  const weeksRemaining = Math.round(12 * (1 - readiness/100))

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

        <div className="grid md:grid-cols-4 gap-4">
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
          <Card>
            <div className="text-sm font-semibold mb-2">Timeline</div>
            <div className="text-xs text-zinc-400 mb-2">{weeksRemaining} weeks remaining</div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{width: `${readiness.toFixed(0)}%`}} />
            </div>
            <div className="mt-1 text-[10px] text-right text-zinc-500">Readiness {readiness.toFixed(0)}%</div>
          </Card>
        </div>
      </div>
    </div>
  )
}
