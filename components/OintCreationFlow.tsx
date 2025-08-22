'use client'
import { useEffect, useState } from 'react'

export function OintCreationFlow({ docs, repo, roast }: { docs: number; repo: boolean; roast: boolean }) {
  const aspects = [
    { key: 'docs', label: 'DOX', pct: Math.round((docs / 5) * 100), color: '#f97316', comment: docs > 0 ? `${docs}/5 docs uploaded` : 'No docs uploaded' },
    { key: 'repo', label: 'Repo Data', pct: repo ? 100 : 0, color: '#0ea5e9', comment: repo ? 'Repository analyzed' : 'Repo not analyzed' },
    { key: 'roast', label: 'Roast Results', pct: roast ? 100 : 0, color: '#22c55e', comment: roast ? 'Roaster run complete' : 'Roast not run' }
  ]
  const positions = [
    { x: 250, y: 40 },
    { x: 40, y: 260 },
    { x: 260, y: 260 }
  ]
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % aspects.length), 4000)
    return () => clearInterval(id)
  }, [aspects.length])

  const totalPct = Math.round(aspects.reduce((s, a) => s + a.pct, 0) / aspects.length)

  return (
    <div className="relative w-[300px] h-[300px]">
      <svg className="absolute inset-0" viewBox="0 0 300 300">
        {positions.map((p, i) => (
          <line key={i} x1="150" y1="150" x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
        ))}
      </svg>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500" />
          <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#10b981 ${totalPct}%, transparent 0)` }} />
          <div className="absolute inset-4 bg-black rounded-full flex items-center justify-center text-lg font-semibold">
            {totalPct}%
          </div>
        </div>
      </div>
      {aspects.map((a, i) => {
        const p = positions[i]
        const active = i === idx
        return (
          <div
            key={a.key}
            className="absolute text-center"
            style={{ left: p.x, top: p.y, transform: 'translate(-50%, -50%)' }}
            onClick={() => setIdx(i)}
          >
            <div
              className={`relative w-20 h-20 rounded-full flex items-center justify-center border-4 ${active ? 'border-dashed' : ''}`}
              style={{ borderColor: a.color }}
            >
              <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${a.color} ${a.pct}%, transparent 0)` }} />
              <div className="absolute inset-1 bg-black rounded-full flex items-center justify-center text-sm">{a.pct}%</div>
            </div>
            <div className="mt-1 text-xs">{a.label}</div>
          </div>
        )
      })}
    </div>
  )
}
