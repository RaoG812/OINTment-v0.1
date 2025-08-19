'use client'

import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'

interface Commit {
  sha: string
  message: string
  date: string
  stats?: { total: number }
  parents: { sha: string }[]
}

function categoryOf(message: string) {
  const m = message.toLowerCase()
  if (m.includes('backend')) return 'backend'
  if (m.includes('frontend') || m.includes('ui')) return 'frontend'
  if (m.includes('db') || m.includes('database')) return 'db'
  return 'other'
}

export default function TrackingPage() {
  const [repo, setRepo] = useState('')
  const [branch, setBranch] = useState('main')
  const [commits, setCommits] = useState<Commit[]>([])
  const [topView, setTopView] = useState(false)

  const load = async () => {
    if (!repo) return
    const res = await fetch(`/api/github/commits?repo=${repo}&branch=${branch}`)
    const data = await res.json()
    setCommits(Array.isArray(data) ? data : [])
  }

  const positions = commits.map((c, i) => ({
    commit: c,
    x: i * 3,
    y: 0,
    z: 0,
    category: categoryOf(c.message),
    size: Math.max(0.5, Math.min(2, (c.stats?.total || 1) / 50)),
  }))

  const categoryYOffset: Record<string, number> = {
    backend: 3,
    frontend: 1,
    db: -1,
    other: -3,
  }

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
          <button
            onClick={() => setTopView(v => !v)}
            className="px-3 py-2 rounded bg-zinc-800 text-sm"
          >
            {topView ? '3D view' : 'Top view'}
          </button>
        </div>
        <div className="h-[500px] w-full bg-black/40 rounded-xl overflow-hidden">
          <Canvas camera={{ position: [0, 5, 20], fov: 50 }}>
            <color attach="background" args={[0, 0, 0]} />
            <ambientLight intensity={0.5} />
            <group rotation={[topView ? -Math.PI / 2 : 0, 0, 0]}
                   position={[0, topView ? 0 : 0, 0]}>
              {/* main line */}
              <Line points={[[0,0,0],[positions.length * 3,0,0]]} color="#0f0" lineWidth={1} />
              {positions.map((p, i) => (
                <mesh key={p.commit.sha} position={[p.x, topView ? categoryYOffset[p.category] : 0, 0]}>
                  <sphereGeometry args={[p.size, 16, 16]} />
                  <meshStandardMaterial color={p.category === 'backend' ? '#3b82f6' : p.category === 'frontend' ? '#a855f7' : p.category === 'db' ? '#f59e0b' : '#ef4444'} />
                </mesh>
              ))}
            </group>
            <OrbitControls enablePan enableZoom enableRotate />
          </Canvas>
        </div>
      </div>
    </div>
  )
}
