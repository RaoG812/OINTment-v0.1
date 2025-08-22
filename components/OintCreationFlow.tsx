'use client'
import { useEffect, useState } from 'react'

const CENTER = { x: 150, y: 150 }
const POSITIONS = [
  { x: 250, y: 40 },
  { x: 40, y: 260 },
  { x: 260, y: 260 }
]
const ANGLES = POSITIONS.map(p => Math.atan2(p.y - CENTER.y, p.x - CENTER.x) * 180 / Math.PI + 90)
const TRI_POINTS = POSITIONS.map(p => `${p.x},${p.y}`).join(' ')

export function OintCreationFlow({ docs, repo, roast }: { docs: number; repo: boolean; roast: boolean }) {
  const aspects = [
    {
      key: 'docs',
      label: 'DOX',
      pct: Math.round((docs / 5) * 100),
      color: '#f97316',
      comment: docs > 0 ? `${docs}/5 docs uploaded` : 'No docs uploaded'
    },
    {
      key: 'repo',
      label: 'Repo Data',
      pct: repo ? 100 : 0,
      color: '#0ea5e9',
      comment: repo ? 'Repository analyzed' : 'Repo not analyzed'
    },
    {
      key: 'roast',
      label: 'Roast Results',
      pct: roast ? 100 : 0,
      color: '#22c55e',
      comment: roast ? 'Roaster run complete' : 'Roast not run'
    }
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
        <polygon
          points={TRI_POINTS}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={2}
          strokeDasharray="4 8"
        />
      </svg>
      <div
        className="absolute left-1/2 top-1/2"
        style={{ transform: `translate(-50%, -50%) rotate(${ANGLES[idx]}deg)`, transition: 'transform 0.7s ease' }}
      >
        <svg viewBox="0 0 20 20" className="pointer animate-pointer">
          <polygon points="10,0 20,20 0,20" fill="rgba(255,255,255,0.6)" />
        </svg>
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="absolute inset-0">
            <circle cx="50" cy="50" r="45" stroke="#10b981" strokeOpacity={0.2} strokeWidth={4} fill="none" />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#10b981"
              strokeWidth={4}
              fill="none"
              pathLength={100}
              strokeDasharray={`${totalPct} 100`}
              style={{ filter: 'drop-shadow(0 0 4px #10b981)' }}
            />
          </svg>
          <div className="absolute inset-4 bg-black rounded-full flex items-center justify-center text-lg font-semibold">
            {totalPct}%
          </div>
        </div>
      </div>
      {aspects.map((a, i) => {
        const p = POSITIONS[i]
        const active = i === idx
        return (
          <div
            key={a.key}
            className="absolute text-center cursor-pointer"
            style={{ left: p.x, top: p.y, transform: 'translate(-50%, -50%)' }}
            onClick={() => setIdx(i)}
          >
            <div
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-transform duration-500 ${
                active ? 'scale-110' : ''
              }`}
            >
              <svg viewBox="0 0 100 100" className="absolute inset-0">
                <circle cx="50" cy="50" r="45" stroke={a.color} strokeOpacity={0.2} strokeWidth={4} fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke={a.color}
                  strokeWidth={4}
                  fill="none"
                  pathLength={100}
                  strokeDasharray={`${a.pct} 100`}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 4px ${a.color})` }}
                />
              </svg>
              <div className="relative z-10 text-sm font-semibold">{a.pct}%</div>
              {active && (
                <svg viewBox="0 0 120 120" className="absolute -inset-3 animate-spin" style={{ filter: `drop-shadow(0 0 4px ${a.color})` }}>
                  <circle
                    cx="60"
                    cy="60"
                    r="56"
                    stroke={a.color}
                    strokeWidth={2}
                    fill="none"
                    strokeDasharray="6 6"
                  />
                </svg>
              )}
            </div>
            <div className="mt-1 text-xs text-zinc-300">{a.label}</div>
          </div>
        )
      })}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 text-center text-xs text-zinc-300">
        <div key={idx} className="animate-fade">
          <div className="font-semibold">{aspects[idx].label}</div>
          <div>{aspects[idx].comment}</div>
        </div>
      </div>
      <style jsx>{`
        @keyframes pointer {
          0%,100% { transform: scale(0.9); }
          50% { transform: scale(1.05); }
        }
        .animate-pointer { animation: pointer 4s infinite ease-in-out; }
        @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade { animation: fade 0.5s ease; }
      `}</style>
    </div>
  )
}
