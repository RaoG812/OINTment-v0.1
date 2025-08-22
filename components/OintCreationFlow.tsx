'use client'
import { useEffect, useRef, useState } from 'react'

const SIZE = 450
const POSITIONS = [
  { x: 60, y: 225 }, // apex (selected)
  { x: 390, y: 120 }, // top right
  { x: 390, y: 330 } // bottom right
]
const TRI_POINTS = POSITIONS.map(p => `${p.x},${p.y}`).join(' ')
const POINTER_POS = { x: POSITIONS[0].x - 40, y: POSITIONS[0].y }
const ORDER = [
  [0, 1, 2],
  [2, 0, 1],
  [1, 2, 0]
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
  const [settled, setSettled] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const resumeRef = useRef<NodeJS.Timeout | null>(null)

  function startAuto() {
    intervalRef.current = setInterval(() => setIdx(i => (i + 1) % aspects.length), 4000)
  }

  // auto-rotate rings every 4s
  useEffect(() => {
    startAuto()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (resumeRef.current) clearTimeout(resumeRef.current)
    }
  }, [aspects.length])
  // pointer pulse and ring scale after reaching apex
  useEffect(() => {
    setSettled(false)
    setPointerScale(0.8)
    const grow = setTimeout(() => {
      setPointerScale(1.1)
      setSettled(true)
    }, 600)
    const settle = setTimeout(() => setPointerScale(1), 1200)
    return () => {
      clearTimeout(grow)
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
        function handleSelect() {
          if (active) {
            setIdx(prev => (prev + aspects.length - 1) % aspects.length)
          } else {
            setIdx(i)
          }
          if (intervalRef.current) clearInterval(intervalRef.current)
          if (resumeRef.current) clearTimeout(resumeRef.current)
          resumeRef.current = setTimeout(() => startAuto(), 10000)
        }
        return (
          <div
            key={a.key}
            className={`absolute text-center cursor-pointer ${active ? 'z-20' : 'z-10'}`}
            style={{
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
              transition: 'left 0.7s ease, top 0.7s ease'
            }}
            onClick={handleSelect}
          >
            <div
              className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-transform duration-500 ${
                active && settled ? 'scale-150' : 'scale-100'
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
        className="absolute z-20"
        style={{
          left: POINTER_POS.x,
          top: POINTER_POS.y,
          transform: `translate(-50%, -50%) scale(${pointerScale})`,
          transition: 'transform 0.6s ease'
        }}
      >
        <svg viewBox="0 0 20 20" className="pointer-events-none">
          <polygon points="20,10 0,0 0,20" fill="rgba(255,255,255,0.5)" />
          <polygon points="14,10 0,3 0,17" fill="rgba(255,255,255,0.9)" />
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
        .animate-fade-large { animation: fadeLarge 0.7s ease; }
        @keyframes dash { to { stroke-dashoffset: -48; } }
        .triangle-path { animation: dash 8s linear infinite; }
        @keyframes slow-spin { to { transform: rotate(360deg); } }
        .animate-slow-spin { animation: slow-spin 4s linear infinite; }
      `}</style>
    </div>
  )
}
