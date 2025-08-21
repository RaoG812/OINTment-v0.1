'use client'
import { useRef, useEffect, CSSProperties } from 'react'

export default function HexBackground({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const node = el
    function move(e: PointerEvent) {
      node.style.setProperty('--hx', `${e.clientX}px`)
      node.style.setProperty('--hy', `${e.clientY}px`)
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])
  return (
    <div
      ref={ref}
      className={`pointer-events-none fixed inset-0 z-0 ${className}`}
      style={{ '--hx': '-999px', '--hy': '-999px' } as CSSProperties}
    >
      <div className="absolute inset-0 hex-layer" />
      <style jsx>{`
        .hex-layer {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 8.66'%3E%3Cpath d='M2.5 0h5l2.5 4.33-2.5 4.33h-5L0 4.33z' fill='none' stroke='rgba(255,255,255,0.2)'/%3E%3C/svg%3E");
          background-size: 18px 15.6px;
          opacity: 0.25;
          mask: radial-gradient(circle 80px at var(--hx) var(--hy), black 0 50px, transparent 80px);
          -webkit-mask: radial-gradient(circle 80px at var(--hx) var(--hy), black 0 50px, transparent 80px);
        }
      `}</style>
    </div>
  )
}
