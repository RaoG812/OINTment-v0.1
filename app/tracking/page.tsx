'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Line, Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

interface Commit {
  sha: string
  message: string
  date: string
  stats?: { total: number }
  parents: { sha: string }[]
  category?: string
  branch?: string
}

export default function TrackingPage() {
  const [repo, setRepo] = useState('')
  const [branch, setBranch] = useState('main')
  const [branches, setBranches] = useState<string[]>([])
  const [data, setData] = useState<Record<string, Commit[]>>({})
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
    const mainData = await fetch(`/api/github/commits?repo=${repo}&branch=${branch}`).then(r => r.json())
    if (branch === 'main') {
      const others = await Promise.all(
        branches.filter(b => b !== branch).slice(0, 3).map(async b => {
          const r = await fetch(`/api/github/commits?repo=${repo}&branch=${b}`)
          const d = await r.json()
          return [b, Array.isArray(d) ? d : []] as [string, Commit[]]
        })
      )
      setData(Object.fromEntries([[branch, Array.isArray(mainData) ? mainData : []], ...others]))
    } else {
      setData({ [branch]: Array.isArray(mainData) ? mainData : [] })
    }
  }

  const allCommits = useMemo(() => {
    const list: Commit[] = []
    Object.entries(data).forEach(([br, arr]) => {
      arr.forEach(c => list.push({ ...c, branch: br }))
    })
    return list
  }, [data])

  const sorted = useMemo(
    () => [...allCommits].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [allCommits]
  )

  const branchOffsets = useMemo(() => {
    const names = Object.keys(data)
    const mainIdx = names.indexOf('main')
    const map = new Map<string, number>()
    names.forEach((b, i) => {
      const offset = (i - (mainIdx === -1 ? 0 : mainIdx)) * 2
      map.set(b, offset)
    })
    return map
  }, [data])

  const positions = sorted.map((c, i) => ({
    commit: c,
    x: i * 3,
    y: branchOffsets.get(c.branch || '') || 0,
    size:
      Math.max(0.4, Math.min(2, (c.stats?.total || 1) / 50)) * (c.branch === 'main' ? 0.6 : 1),
    category: c.category || 'other'
  }))

  const posBySha = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>()
    positions.forEach(p => m.set(p.commit.sha, { x: p.x, y: p.y }))
    return m
  }, [positions])

  const controlsRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)

  function CameraRig({ target }: { target: number }) {
    const { camera } = useThree()
    useEffect(() => {
      const from = camera.position.clone()
      const to = topView ? new THREE.Vector3(0, 20, 0) : new THREE.Vector3(-10, 5, 20)
      const startRot = groupRef.current?.rotation.x || 0
      const endRot = topView ? -Math.PI / 2 : 0
      let t = 0
      const anim = () => {
        t += 0.05
        camera.position.lerpVectors(from, to, t)
        controlsRef.current?.target.lerp(new THREE.Vector3(target, 0, 0), t)
        controlsRef.current?.update()
        if (groupRef.current) {
          groupRef.current.rotation.x = THREE.MathUtils.lerp(startRot, endRot, t)
        }
        if (t < 1) requestAnimationFrame(anim)
      }
      anim()
    }, [topView, target, camera])
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
            <OrbitControls ref={controlsRef} enableRotate={false} />
            <CameraRig target={positions.length * 1.5} />
            <color attach="background" args={[0, 0, 0]} />
            <ambientLight intensity={0.4} />
            <pointLight position={[0, 5, 10]} intensity={1} />
            <group ref={groupRef}>
              {Array.from(branchOffsets.entries()).map(([b, y]) => (
                <Line
                  key={b}
                  points={[[0, y, 0], [positions.length * 3, y, 0]]}
                  color={b === 'main' ? '#10b981' : '#374151'}
                  lineWidth={1}
                />
              ))}
              {positions.map(p => (
                <mesh key={p.commit.sha} position={[p.x, p.y, 0]}>
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
                    position={[0, p.size + 0.5, 0]}
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
                  return (
                    <Line
                      key={`${p.commit.sha}-${par.sha}`}
                      points={[[p.x, p.y, 0], [parent.x, parent.y, 0]]}
                      color="#6b7280"
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
