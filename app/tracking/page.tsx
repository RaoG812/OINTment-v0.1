'use client';

import { useState } from 'react';

export default function TrackingPage() {
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [commits, setCommits] = useState<any[]>([]);

  const load = async () => {
    if (!repo) return;
    const res = await fetch(`/api/github/commits?repo=${repo}&branch=${branch}`);
    const data = await res.json();
    setCommits(Array.isArray(data) ? data : []);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-200">
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Tracking</h1>
        <div className="flex flex-wrap gap-2">
          <input
            value={repo}
            onChange={e => setRepo(e.target.value)}
            placeholder="owner/repo"
            className="px-3 py-2 rounded bg-zinc-900 border border-zinc-800 text-sm"
          />
          <input
            value={branch}
            onChange={e => setBranch(e.target.value)}
            placeholder="branch"
            className="px-3 py-2 rounded bg-zinc-900 border border-zinc-800 text-sm"
          />
          <button
            onClick={load}
            className="px-3 py-2 rounded bg-emerald-600 text-sm hover:bg-emerald-500"
          >
            Load
          </button>
        </div>
        <div className="relative pl-4 before:absolute before:left-2 before:top-0 before:bottom-0 before:w-px before:bg-zinc-800">
          {commits.map(c => (
            <div key={c.sha} className="mb-4 pl-4 relative">
              <div className="absolute -left-2 top-1 w-3 h-3 rounded-full bg-emerald-500" />
              <div className="text-sm font-medium">
                {c.message.split('\n')[0]}
              </div>
              <div className="text-xs text-zinc-400">
                {c.sha.slice(0, 7)} • {new Date(c.date).toLocaleString()} • {c.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

