'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'OINTment', extra: 'font-semibold tracking-tight' },
  { href: '/ingest', label: 'Ingest' },
  { href: '/matrix', label: 'Matrix' },
  { href: '/roaster', label: 'Roaster' },
  { href: '/vibe-killer', label: 'Vibe Killer' },
  { href: '/toolset', label: 'Toolset' },
  { href: '/3d-map', label: '3D Map' }
]

export default function TopNav() {
  const pathname = usePathname()
  return (
    <nav className="mx-auto max-w-7xl flex items-center gap-6 px-6 py-4 text-sm overflow-x-auto whitespace-nowrap">
      {links.map(l => {
        const active = pathname === l.href
        const base = 'hover:text-emerald-400'
        const cls = active ? 'text-emerald-400' : base
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`${cls} ${l.extra ?? ''}`}
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
