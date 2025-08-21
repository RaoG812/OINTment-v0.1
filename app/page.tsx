// @ts-nocheck
import Link from 'next/link'
import HexBackground from '../components/HexBackground'

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <HexBackground />
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(at 25% 25%, rgba(30,58,138,0.4), transparent 60%), radial-gradient(at 75% 25%, rgba(46,16,101,0.4), transparent 60%), radial-gradient(at 50% 75%, rgba(255,255,255,0.2), transparent 70%)',
          backgroundColor: '#000',
          backgroundSize: '400% 400%',
          animation: 'bgMove 30s ease infinite'
        }}
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
            Upload ZIP
          </Link>
          <Link
            href="/matrix"
            className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 transition"
          >
            View Matrix
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
      <style jsx>{`
        @keyframes bgMove {
          0% { background-position: 0 0; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0 0; }
        }
      `}</style>
    </main>
  )
}
