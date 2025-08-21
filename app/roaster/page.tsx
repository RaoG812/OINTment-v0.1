// @ts-nocheck
'use client'
import { useEffect, useState } from 'react'

type Result = { files: string[] }
type Comment = { department: string; comment: string; temperature: number }

const departments = ['frontend', 'backend', 'ops'] as const
type Department = typeof departments[number]

function TemperatureKnob({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div
      className="relative w-24 h-24 rounded-full"
      style={{ background: `conic-gradient(#10b981 ${value * 100}%, #27272a 0)` }}
    >
      <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center">
        <div
          className="h-1 w-1/2 bg-emerald-500 origin-right"
          style={{ transform: `rotate(${value * 270 - 135}deg)` }}
        />
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={Math.round(value * 100)}
        onChange={e => onChange(parseInt(e.target.value) / 100)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </div>
  )
}

function Face({ level }: { level: number }) {
  const mood = level > 0.66 ? 'angry' : level > 0.33 ? 'meh' : 'happy'
  return (
    <div className={`face ${mood}`}>
      <div className="eye left" />
      <div className="eye right" />
      <div className="mouth" />
      <style jsx>{`
        .face {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: #27272a;
          position: relative;
          transition: background 0.3s;
        }
        .face.happy {
          background: #14532d;
        }
        .face.meh {
          background: #57534e;
        }
        .face.angry {
          background: #7f1d1d;
        }
        .eye {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          position: absolute;
          top: 45px;
        }
        .eye.left {
          left: 45px;
        }
        .eye.right {
          right: 45px;
        }
        .mouth {
          width: 60px;
          height: 30px;
          border: 4px solid #fff;
          border-top: none;
          border-radius: 0 0 60px 60px;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          bottom: 45px;
          transition: all 0.3s;
        }
        .face.meh .mouth {
          height: 4px;
          border-radius: 0;
          bottom: 60px;
        }
        .face.angry .mouth {
          border-bottom: none;
          border-top: 4px solid #fff;
          border-radius: 60px 60px 0 0;
          bottom: 75px;
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-200 p-10 space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Roaster</h1>
      <div className="flex gap-10">
        <div className="space-y-6 flex-1 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <TemperatureKnob value={level} onChange={setLevel} />
            <div className="text-sm font-medium">Criticism Level: {Math.round(level * 100)}%</div>
          </div>
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

        {error && <div className="text-xs text-rose-400">{error}</div>}

        <div className="grid sm:grid-cols-3 gap-4 mt-4">
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
      <div className="hidden lg:flex flex-1 justify-center pt-20">
        <Face level={level} />
      </div>
    </div>
  </div>
  )
}
