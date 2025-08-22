'use client'
import Link from 'next/link'
import HexBackground from '../components/HexBackground'

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <HexBackground />
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(229,231,235,0.3), rgba(51,65,85,0.9))',
            backgroundSize: '200% 200%',
            animation: 'bgMove 20s ease infinite',
            filter: 'blur(40px)'
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      <div className="relative z-10 p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">OINTment</h1>
          <p className="text-sm text-zinc-400">Onboarding Insights Neural Toolset</p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/ingest"
            className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 transition"
          >
            Ingest Project Data
          </Link>
          <Link
            href="/roaster"
            className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 transition"
          >
            Roast the Team
          </Link>
          <Link href="/toolset" className="text-sm text-zinc-400 underline">
            OINT Mission Control
          </Link>
        </div>
        <div className="pt-8 text-sm text-zinc-400 max-w-prose">
          <p>
            <span className="font-semibold">OINT</span> stands for
            <em> Onboarding Insights Neural Toolset</em>. OINTment smooths project onboarding by exposing integrations,
            risks and recommended next steps.
          </p>
        </div>
      </div>
    </main>
  )
}
