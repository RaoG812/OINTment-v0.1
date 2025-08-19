'use client'
import { useState } from 'react'

export default function IngestPage() {
  const [result, setResult] = useState<any>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const file = (e.currentTarget.elements.namedItem('file') as HTMLInputElement).files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/ingest', { method: 'POST', body: form })
    setResult(await res.json())
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-200 p-10">
      <h1 className="text-2xl mb-6 font-semibold tracking-tight">Manual Ingest</h1>
      <form onSubmit={onSubmit} className="space-y-4 max-w-md">
        <input
          type="file"
          name="file"
          accept=".zip"
          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 text-sm font-medium rounded-lg hover:bg-emerald-500 transition"
        >
          Upload and Analyze
        </button>
      </form>
      {result && (
        <pre className="mt-8 text-xs bg-zinc-900 p-4 rounded-xl overflow-auto max-h-96">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
