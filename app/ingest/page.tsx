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
      <h1 className="text-2xl mb-4">Manual Ingest</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="file" name="file" accept=".zip" />
        <button type="submit" className="px-4 py-2 bg-zinc-800 rounded">Upload</button>
      </form>
      {result && (
        <pre className="mt-6 text-xs bg-zinc-900 p-4 rounded-xl overflow-auto max-h-96">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
