// @ts-nocheck
'use client'
import { useEffect, useState, CSSProperties } from 'react'

type Result = { files: string[] }
type Comment = { department: string; comment: string; temperature: number }

const departments = ['frontend', 'backend', 'ops'] as const
type Department = typeof departments[number]

function TemperatureKnob({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const percent = Math.round(value * 100)
  const color = value > 0.66 ? '#dc2626' : value > 0.33 ? '#fbbf24' : '#10b981'
  return (
    <div
      className="relative w-24 h-24 select-none"
      style={{
        '--pct': `${percent}%`,
        '--col': color
      } as CSSProperties}
    >
      <div className="absolute inset-0 rounded-full bg-zinc-800 shadow-lg shadow-emerald-500/20" />
      <div
        className="absolute inset-0 rounded-full transition-[background] duration-300"
        style={{ background: `conic-gradient(var(--col) var(--pct), #27272a 0)` }}
      />
      <div className="absolute inset-2 rounded-full bg-black flex items-center justify-center">
        <div
          className="w-1 h-8 rounded-full origin-bottom"
          style={{
            transform: `rotate(${value * 270 - 135}deg)`,
            background: 'var(--col)',
            transition: 'transform 0.3s ease-out, background 0.3s ease-out'
          }}
        />
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={percent}
        onChange={e => onChange(parseInt(e.target.value) / 100)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </div>
  )
}

function Face({ level }: { level: number }) {
  const mood = level > 0.66 ? 'furious' : level > 0.33 ? 'poker' : 'smile'
  return (
    <div className={`face ${mood}`}>
      <div className="eye left" />
      <div className="eye right" />
      <div className="mouth" />
      <style jsx>{`
        .face {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: #27272a;
          position: relative;
          filter: drop-shadow(0 0 15px rgba(16, 185, 129, 0.25));
          transition: background 0.3s, filter 0.3s;
        }
        .face.smile {
          background: #14532d;
        }
        .face.poker {
          background: #57534e;
        }
        .face.furious {
          background: #7f1d1d;
          filter: drop-shadow(0 0 20px rgba(127, 29, 29, 0.4));
        }
        .eye {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          position: absolute;
          top: 55px;
          transition: transform 0.3s;
          animation: blink 5s infinite;
          transform-origin: center;
        }
        @keyframes blink {
          0%, 97%, 100% { transform: scaleY(1); }
          98%, 99% { transform: scaleY(0.1); }
        }
        .eye.left {
          left: 55px;
        }
        .eye.right {
          right: 55px;
        }
        .face.furious .eye.left {
          transform: rotate(20deg) translateY(-4px);
        }
        .face.furious .eye.right {
          transform: rotate(-20deg) translateY(-4px);
        }
        .mouth {
          width: 80px;
          height: 40px;
          border: 5px solid #fff;
          border-top: none;
          border-radius: 0 0 80px 80px;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          bottom: 55px;
          transition: all 0.3s;
        }
        .face.poker .mouth {
          height: 0;
          border-radius: 0;
          bottom: 80px;
        }
        .face.furious .mouth {
          border-bottom: none;
          border-top: 5px solid #fff;
          border-radius: 80px 80px 0 0;
          bottom: 90px;
        }
      `}</style>
    </div>
  )
}

export default function RoasterPage() {
  const [result, setResult] = useState<Result | null>(null)
  const [level, setLevel] = useState(0.5)
  const [roast, setRoast] = useState<Comment[] | null>(null)
  const empty = departments.reduce(
    (acc, d) => ({ ...acc, [d]: { department: d, comment: 'Awaiting review', temperature: 0 } }),
    {} as Record<Department, Comment>
  )
  const [widgets, setWidgets] = useState<Record<Department, Comment>>(empty)
  const [roasting, setRoasting] = useState(false)
  const [fixes, setFixes] = useState<string[] | null>(null)
  const [fixing, setFixing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('ingestResult')
    if (stored) setResult(JSON.parse(stored))
  }, [])

  async function runRoaster() {
    if (!result) return
    setRoasting(true)
    try {
      const res = await fetch('/api/roaster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: result.files, level })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'roaster failed')
      const comments = Array.isArray(data.comments) ? data.comments : []
      const updated = { ...empty }
      comments.forEach((c: Comment) => {
        const key = c.department.toLowerCase() as Department
        if (updated[key]) updated[key] = c
      })
      setWidgets(updated)
      setRoast(comments)
      setError('')
    } catch (err) {
      setRoast(null)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRoasting(false)
    }
  }

  async function runFixes() {
    if (!result) return
    setFixing(true)
    try {
      const res = await fetch('/api/roaster/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: result.files })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'fix suggestions failed')
      setFixes(data.suggestions || [])
      setError('')
    } catch (err) {
      setFixes(null)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setFixing(false)
    }
  }

  useEffect(() => {
    if (result && !roast && !roasting) runRoaster()
  }, [result])

  const temps = Object.values(widgets).map(w => w.temperature)
  const health = temps.length
    ? 100 - Math.round((temps.reduce((s, t) => s + t, 0) / temps.length) * 100)
    : 0

  return (
    <div className="relative overflow-hidden min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-200 p-10">
      <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 opacity-20 scale-[2.5]" aria-hidden="true">
        <Face level={level} />
      </div>
      <div className="relative z-10 space-y-8">
        <h1 className="text-2xl font-semibold tracking-tight">Roaster</h1>
        <div className="flex flex-wrap items-center gap-8">
          <TemperatureKnob value={level} onChange={setLevel} />
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">Criticism Level: {Math.round(level * 100)}%</div>
            <div className="flex gap-2">
              <button
                onClick={runRoaster}
                className="px-4 py-2 bg-emerald-600 text-sm font-medium rounded-lg hover:bg-emerald-500 transition"
              >
                Run Roaster
              </button>
              <button
                onClick={runFixes}
                className="px-4 py-2 bg-rose-600 text-sm font-medium rounded-lg hover:bg-rose-500 transition"
              >
                Fix
              </button>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-4">
            <div className="relative h-20 w-20">
              <div className="absolute inset-0 rounded-full bg-zinc-800" />
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: `conic-gradient(#10b981 ${health}%, transparent 0)` }}
              />
              <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold">{health}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Health</div>
              <div className="text-xs text-zinc-400">Overall project vitality</div>
            </div>
          </div>
        </div>
        {error && <div className="text-xs text-rose-400">{error}</div>}
        <div className="grid sm:grid-cols-3 gap-4">
          {departments.map(d => {
            const w = widgets[d]
            return (
              <div key={d} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold capitalize">{d}</span>
                  <span className="text-xs text-zinc-400">{Math.round(w.temperature * 100)}%</span>
                </div>
                <div
                  className={`text-sm ${w.temperature > 0.66 ? 'text-rose-400' : w.temperature > 0.33 ? 'text-amber-300' : 'text-emerald-400'}`}
                >
                  {w.comment}
                </div>
                <div className="h-1 bg-zinc-800 rounded-full mt-2">
                  <div
                    className={`h-full rounded-full ${w.temperature > 0.66 ? 'bg-rose-500' : w.temperature > 0.33 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${w.temperature * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        {fixes && (
          <div className="mt-6 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-sm font-semibold mb-2">Suggested Fixes</div>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {fixes.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        )}
        {(roasting || fixing) && (
          <div className="flex items-center justify-center mt-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-500" />
          </div>
        )}
      </div>
    </div>
  )
}
