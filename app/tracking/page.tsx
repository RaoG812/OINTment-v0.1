'use client'

import { useEffect, useMemo, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Line, Html } from '@react-three/drei'

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
  const [branches, setBranches] = useState<string[]>([])
  const [commits, setCommits] = useState<Commit[]>([])
  const [topView, setTopView] = useState(false)

  // Load stored repo/branch on mount
  useEffect(() => {
    const storedRepo = localStorage.getItem('repo')
    const storedBranch = localStorage.getItem('branch')
    if (storedRepo) setRepo(storedRepo)
    if (storedBranch) setBranch(storedBranch)
  }, [])

  // Persist repo and branch selections
  useEffect(() => {
    if (repo) localStorage.setItem('repo', repo)
  }, [repo])
  useEffect(() => {
    if (branch) localStorage.setItem('branch', branch)
  }, [branch])

  // Fetch branches only when repo looks valid
  useEffect(() => {
    const handle = setTimeout(() => {
      if (/^[\w.-]+\/[\w.-]+$/.test(repo)) {
        fetch(`/api/github/branches?repo=${repo}`)
          .then(r => (r.ok ? r.json() : []))
          .then(data => setBranches(Array.isArray(data) ? data : []))
          .catch(() => setBranches([]))
      } else {
        setBranches([])
      }
    }, 300)
    return () => clearTimeout(handle)
  }, [repo])

  const load = async () => {
    if (!repo) return
    const res = await fetch(`/api/github/commits?repo=${repo}&branch=${branch}`)
    const data = await res.json()
    setCommits(Array.isArray(data) ? data : [])
  }
  const sorted = useMemo(
    () => [...commits].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [commits]
  )

  const positions = sorted.map((c, i) => ({
    commit: c,
    x: i * 3,
    category: categoryOf(c.message),
    size: Math.max(0.5, Math.min(2, (c.stats?.total || 1) / 50))
  }))

  const posBySha = useMemo(() => {
    const m = new Map<string, { x: number; category: string }>()
    positions.forEach(p => m.set(p.commit.sha, { x: p.x, category: p.category }))
    return m
  }, [positions])

  const categoryYOffset: Record<string, number> = {
    backend: 3,
    frontend: 1,
    db: -1,
    other: -3,
  }

  function CameraRig({ count }: { count: number }) {
    const { camera } = useThree()
    useEffect(() => {
      if (topView) {
        camera.position.set(0, 20, 0)
        camera.lookAt(count * 1.5, 0, 0)
      } else {
        camera.position.set(-10, 5, 20)
        camera.lookAt(count * 1.5, 0, 0)
      }
    }, [topView, count, camera])
    return null
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
          <select
            value={branch}
            onChange={e => setBranch(e.target.value)}
            className="px-3 py-2 rounded bg-zinc-900 border border-zinc-800 text-sm"
          >
            {branches.map(b => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
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
        <div className="h-[500px] w-full bg-black/40 rounded-xl overflow-hidden relative">
          <Canvas camera={{ position: [-10, 5, 20], fov: 50 }}>
            <CameraRig count={positions.length} />
            <color attach="background" args={[0, 0, 0]} />
            <ambientLight intensity={0.4} />
            <pointLight position={[0, 5, 10]} intensity={1} />
            <group rotation={[topView ? -Math.PI / 2 : 0, 0, 0]}>
              <Line points={[[0, 0, 0], [positions.length * 3, 0, 0]]} color="#10b981" lineWidth={1} />
              {positions.map(p => (
                <mesh key={p.commit.sha} position={[p.x, topView ? categoryYOffset[p.category] : 0, 0]}>
                  <sphereGeometry args={[p.size, 32, 32]} />
                  <meshStandardMaterial
                    color={
                      p.category === 'backend'
                        ? '#3b82f6'
                        : p.category === 'frontend'
                        ? '#a855f7'
                        : p.category === 'db'
                        ? '#f59e0b'
                        : '#ef4444'
                    }
                    emissive="#ffffff"
                    emissiveIntensity={0.1}
                  />
                  <Html
                    distanceFactor={10}
                    position={[0, topView ? 0.5 : p.size + 0.5, 0]}
                  >
                    <div className="text-[10px] bg-black/70 text-white px-1 py-0.5 rounded whitespace-nowrap">
                      {p.commit.sha.slice(0, 7)} {p.commit.message}
                    </div>
                  </Html>
                </mesh>
              ))}
              {positions.map(p =>
                p.commit.parents?.map(par => {
                  const parent = posBySha.get(par.sha)
                  if (!parent) return null
                  const y1 = topView ? categoryYOffset[p.category] : 0
                  const y2 = topView ? categoryYOffset[parent.category] : 0
                  return (
                    <Line
                      key={`${p.commit.sha}-${par.sha}`}
                      points={[[p.x, y1, 0], [parent.x, y2, 0]]}
                      color="#374151"
                      lineWidth={1}
                    />
                  )
                })
              )}
            </group>
          </Canvas>
          <div className="absolute top-2 right-2 text-[10px] space-y-1">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>Backend</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#a855f7]"></span>Frontend</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>DB</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>Other</div>
          </div>
        </div>
      </div>
    </div>
  )
}
