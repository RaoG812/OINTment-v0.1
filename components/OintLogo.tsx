import React from 'react'

export function OintLogo({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(100, progress))
  return (
    <div className="relative w-16 h-16">
      <img src="/oint-logo.svg" alt="OINT" className="absolute inset-0 opacity-20" />
      <div
        className="absolute inset-0 bg-emerald-500 transition-all"
        style={{
          WebkitMask: 'url(/oint-logo.svg) no-repeat center / contain',
          mask: 'url(/oint-logo.svg) no-repeat center / contain',
          clipPath: `inset(${100 - clamped}% 0 0 0)`
        }}
      />
    </div>
  )
}
