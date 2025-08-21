// @ts-nocheck
'use client'
import { useEffect, useState, CSSProperties, useRef } from 'react'

type Result = { files: string[] }
type Comment = { department: string; comment: string; temperature: number }

const departments = ['frontend', 'backend', 'ops'] as const
type Department = typeof departments[number]

function TemperatureKnob({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const percent = Math.round(value * 100)
  const angle = value * 270 - 135
  const hue = 120 - value * 120
  return (
    <div className="relative w-32 h-32 select-none">
      <div className="absolute inset-0 rounded-full bg-zinc-800 shadow-inner shadow-black/40" />
      <div
        className="absolute inset-0 rounded-full transition-all"
        style={{
          background: `conic-gradient(hsl(${hue},80%,50%) ${percent}%, #27272a ${percent}% 100%)`
        }}
      />
      <div className="absolute inset-[6px] rounded-full bg-black">
        <div
          className="absolute top-1/2 left-1/2 w-2 h-14 rounded-full"
          style={{
            transform: `translate(-50%, -100%) rotate(${angle}deg)`,
            transformOrigin: '50% 100%',
            background: `hsl(${hue},80%,50%)`,
            transition: 'transform 0.3s ease-out, background 0.3s ease-out'
          }}
        />
        <div className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-zinc-200 rounded-full" />
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
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    function move(e: PointerEvent) {
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
      el.style.setProperty('--my', `${e.clientY - rect.top}px`)
    }
    function leave() {
      el.style.setProperty('--mx', `-999px`)
      el.style.setProperty('--my', `-999px`)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [])

  const smileOpacity = level < 0.33 ? 1 - level / 0.33 : 0
  const pokerOpacity =
    level < 0.33 ? level / 0.33 : level < 0.66 ? 1 - (level - 0.33) / 0.33 : 0
  const furiousOpacity = level > 0.66 ? (level - 0.66) / 0.34 : 0
  const hue = 120 - level * 120
  return (
    <div ref={ref} className="relative w-[270px] h-[270px]">
      <div className="absolute inset-0 skull rounded-full" />
      <div
          className="absolute inset-0 rounded-full overflow-hidden top-face"
          style={{ background: `radial-gradient(circle at 50% 35%, hsl(${hue},40%,30%), #000)` }}
      >
        <div className="absolute inset-0 transition-opacity" style={{ opacity: smileOpacity }}>
          <div className="eye left" />
          <div className="eye right" />
          <div className="mouth smile" />
        </div>
        <div className="absolute inset-0 transition-opacity" style={{ opacity: pokerOpacity }}>
          <div className="eye left" />
          <div className="eye right" />
          <div className="mouth poker" />
        </div>
        <div className="absolute inset-0 transition-opacity" style={{ opacity: furiousOpacity }}>
          <div className="eye left furious" />
          <div className="eye right furious" />
          <div className="mouth furious" />
        </div>
      </div>
      <style jsx>{`
        .skull {
          background: radial-gradient(circle at 50% 35%, #450a0a, #000);
          position: absolute;
          overflow: hidden;
        }
        .skull::before {
          content: '☠️';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 160px;
          color: #f87171;
          filter: drop-shadow(0 0 10px rgba(127,29,29,0.6));
        }
        .top-face {
          --mx: -999px;
          --my: -999px;
          mask: radial-gradient(circle 60px at var(--mx) var(--my), transparent 0, black 60px);
          -webkit-mask: radial-gradient(circle 60px at var(--mx) var(--my), transparent 0, black 60px);
          transition: background 0.3s;
        }
        .eye {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #fff;
          position: absolute;
          top: 82px;
          animation: blink 5s infinite;
          transform-origin: center;
        }
        .eye.left { left: 82px; }
        .eye.right { right: 82px; }
        .eye.furious {
          clip-path: polygon(50% 0, 0 100%, 100% 100%);
          transform: translateY(-6px) rotate(calc(10deg * var(--dir)));
        }
        .eye.furious.left { --dir: 1; }
        .eye.furious.right { --dir: -1; }
        @keyframes blink {
          0%, 97%, 100% { transform: scaleY(1); }
          98%, 99% { transform: scaleY(0.1); }
        }
        .mouth {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          transition: all 0.3s;
        }
        .mouth.smile {
          width: 120px;
          height: 60px;
          border: 8px solid #fff;
          border-top: none;
          border-radius: 0 0 120px 120px;
          bottom: 82px;
        }
        .mouth.poker {
          width: 120px;
          height: 0;
          border: 8px solid #fff;
          border-bottom: none;
          bottom: 120px;
        }
        .mouth.furious {
          width: 120px;
          height: 60px;
          background: #fff;
          bottom: 40px;
          clip-path: polygon(10% 0, 90% 0, 100% 100%, 0 100%);
        }
      `}</style>
    </div>
  )
}

function HexOverlay() {
  useEffect(() => {
    function move(e: PointerEvent) {
      const root = document.documentElement
      root.style.setProperty('--cursor-x', `${e.clientX}px`)
      root.style.setProperty('--cursor-y', `${e.clientY}px`)
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-20 hex-overlay" />
      <style jsx global>{`
        .hex-overlay {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 17.32' width='20' height='17.32'%3E%3Cpolygon fill='rgba(255,255,255,0.2)' points='10,0 20,5.77 20,11.55 10,17.32 0,11.55 0,5.77'/%3E%3C/svg%3E");
          background-size: 20px 17.32px;
          opacity: 0.12;
          mix-blend-mode: exclusion;
          mask: radial-gradient(circle at var(--cursor-x) var(--cursor-y), rgba(0,0,0,0.8) 0, rgba(0,0,0,0.4) 80px, transparent 160px);
          -webkit-mask: radial-gradient(circle at var(--cursor-x) var(--cursor-y), rgba(0,0,0,0.8) 0, rgba(0,0,0,0.4) 80px, transparent 160px);
        }
      `}</style>
    </>
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

  async function applyOint() {
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

  const hue = 120 - level * 120
  const bgStyle: CSSProperties = {
    background: `radial-gradient(circle at 50% 50%, hsl(${hue},60%,8%), #000)`,
    backgroundSize: '200% 200%',
    animation: 'bgMove 20s ease infinite',
    transition: 'background 0.5s'
  }

  return (
    <div className="relative overflow-hidden min-h-screen text-zinc-200 p-10" style={bgStyle}>
      <HexOverlay />
      <div
        className="absolute -bottom-40 -right-40 opacity-20"
        aria-hidden="true"
        style={{ transform: 'scale(3)', transformOrigin: 'bottom right' }}
      >
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
                onClick={applyOint}
                className="px-4 py-2 bg-rose-600 text-sm font-medium rounded-lg hover:bg-rose-500 transition"
              >
                Apply OINT
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
        {(roasting || fixing) && (
          <div className="flex items-center justify-center mt-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-500" />
          </div>
        )}
      </div>
      {fixes && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 w-96 p-4 rounded-xl bg-zinc-900/80 border border-zinc-700 backdrop-blur">
          <div className="text-sm font-semibold mb-2">OINT Suggestions</div>
          <ul className="list-disc pl-5 space-y-1 text-sm max-h-60 overflow-auto">
            {fixes.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      <style jsx>{`
        @keyframes bgMove {
          0% { background-position: 0 0; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0 0; }
        }
      `}</style>
    </div>
  )
}
