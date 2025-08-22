'use client'
import { useState } from 'react'
import Link from 'next/link'
import HexBackground from '../components/HexBackground'

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(false)

  async function create() {
    if (!files || files.length === 0) return
    setLoading(true)
    try {
      const form = new FormData()
      Array.from(files).forEach(f => form.append('files', f))
      await fetch('/api/oint/create', { method: 'POST', body: form })
      setCreated(true)
    } finally {
      setLoading(false)
    }
  }

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
        <div className="space-y-4">
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            onChange={e => setFiles(e.target.files)}
            className="block text-sm text-zinc-400"
          />
          <button
            onClick={create}
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-sm font-medium rounded-lg hover:bg-emerald-500 transition"
          >
            {loading ? 'Creating OINT…' : 'Create OINT'}
          </button>
          {created && (
            <Link href="/toolset" className="text-sm text-zinc-400 underline">
              Go to Toolset
            </Link>
          )}
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
