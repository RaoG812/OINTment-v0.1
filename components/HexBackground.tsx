"use client"
import { useRef, useEffect, useState } from 'react'

export default function HexBackground({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [cells, setCells] = useState<{ id: number; x: number; y: number; start: number }[]>([])

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current as HTMLDivElement

    function move(e: PointerEvent) {
      const now = Date.now()
      const x = Math.floor(e.clientX / 18) * 18
      const y = Math.floor(e.clientY / 15.6) * 15.6
      setCells(prev => {
        const keep = prev.filter(c => now - c.start < 5000)
        return [...keep, { id: now, x, y, start: now }]
      })
    }
    window.addEventListener("pointermove", move)

    return () => {
      window.removeEventListener("pointermove", move)
    }
  }, [])

  return (
    <div ref={ref} className={`pointer-events-none fixed inset-0 z-0 ${className}`}>
      {cells.map(c => (
        <span key={c.id} className="hex-anim" style={{ left: c.x, top: c.y }} />
      ))}
      <style jsx>{`
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
