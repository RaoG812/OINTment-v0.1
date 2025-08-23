'use client'
import Link from 'next/link'
import Image from 'next/image'
import HexBackground from '../components/HexBackground'

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <HexBackground />
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(at 25% 25%, rgba(30,58,138,0.4), transparent 60%), radial-gradient(at 75% 25%, rgba(46,16,101,0.4), transparent 60%), radial-gradient(at 50% 75%, rgba(255,255,255,0.2), transparent 70%)',
            backgroundSize: '200% 200%',
            animation: 'bgMove 20s ease infinite',
            filter: 'blur(40px)'
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      {/* Stretched background logo with smaller overlay */}
      <div className="pointer-events-none fixed inset-y-0 right-0 z-0 opacity-20">
        <Image
          src="/OINTment_logo_vert.svg"
          alt="OINTment logo background"
          className="h-full w-auto object-contain"
          width={2048}
          height={2048}
        />
      </div>
      <Image
        src="/OINTment_logo_vert.svg"
        alt="OINTment logo"
        className="pointer-events-none fixed top-4 right-4 w-20 z-20"
        width={2048}
        height={2048}
      />
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
