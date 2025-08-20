// @ts-nocheck
import Link from 'next/link';

export default function Home() {
  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">PM Control Suite</h1>
        <p className="text-sm text-zinc-400">A prototype dashboard for inspecting repository integrations.</p>
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
    </main>
  );
}
