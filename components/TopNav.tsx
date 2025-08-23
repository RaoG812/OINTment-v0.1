'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import AuthControls from './AuthControls'

const links: { href: string; label: ReactNode; extra?: string; brand?: boolean }[] = [
  {
    href: '/',
    label: (
      <>
        <span className="text-emerald-400">OINT</span>ment
      </>
    ),
    extra: 'text-lg font-semibold tracking-tight group',
    brand: true
  },
  { href: '/ingest', label: 'Ingest' },
  { href: '/matrix', label: 'Matrix' },
  { href: '/roaster', label: 'Roaster' },
  { href: '/vibe-killer', label: 'Vibe Killer' },
  { href: '/toolset', label: 'Toolset' },
  { href: '/3d-map', label: '3D Map' }
]

export default function TopNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname()
  return (
    <nav className="mx-auto max-w-7xl flex items-center gap-6 px-6 py-4 text-sm overflow-x-auto whitespace-nowrap fade-in-fast">
      {links.map(l => {
        const active = pathname === l.href
        if (l.brand) {
          return (
            <Link
              key={l.href}
              href={l.href}
              className={l.extra ?? ''}
            >
              {l.label}
            </Link>
          )
        }
        const base = 'hover:text-emerald-400 hover:border-emerald-400'
        const cls = active
          ? 'text-emerald-400 border-b-2 border-emerald-400'
          : `border-b-2 border-transparent ${base}`
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`${cls} pb-1 ${l.extra ?? ''}`}
          >
            {l.label}
          </Link>
        )
      })}
      <AuthControls isLoggedIn={isLoggedIn} />
    </nav>
  )
}
