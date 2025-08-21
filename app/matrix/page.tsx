// @ts-nocheck
'use client'
import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { ArrowUpDown, Search, ShieldAlert, Cpu } from 'lucide-react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)
const Pie = dynamic(() => import('react-chartjs-2').then(m => m.Pie), { ssr: false })

// Minimal shadcn pieces (replace with imported components in real app)
function Card({children}:{children:React.ReactNode}){return <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl p-4 backdrop-blur-sm">{children}</div>}
function Pill({children}:{children:React.ReactNode}){return <span className="px-3 py-1 rounded-full text-xs bg-zinc-800/80 border border-zinc-700/80">{children}</span>}
function ExpandableCard({title,summary,children}:{title:string;summary:React.ReactNode;children:React.ReactNode}){
  const [open,setOpen] = useState(false)
  return (
    <Card>
      <div className="flex items-center justify-between cursor-pointer" onClick={()=>setOpen(o=>!o)}>
        <div className="text-sm font-semibold">{title}</div>
        <span className="text-xs text-zinc-400">{open? 'Hide':'Show'}</span>
      </div>
      <div className="text-xs text-zinc-400 mt-1">{summary}</div>
      {open && <div className="mt-2 text-xs text-zinc-400 space-y-1">{children}</div>}
    </Card>
  )
}

export type Row = {
  logoUrl?: string
  name: string
  category: string
  impact: number
  security: number
  ops: number
  health: number
  coupling: number
  upgrade: number
}

function scoreColor(v:number){
  if(v>=80) return 'text-emerald-400'
  if(v>=60) return 'text-amber-300'
  return 'text-rose-400'
}

const INDICATORS: Record<keyof Omit<Row,'logoUrl'|'name'|'category'>, { label: string; desc: string; improve: string }> = {
  impact: {
    label: 'Impact',
    desc: 'Criticality of the integration to core functionality.',
    improve: 'Increase alignment with product goals and add tests.'
  },
  security: {
    label: 'Security',
    desc: 'Exposure to vulnerabilities or insecure configs.',
    improve: 'Audit dependencies and apply security updates.'
  },
  ops: {
    label: 'Ops',
    desc: 'Operational overhead and runtime complexity.',
    improve: 'Automate setup and streamline deployment.'
  },
  health: {
    label: 'Health',
    desc: 'Community activity and maintenance cadence.',
    improve: 'Monitor releases and keep versions current.'
  },
  coupling: {
    label: 'Coupling',
    desc: 'How tightly the code depends on this integration.',
    improve: 'Isolate boundaries and reduce cross-module imports.'
  },
  upgrade: {
    label: 'Upgrade',
    desc: 'Difficulty of moving to the latest version.',
    improve: 'Pin versions and follow changelogs to plan upgrades.'
  }
}

export default function MatrixPage(){
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  useEffect(()=>{
    let active = true
    async function load(){
      try{
        const data = await fetch('/api/components').then(r=>r.json())
        if(active) setRows(data)
      }catch{
        if(active) setRows([])
      }
    }
    load()
    const id = setInterval(load,5000)
    return ()=>{active=false; clearInterval(id)}
  },[])
  const filtered = useMemo(()=>rows.filter(r=>
    r.name.includes(query) || r.category.toLowerCase().includes(query.toLowerCase())
  ),[rows,query])
  const [sortKey, setSortKey] = useState<keyof Row>('impact')
  const [asc, setAsc] = useState(false)
  const sorted = useMemo(()=>[...filtered].sort((a,b)=>{
    const d = (a[sortKey] as number)-(b[sortKey] as number)
    return asc? d : -d
  }),[filtered,sortKey,asc])
  const readiness = useMemo(()=>{
    const totals = rows.map(r => (r.impact + r.security + r.ops + r.health + r.coupling + r.upgrade) / 6)
    return totals.reduce((a,b)=>a+b,0) / (totals.length || 1)
  },[rows])
  const weeksRemaining = Math.round(12 * (1 - readiness/100))
  const [selected, setSelected] = useState<{row: Row; code: any[]}|null>(null)

  async function showDetails(r: Row){
    const code = await fetch(`/api/code/${encodeURIComponent(r.name)}`).then(res=>res.json()).catch(()=>[])
    setSelected({ row: r, code })
  }

  const categoryCounts = useMemo(()=>{
    const map: Record<string, number> = {}
    rows.forEach(r=>{ map[r.category]=(map[r.category]||0)+1 })
    return map
  },[rows])
  const pieData = useMemo(
    () => ({
      labels: Object.keys(categoryCounts),
      datasets: [
        {
          data: Object.values(categoryCounts),
          backgroundColor: ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#f472b6'],
          borderColor: 'transparent'
        }
      ]
    }),
    [categoryCounts]
  )

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
            {sorted.map(r => (
              <button
                type="button"
                key={r.name}
                onClick={() => showDetails(r)}
                className="grid w-full grid-cols-[auto_1fr_repeat(6,96px)] items-center gap-3 py-3 hover:bg-zinc-900/40 rounded-xl text-left cursor-pointer"
              >
                <div className="pl-2 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center">
                    {r.logoUrl ? (
                      <Image src={r.logoUrl} alt={r.name} width={18} height={18} />
                    ) : (
                      <Cpu className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>
                  <div className="text-sm text-zinc-200">{r.name}</div>
                </div>
                <div className="text-xs text-zinc-400"><Pill>{r.category}</Pill></div>
                {[r.impact, r.security, r.ops, r.health, r.coupling, r.upgrade].map((v, i) => (
                  <div key={i} className={`text-sm font-semibold tabular-nums ${scoreColor(v)} text-center`}>
                    {v}
                  </div>
                ))}
              </button>
            ))}
          </div>
        </Card>

        <div className="grid md:grid-cols-4 gap-4">
          <ExpandableCard title="Risk Highlights" summary={<span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4"/>2 pending actions</span>}>
            <div>• Upgrade redis to v7 – high</div>
            <div>• Audit supabase env vars – medium</div>
          </ExpandableCard>
          <ExpandableCard title="Coverage" summary="96% files scanned • 100% manifests parsed">
            <div>• 123/128 files scanned</div>
            <div>• 12 manifests parsed</div>
          </ExpandableCard>
          <ExpandableCard title="Timeline" summary={`${weeksRemaining} weeks remaining`}>
            <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${readiness}%` }}
              />
              <div
                className="absolute top-0 -translate-x-1/2"
                style={{ left: `${readiness}%` }}
              >
                <div className="w-px h-2 bg-emerald-400" />
                <div className="text-[10px] text-emerald-400 mt-1 animate-pulse">WE ARE HERE</div>
              </div>
            </div>
            <div className="mt-1 text-[10px] text-right text-zinc-500">
              Readiness {readiness.toFixed(0)}%
            </div>
            <div className="mt-1 text-[10px] text-zinc-400">
              Estimate based on average integration readiness across the project
            </div>
          </ExpandableCard>
          <Card>
            <div className="text-sm font-semibold mb-2">Category Breakdown</div>
            {Object.keys(categoryCounts).length > 0 ? (
              <Pie data={pieData} options={{ plugins: { legend: { display: false } } }} />
            ) : (
              <div className="text-xs text-zinc-400">No data</div>
            )}
          </Card>
        </div>

        {selected && (
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-2">{selected.row.name}</h2>
                <div className="grid md:grid-cols-2 gap-4 text-xs text-zinc-400">
                  {(Object.keys(INDICATORS) as Array<keyof typeof INDICATORS>).map(key => {
                    const info = INDICATORS[key]
                    const value = selected.row[key as keyof Row] as number
                    return (
                      <div key={key}>
                        <div className="font-medium text-zinc-200 mb-1">{info.label}: <span className={`ml-1 ${scoreColor(value)} font-semibold`}>{value}</span></div>
                        <div>{info.desc}</div>
                        {value < 100 && <div className="text-emerald-400 mt-1">{info.improve}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
              <button className="text-zinc-500 hover:text-zinc-300" onClick={()=>setSelected(null)}>×</button>
            </div>
            <div className="mt-4">
              <div className="text-sm font-semibold mb-2">Code References</div>
              <pre className="text-xs bg-zinc-900 p-3 rounded-lg max-h-60 overflow-auto">
                {selected.code.map((c,i)=>`${c.file}:${c.line} ${c.code}`).join('\n') || 'No references found'}
              </pre>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
