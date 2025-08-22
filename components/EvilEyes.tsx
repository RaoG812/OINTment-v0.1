'use client'
import { useEffect, useState } from 'react'

export default function EvilEyes() {
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    function handle(e: MouseEvent) {
      const x = e.clientX / window.innerWidth - 0.5
      const y = e.clientY / window.innerHeight - 0.5
      setPos({ x, y })
    }
    window.addEventListener('mousemove', handle)
    return () => window.removeEventListener('mousemove', handle)
  }, [])

  const offsetX = pos.x * 20
  const offsetY = pos.y * 10
  const base = 150

  return (
    <div className="evil-eyes fixed inset-0 flex items-center justify-center pointer-events-none z-0">
      <div className="eye" style={{ transform: `translate(${offsetX - base}px, ${offsetY}px)` }}>
        <div className="inner-eye" />
      </div>
      <div className="eye" style={{ transform: `translate(${offsetX + base}px, ${offsetY}px)` }}>
        <div className="inner-eye" style={{ animationDelay: '0.2s' }} />
      </div>
    </div>
  )
}
