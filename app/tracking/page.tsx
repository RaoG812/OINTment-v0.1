'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import {
  Line,
  Html,
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera
} from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

interface Commit {
  sha: string
  message: string
  date: string
  stats?: { total: number }
  parents: { sha: string }[]
  domain?: string
  type?: string
  branch?: string
  status?: string
}

interface DisplayPos {
  commit: Commit
  x: number
  y: number
  z: number
  size: number
  status: string
  current: boolean
}

export default function TrackingPage() {
  const [repo, setRepo] = useState('')
  const [branch, setBranch] = useState('all')
  const [branches, setBranches] = useState<string[]>([])
  const [data, setData] = useState<Record<string, Commit[]>>({})
  const [view, setView] = useState<'3d' | 'top' | 'front'>('3d')
  const [showLayers, setShowLayers] = useState(false)

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
    const entries = await Promise.all(
      branches.map(async b => {
        const r = await fetch(`/api/github/commits?repo=${repo}&branch=${b}`)
        const d = await r.json()
        return [b, Array.isArray(d) ? d : []] as [string, Commit[]]
      })
    )
    setData(Object.fromEntries(entries))
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

  const domainOffset = (d: string) =>
    d === 'backend' ? 0.6 : d === 'frontend' ? 0.2 : d === 'db' ? -0.2 : -0.6
  const typeOffsets: Record<string, { y: number; z: number }> = {
    feature: { y: 0, z: 0.5 },
    fix: { y: 0.5, z: 0.5 },
    infra: { y: 0.5, z: 0 },
    refactor: { y: 0.5, z: -0.5 },
    test: { y: 0, z: -0.5 },
    docs: { y: -0.5, z: -0.5 },
    security: { y: -0.5, z: 0 },
    data: { y: -0.5, z: 0.5 },
    other: { y: 0, z: 0 }
  }
  const latestSha = sorted.at(-1)?.sha
  const positions = sorted.map((c, i) => {
    const baseY = branchOffsets.get(c.branch || '') || 0
    const domZ = domainOffset(c.domain || 'other')
    const type = typeOffsets[c.type || 'other']
    return {
      commit: c,
      x: i * 3,
      yBase: baseY,
      domainZ: domZ,
      typeY: type.y,
      typeZ: type.z,
      size:
        Math.max(0.4, Math.min(2, (c.stats?.total || 1) / 50)) * (c.branch === 'main' ? 0.6 : 1),
      status: c.status || 'unknown',
      current: c.sha === latestSha
    }
  })

  const branchRanges = useMemo(() => {
    const map = new Map<string, { start: number; end: number }>()
    Object.entries(data).forEach(([b, arr]) => {
      const xs = arr
        .map(c => sorted.findIndex(s => s.sha === c.sha))
        .filter(i => i >= 0)
      if (xs.length) map.set(b, { start: Math.min(...xs) * 3, end: Math.max(...xs) * 3 })
    })
    return map
  }, [data, sorted])

  const displayPositions: DisplayPos[] = useMemo(() => {
    return positions
      .filter(p => branch === 'all' || p.commit.branch === branch)
      .map(p => {
        const jitter = ((parseInt(p.commit.sha.slice(0, 2), 16) % 20) - 10) / 100
        return {
          commit: p.commit,
          x: p.x,
          y: branch === 'all' ? p.yBase : p.yBase + p.typeY,
          z: branch === 'all' ? p.domainZ + jitter : p.typeZ + jitter,
          size: p.size,
          status: p.status,
          current: p.current
        } as DisplayPos
      })
  }, [positions, branch])

  const displayPosBySha = useMemo(() => {
    const m = new Map<string, { x: number; y: number; z: number }>()
    displayPositions.forEach(p => m.set(p.commit.sha, { x: p.x, y: p.y, z: p.z }))
    return m
  }, [displayPositions])

  const selectedOffset = branch === 'all' ? 0 : branchOffsets.get(branch) || 0
  const pipes: [string, number][] =
    branch === 'all'
      ? Array.from(branchOffsets.entries())
      : ([[branch, selectedOffset]] as [string, number][])

  const controlsRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)

  function CameraRig({ target, view, offset }: { target: number; view: '3d' | 'top' | 'front'; offset: number }) {
    const { camera } = useThree()
    useEffect(() => {
      const from = camera.position.clone()
      let to = new THREE.Vector3(-10, offset, 20)
      let tgt = new THREE.Vector3(target / 2, offset, 0)
      let rotX = 0
      let rotY = 0
      if (view === 'top') {
        to = new THREE.Vector3(target / 2, 40, offset)
        tgt = new THREE.Vector3(target / 2, offset, 0)
        camera.up.set(0, 0, 1)
      } else if (view === 'front') {
        to = new THREE.Vector3(-40, offset, 0)
        tgt = new THREE.Vector3(target, offset, 0)
        camera.up.set(0, 0, 1)
      } else {
        camera.up.set(0, 1, 0)
      }
      const startX = groupRef.current?.rotation.x || 0
      const startY = groupRef.current?.rotation.y || 0
      let t = 0
      const anim = () => {
        t += 0.05
        camera.position.lerpVectors(from, to, t)
        controlsRef.current?.target.lerp(tgt, t)
        controlsRef.current?.update()
        if (groupRef.current) {
          groupRef.current.rotation.x = THREE.MathUtils.lerp(startX, rotX, t)
          groupRef.current.rotation.y = THREE.MathUtils.lerp(startY, rotY, t)
        }
        if (t < 1) requestAnimationFrame(anim)
      }
      anim()
    }, [view, target, offset, camera])
    return null
  }

  function CommitSphere({ p }: { p: DisplayPos }) {
    const ref = useRef<THREE.Mesh>(null)
    const [hovered, setHovered] = useState(false)
    const scale = useRef(1)
    const color = useMemo(() => {
      return p.status === 'success'
        ? '#10b981'
        : p.status === 'pending'
        ? '#f59e0b'
        : p.status === 'failure' || p.status === 'error'
        ? '#ef4444'
        : '#6b7280'
    }, [p.status])
    useFrame(({ clock }) => {
      const t = clock.getElapsedTime()
      const target = hovered ? 1.3 : 1
      scale.current = THREE.MathUtils.lerp(scale.current, target, 0.1)
      ref.current?.scale.setScalar(scale.current)
      const mat = ref.current?.material as THREE.MeshBasicMaterial
      if (mat) mat.opacity = 0.6 + Math.sin(t * 3) * 0.2
    })
    return (
      <group position={[p.x, p.y, p.z]}>
        <mesh
          ref={ref}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[p.size, 16, 16]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.8} />
        </mesh>
        <mesh scale={1.2}>
          <sphereGeometry args={[p.size, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.2} blending={THREE.AdditiveBlending} />
        </mesh>
        {p.current && (
          <>
            <mesh>
              <ringGeometry args={[p.size + 0.1, p.size + 0.2, 32]} />
              <meshBasicMaterial color="#fff" />
            </mesh>
            <Html distanceFactor={10} position={[0, p.size + 0.3, 0]}>
              <div className="text-[6px] bg-emerald-600/80 text-white px-1 py-0.5 rounded">WE ARE HERE</div>
            </Html>
          </>
        )}
        {hovered && (
          <Html distanceFactor={10} position={[0, p.size + 0.5, 0]}>
            <div className="text-[10px] bg-black/70 text-white px-1 py-0.5 rounded whitespace-nowrap">
              {p.commit.sha.slice(0, 7)} {p.commit.message}
            </div>
          </Html>
        )}
      </group>
    )
  }

  function BranchGrid({ length }: { length: number }) {
    return (
      <mesh position={[length / 2, selectedOffset, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[length, 1, Math.max(1, Math.round(length)), 3]} />
        <meshBasicMaterial color="#334155" wireframe />
      </mesh>
    )
  }

  function AllGrid({ length }: { length: number }) {
    return (
      <mesh position={[length / 2, selectedOffset, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[length, 2.4, Math.max(1, Math.round(length)), 4]} />
        <meshBasicMaterial color="#334155" wireframe />
      </mesh>
    )
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
            <option value="all">all</option>
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
            onClick={() => setView('3d')}
            className={`px-3 py-2 rounded text-sm ${view === '3d' ? 'bg-emerald-600' : 'bg-zinc-800'}`}
          >
            3D
          </button>
          <button
            onClick={() => setView('top')}
            className={`px-3 py-2 rounded text-sm ${view === 'top' ? 'bg-emerald-600' : 'bg-zinc-800'}`}
          >
            Top
          </button>
          <button
            onClick={() => setView('front')}
            className={`px-3 py-2 rounded text-sm ${view === 'front' ? 'bg-emerald-600' : 'bg-zinc-800'}`}
          >
            Front
          </button>
          <button
            onClick={() => setShowLayers(s => !s)}
            className={`px-3 py-2 rounded text-sm ${showLayers ? 'bg-emerald-600' : 'bg-zinc-800'}`}
          >
            Layers
          </button>
        </div>
        <div className="h-[500px] w-full bg-black/40 rounded-xl overflow-hidden relative">
          <Canvas>
            {view === '3d' ? (
              <PerspectiveCamera makeDefault position={[-10, selectedOffset, 20]} fov={50} />
            ) : (
              <OrthographicCamera
                makeDefault
                position={view === 'top' ? [displayPositions.length * 1.5, 40, selectedOffset] : [-40, selectedOffset, 0]}
                zoom={40}
              />
            )}
            <OrbitControls ref={controlsRef} enableRotate={view === '3d'} />
            <CameraRig target={displayPositions.length * 3} view={view} offset={selectedOffset} />
            <color attach="background" args={[0, 0, 0]} />
            <ambientLight intensity={0.4} />
            <pointLight position={[0, 5, 10]} intensity={1} />
            <EffectComposer>
              <Bloom luminanceThreshold={0.4} intensity={0.8} />
            </EffectComposer>
            <group ref={groupRef}>
              {view === 'front' && showLayers && (
                branch === 'all' ? (
                  <AllGrid length={displayPositions.length * 3} />
                ) : (
                  <BranchGrid length={(branchRanges.get(branch)?.end || 0) - (branchRanges.get(branch)?.start || 0)} />
                )
              )}
              {pipes.map(([b, offset]) => {
                const range = branchRanges.get(b) || { start: 0, end: displayPositions.length * 3 }
                const len = range.end - range.start
                const points =
                  b === 'main'
                    ? [
                        new THREE.Vector3(range.start, 0, 0),
                        new THREE.Vector3(range.end, 0, 0)
                      ]
                    : [
                        new THREE.Vector3(range.start, 0, 0),
                        new THREE.Vector3(range.start + len * 0.3, offset * 0.3, 0),
                        new THREE.Vector3(range.start + len * 0.6, offset, 0),
                        new THREE.Vector3(range.end, offset, 0)
                      ]
                const curve = new THREE.CatmullRomCurve3(points)
                return (
                  <group key={b}>
                    {branch === 'all' && (
                      <mesh onClick={() => setBranch(b)}>
                        <tubeGeometry args={[curve, 64, 0.6, 16, false]} />
                        <meshPhysicalMaterial
                          color="#a855f7"
                          transparent
                          opacity={0.25}
                          roughness={0}
                          metalness={0}
                          transmission={1}
                        />
                      </mesh>
                    )}
                    <Line
                      points={curve.getPoints(32)}
                      color="#a855f7"
                      lineWidth={2}
                      transparent
                      opacity={0.8}
                      toneMapped={false}
                    />
                    {branch === 'all' && (
                      <Html position={[range.start, offset + 0.3, 0]}>
                        <div className="text-[10px] text-zinc-400 bg-black/60 px-1 rounded">{b}</div>
                      </Html>
                    )}
                  </group>
                )
              })}
              {displayPositions.map(p => (
                <CommitSphere key={p.commit.sha} p={p} />
              ))}
              {displayPositions.map(p =>
                p.commit.parents?.map(par => {
                  const parent = displayPosBySha.get(par.sha)
                  if (!parent) return null
                  return (
                    <Line
                      key={`${p.commit.sha}-${par.sha}`}
                      points={[[p.x, p.y, p.z], [parent.x, parent.y, parent.z]]}
                      color="#e5e7eb"
                      lineWidth={2}
                      transparent
                      opacity={0.5}
                      toneMapped={false}
                    />
                  )
                })
              )}
            </group>
          </Canvas>
          <div className="absolute top-2 right-2 text-[10px] space-y-1">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981]"></span>Success</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>Pending</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>Failure</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#6b7280]"></span>Unknown</div>
          </div>
        </div>
      </div>
    </div>
  )
}
