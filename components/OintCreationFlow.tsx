'use client'
import { useEffect, useState } from 'react'

const SIZE = 450
const POSITIONS = [
  { x: 60, y: 225 }, // apex (selected)
  { x: 390, y: 120 }, // top right
  { x: 390, y: 330 } // bottom right
]
const TRI_POINTS = POSITIONS.map(p => `${p.x},${p.y}`).join(' ')
const POINTER_POS = { x: POSITIONS[0].x - 30, y: POSITIONS[0].y }
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
  const [pointerScale, setPointerScale] = useState(1)
  // auto-rotate rings every 16s (slowed by 75%)
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % aspects.length), 16000)
    return () => clearInterval(id)
  }, [aspects.length])
  // pointer pulse when active ring reaches apex
  useEffect(() => {
    setPointerScale(0.8)
    const up = setTimeout(() => setPointerScale(1.1), 2400)
    const settle = setTimeout(() => setPointerScale(1), 4800)
    return () => {
      clearTimeout(up)
      clearTimeout(settle)
    }
  }, [idx])

  const order = ORDER[idx]

  return (
    <div className="relative w-[450px] h-[450px]">
      <svg className="absolute inset-0" viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <polygon
          key={idx}
          points={TRI_POINTS}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={2}
          strokeDasharray="4 8"
          className="triangle-path"
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
              transition: 'left 2.8s ease, top 2.8s ease'
            }}
            onClick={() => setIdx(i)}
          >
            <div
              className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-transform duration-[2000ms] ${
                active ? 'scale-125' : ''
              }`}
            >
              <svg viewBox="0 0 100 100" className="absolute inset-0">
                <circle cx="50" cy="50" r="45" stroke={a.color} strokeOpacity={0.2} strokeWidth={6} fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke={a.color}
                  strokeWidth={6}
                  fill="none"
                  pathLength={100}
                  strokeDasharray={`${a.pct} 100`}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 6px ${a.color})` }}
                />
              </svg>
              <div className="relative z-10 text-xl font-semibold">{a.pct}%</div>
              {active && (
                <svg
                  viewBox="0 0 140 140"
                  className="absolute -inset-4 animate-slow-spin"
                  style={{ filter: `drop-shadow(0 0 6px ${a.color})` }}
                >
                  <circle
                    cx="70"
                    cy="70"
                    r="66"
                    stroke={a.color}
                    strokeWidth={3}
                    fill="none"
                    strokeDasharray="8 8"
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
        style={{
          left: POINTER_POS.x,
          top: POINTER_POS.y,
          transform: `translate(-50%, -50%) scale(${pointerScale})`,
          transition: 'transform 2.4s ease'
        }}
      >
        <svg viewBox="0 0 24 24">
          <polygon points="24,12 0,0 0,24" fill="rgba(255,255,255,0.7)" />
        </svg>
      </div>
      <div className="absolute bottom-4 left-0 w-80 text-left text-zinc-300">
        <div key={idx} className="animate-fade-large">
          <div className="text-3xl font-semibold mb-2">{aspects[idx].label}</div>
          <div className="text-xl">{aspects[idx].comment}</div>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeLarge { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-large { animation: fadeLarge 2.8s ease; }
        @keyframes dash { to { stroke-dashoffset: -48; } }
        .triangle-path { animation: dash 32s linear infinite; }
        @keyframes slow-spin { to { transform: rotate(360deg); } }
        .animate-slow-spin { animation: slow-spin 4s linear infinite; }
      `}</style>
    </div>
  )
}
