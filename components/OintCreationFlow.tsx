'use client'
import { useEffect, useState } from 'react'

export function OintCreationFlow({ docs, repo, roast }: { docs: number; repo: boolean; roast: boolean }) {
  const aspects = [
    {
      key: 'docs',
      label: 'DOX',
      pct: Math.round((docs / 5) * 100),
      comment: docs > 0 ? `${docs}/5 docs uploaded` : 'No docs uploaded'
    },
    {
      key: 'repo',
      label: 'Repo Data',
      pct: repo ? 100 : 0,
      comment: repo ? 'Repository analyzed' : 'Repo not analyzed'
    },
    {
      key: 'roast',
      label: 'Roast Results',
      pct: roast ? 100 : 0,
      comment: roast ? 'Roaster run complete' : 'Roast not run'
    }
  ]
  const angles = [0, 120, 240]
  const [autoIdx, setAutoIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const active = selected ?? autoIdx

  useEffect(() => {
    if (selected !== null) return
    const id = setInterval(() => setAutoIdx(i => (i + 1) % aspects.length), 4000)
    return () => clearInterval(id)
  }, [selected, aspects.length])

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-64">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-emerald-400" />
        <div
          className="absolute inset-0 transition-transform duration-700"
          style={{ transform: `rotate(${-angles[active]}deg)` }}
        >
          {aspects.map((a, i) => {
            const angle = (angles[i] * Math.PI) / 180
            const x = 80 * Math.cos(angle)
            const y = 80 * Math.sin(angle)
            const isActive = i === active
            return (
              <div
                key={a.key}
                className="absolute cursor-pointer transition-transform duration-700"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: `translate(-50%, -50%) scale(${isActive ? 1.2 : 1})`
                }}
                onClick={() => setSelected(i)}
              >
                <div
                  className={`relative w-16 h-16 rounded-full flex items-center justify-center border-4 ${isActive ? 'border-emerald-400 border-dashed' : 'border-zinc-700'}`}
                >
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: `conic-gradient(#10b981 ${a.pct}%, transparent 0)` }}
                  />
                  <div className="absolute inset-1 bg-black rounded-full flex items-center justify-center text-xs">
                    {a.pct}%
                  </div>
                </div>
                <div className="mt-1 text-center text-xs">{a.label}</div>
              </div>
            )
          })}
        </div>
      </div>
      <div
        key={active}
        className="mt-4 text-center text-sm opacity-0 animate-[fadeIn_0.5s_forwards]"
      >
        <div className="font-medium">{aspects[active].label}</div>
        <div className="text-zinc-400">{aspects[active].comment}</div>
      </div>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  )
}
