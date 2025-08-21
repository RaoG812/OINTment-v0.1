"use client"
import { useRef, useEffect, useState, CSSProperties } from 'react'

export default function HexBackground({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [cells, setCells] = useState<{ id: number; x: number; y: number; start: number }[]>([])

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current as HTMLDivElement

    function move(e: PointerEvent) {
      el.style.setProperty("--hx", `${e.clientX}px`)
      el.style.setProperty("--hy", `${e.clientY}px`)
    }
    window.addEventListener("pointermove", move)

    const interval = setInterval(() => {
      setCells(prev => {
        const now = Date.now()
        const keep = prev.filter(c => now - c.start < 6000)
        const w = window.innerWidth
        const h = window.innerHeight
        const x = Math.floor(Math.random() * (w / 18)) * 18
        const y = Math.floor(Math.random() * (h / 15.6)) * 15.6
        return [...keep, { id: now, x, y, start: now }]
      })
    }, 3000)

    return () => {
      window.removeEventListener("pointermove", move)
      clearInterval(interval)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`pointer-events-none fixed inset-0 z-0 ${className}`}
      style={{ "--hx": "-999px", "--hy": "-999px" } as CSSProperties}
    >
      <div className="absolute inset-0 hex-layer" />
      {cells.map(c => (
        <span key={c.id} className="hex-anim" style={{ left: c.x, top: c.y }} />
      ))}
      <style jsx>{`
        .hex-layer {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 8.66'%3E%3Cpath d='M2.5 0h5l2.5 4.33-2.5 4.33h-5L0 4.33z' fill='none' stroke='rgba(255,255,255,0.2)'/%3E%3C/svg%3E");
          background-size: 18px 15.6px;
          opacity: 0.25;
          mask: radial-gradient(circle 80px at var(--hx) var(--hy), black 0 50px, transparent 80px);
          -webkit-mask: radial-gradient(circle 80px at var(--hx) var(--hy), black 0 50px, transparent 80px);
        }
        .hex-anim {
          position: absolute;
          width: 18px;
          height: 15.6px;
          clip-path: polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%);
          background: rgba(220,38,38,0.9);
          animation: fadeHex 5s forwards;
        }
        .hex-anim::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(59,130,246,0.9);
          transform: scaleY(0);
          transform-origin: bottom;
          animation: fillHex 5s forwards;
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
