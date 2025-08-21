"use client"
import { useRef, useEffect, useState, CSSProperties } from 'react'

type Cell = { id: number; x: number; y: number; start: number }

export default function HexBackground({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [cells, setCells] = useState<Cell[]>([])

  // track pointer for reveal mask
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current as HTMLDivElement
    function move(e: PointerEvent) {
      el.style.setProperty('--mx', `${e.clientX}px`)
      el.style.setProperty('--my', `${e.clientY}px`)
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])

  // spawn red hexes independently of cursor
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current as HTMLDivElement

    function spawn() {
      const now = Date.now()
      const { width, height } = el.getBoundingClientRect()
      const count = Math.random() < 0.5 ? 1 : 2
      const next = Array.from({ length: count }).map(() => ({
        id: now + Math.random(),
        x: Math.floor((Math.random() * width) / 18) * 18,
        y: Math.floor((Math.random() * height) / 15.6) * 15.6,
        start: now
      }))
      setCells(prev => [...prev.filter(c => now - c.start < 6000), ...next])
    }

    spawn()
    const t = setInterval(spawn, 3000)
    return () => clearInterval(t)
  }, [])

  const mask = 'radial-gradient(circle 120px at var(--mx) var(--my), rgba(0,0,0,1) 0 80px, rgba(0,0,0,0) 120px)'

  return (
    <div
      ref={ref}
      className={`pointer-events-none fixed inset-0 z-50 ${className}`}
      style={{ '--mx': '-999px', '--my': '-999px', mask, WebkitMask: mask } as CSSProperties}
    >
      <div className="absolute inset-0 pattern" />
      {cells.map(c => (
        <span key={c.id} className="hex-anim" style={{ left: c.x, top: c.y }} />
      ))}
      <style jsx>{`
        .pattern {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='18' height='15.6' viewBox='0 0 18 15.6'><path fill='none' stroke='white' stroke-opacity='0.1' stroke-width='1' d='M4.5 1.3h9l4.5 6-4.5 6h-9L0 7.3z'/></svg>`)}");
          background-size: 18px 15.6px;
          opacity: 0.25;
        }
        .hex-anim {
          position: absolute;
          width: 18px;
          height: 15.6px;
          clip-path: polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%);
          background: rgba(220,38,38,0.9);
          animation: fadeHex 6s forwards;
        }
        .hex-anim::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(59,130,246,0.9);
          transform: scaleY(0);
          transform-origin: bottom;
          animation: fillHex 6s forwards;
        }
        @keyframes fillHex {
          0% { transform: scaleY(0); }
          20% { transform: scaleY(0); }
          100% { transform: scaleY(1); }
        }
        @keyframes fadeHex {
          0%,80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

