// @ts-nocheck
import './globals.css';
import { ReactNode } from 'react';
import Link from 'next/link';


export const metadata = {
  title: 'OINTment',
  description: 'Onboarding Insights Neural Toolset',
  icons: { icon: '/favicon.svg' }

};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-zinc-200">
        <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur sticky top-0 z-10">
          <nav className="mx-auto max-w-7xl flex items-center gap-6 px-6 py-4 text-sm">
            <Link href="/" className="font-semibold tracking-tight">
              OINTment
            </Link>
            <Link href="/ingest" className="hover:text-emerald-400">
              Ingest
            </Link>
            <Link href="/matrix" className="hover:text-emerald-400">
              Matrix
            </Link>
            <Link href="/roaster" className="hover:text-emerald-400">
              Roaster
            </Link>
            <Link href="/vibe-killer" className="hover:text-emerald-400">
              Vibe Killer
            </Link>
            <Link href="/3d-map" className="hover:text-emerald-400">
              3D Map
            </Link>
          </nav>
        </header>
        {children}
      </body>

    </html>
  );
}
