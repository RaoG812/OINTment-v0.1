'use client'
import { useEffect, useState } from 'react'

const SIZE = 300
const POSITIONS = [
  { x: 40, y: 150 }, // apex (selected)
  { x: 260, y: 80 }, // top right
  { x: 260, y: 220 } // bottom right
]
const TRI_POINTS = POSITIONS.map(p => `${p.x},${p.y}`).join(' ')
const CENTER = {
  x: (POSITIONS[0].x + POSITIONS[1].x + POSITIONS[2].x) / 3,
  y: (POSITIONS[0].y + POSITIONS[1].y + POSITIONS[2].y) / 3
}
const POINTER_POS = { x: POSITIONS[0].x - 20, y: POSITIONS[0].y }
const ORDER = [
  [0, 1, 2],
  [1, 2, 0],
  [2, 0, 1]
]

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
  const order = ORDER[idx]

  return (
    <div className="relative w-[300px] h-[300px]">
      <svg className="absolute inset-0" viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <polygon
          points={TRI_POINTS}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={2}
          strokeDasharray="4 8"
        />
      </svg>
      {aspects.map((a, i) => {
        const pos = POSITIONS[order[i]]
        const active = order[i] === 0
        return (
          <div
            key={a.key}
            className="absolute text-center cursor-pointer"
            style={{
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
              transition: 'left 0.7s ease, top 0.7s ease'
            }}
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
              <div className="relative z-10 text-base font-semibold">{a.pct}%</div>
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
            <div className="mt-1 text-sm text-zinc-300">{a.label}</div>
          </div>
        )
      })}
      <div
        className="absolute"
        style={{ left: POINTER_POS.x, top: POINTER_POS.y, transform: 'translate(-50%, -50%)' }}
      >
        <svg viewBox="0 0 20 20" className="pointer animate-pointer">
          <polygon points="0,10 8,0 8,20" fill="rgba(255,255,255,0.6)" />
          <polygon points="8,10 16,0 16,20" fill="rgba(255,255,255,0.6)" />
        </svg>
      </div>
      <div
        className="absolute"
        style={{ left: CENTER.x, top: CENTER.y, transform: 'translate(-50%, -50%)' }}
      >
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
      <div
        className="absolute bottom-2 w-56 text-center text-sm text-zinc-300"
        style={{ left: CENTER.x, transform: 'translateX(-50%)' }}
      >
        <div key={idx} className="animate-fade-large">
          <div className="text-lg font-semibold mb-1">{aspects[idx].label}</div>
          <div>{aspects[idx].comment}</div>
        </div>
      </div>
      <style jsx>{`
        @keyframes pointer {
          0%,100% { transform: scale(0.9); }
          50% { transform: scale(1.05); }
        }
        .animate-pointer { animation: pointer 4s infinite ease-in-out; }
        @keyframes fadeLarge { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-large { animation: fadeLarge 0.7s ease; }
      `}</style>
    </div>
  )
}
