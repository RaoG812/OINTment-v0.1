// @ts-nocheck
'use client'
import React, { useEffect, useMemo, useState, useRef } from 'react'
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
  offset?: { y: number; z: number }
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
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null)
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<{ filename: string; status: string; additions: number; deletions: number; patch?: string }[]>([])
  const closeModal = () => {
    setSelectedCommit(null)
    setSelectedFiles([])
  }

  const typeLayerLabels = [
    { text: 'Refactor', style: { top: '2%', left: '2%' } },
    { text: 'Infra', style: { top: '2%', left: '34%' } },
    { text: 'Fix', style: { top: '2%', right: '2%' } },
    { text: 'Test', style: { top: '34%', left: '2%' } },
    { text: 'Feature', style: { top: '34%', right: '2%' } },
    { text: 'Docs', style: { bottom: '2%', left: '2%' } },
    { text: 'Security', style: { bottom: '2%', left: '34%' } },
    { text: 'Data', style: { bottom: '2%', right: '2%' } }
  ]

  const domainLayerLabels = [
    { text: 'Frontend', style: { top: '2%', left: '2%' } },
    { text: 'Backend', style: { top: '27%', left: '2%' } },
    { text: 'DB', style: { top: '52%', left: '2%' } },
    { text: 'Other', style: { bottom: '2%', left: '2%' } }
  ]

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
  useEffect(() => {
    if (branch !== 'all') setHoveredBranch(null)
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

  const branchDomains = useMemo(() => {
    const map = new Map<string, string>()
    Object.entries(data).forEach(([b, arr]) => {
      if (!arr.length) return
      const counts = new Map<string, number>()
      arr.forEach(c => {
        const d = c.domain || 'other'
        counts.set(d, (counts.get(d) || 0) + 1)
      })
      const dom = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0]
      map.set(b, dom)
    })
    return map
  }, [data])

  const layerY = (d: string) =>
    d === 'frontend' ? 1.5 : d === 'backend' ? 0.5 : d === 'db' ? -0.5 : -1.5

  const branchPositions = useMemo(() => {
    const map = new Map<string, { y: number; z: number }>()
    map.set('main', { y: 0, z: 0 })
    const counters: Record<string, number> = {}
    Object.entries(data).forEach(([b]) => {
      if (b === 'main') return
      const dom = branchDomains.get(b) || 'other'
      const count = counters[dom] || 0
      const sign = count % 2 === 0 ? 1 : -1
      const depth = (Math.floor(count / 2) + 1) * 2 * sign
      counters[dom] = count + 1
      map.set(b, { y: layerY(dom), z: depth })
    })
    return map
  }, [data, branchDomains])
  const typeOffsets: Record<string, { y: number; z: number }> = {
    feature: { y: 0, z: 1 },
    fix: { y: 1, z: 1 },
    infra: { y: 1, z: 0 },
    refactor: { y: 1, z: -1 },
    test: { y: 0, z: -1 },
    docs: { y: -1, z: -1 },
    security: { y: -1, z: 0 },
    data: { y: -1, z: 1 }
  }

  // fallback directions when commit type can't be identified
  const otherDirs = [
    { y: 0, z: 1 },
    { y: 1, z: 1 },
    { y: 1, z: 0 },
    { y: 1, z: -1 },
    { y: 0, z: -1 },
    { y: -1, z: -1 },
    { y: -1, z: 0 },
    { y: -1, z: 1 }
  ]
  const latestSha = sorted.at(-1)?.sha
  const GRID_X = 3
  const positions = sorted.map((c, i) => {
    const base = branchPositions.get(c.branch || '') || { y: 0, z: 0 }
    const type =
      c.type && typeOffsets[c.type]
        ? typeOffsets[c.type]
        : otherDirs[parseInt(c.sha.slice(-1), 16) % otherDirs.length]
    return {
      commit: c,
      x: i * GRID_X,
      yBase: base.y,
      zBase: base.z,
      typeY: type.y,
      typeZ: type.z,
      size:
        Math.min(0.35, Math.max(0.2, (c.stats?.total || 1) / 200)) *
        (c.branch === 'main' ? 0.5 : 1),
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
      if (xs.length) map.set(b, { start: Math.min(...xs) * GRID_X, end: Math.max(...xs) * GRID_X })
    })
    return map
  }, [data, sorted])

  const posBySha = useMemo(() => {
    const m = new Map<string, { x: number; y: number; z: number }>()
    positions.forEach(p => m.set(p.commit.sha, { x: p.x, y: p.yBase, z: p.zBase }))
    return m
  }, [positions])

  const displayPositions: DisplayPos[] = useMemo(() => {
    return positions
      .filter(p => branch === 'all' || p.commit.branch === branch)
      .map(p => {
        const offset = p.commit.offset || { y: 0, z: 0 }
        const scale = branch === 'all' ? 1 : view === 'front' ? 1 : 0.3
        const seed = parseInt(p.commit.sha.slice(0, 4), 16)
        const jitterY = ((seed % 100) / 100 - 0.5) * 0.2
        const jitterZ = (((Math.floor(seed / 100)) % 100) / 100 - 0.5) * 0.2
        return {
          commit: p.commit,
          x: Math.round(p.x / GRID_X) * GRID_X,
          y:
            (branch === 'all'
              ? p.yBase + offset.y
              : p.yBase + p.typeY * scale + offset.y * scale) + jitterY,
          z:
            (branch === 'all'
              ? p.zBase + offset.z
              : p.zBase + p.typeZ * scale + offset.z * scale) + jitterZ,
          size: p.size,
          status: p.status,
          current: p.current
        } as DisplayPos
      })
  }, [positions, branch, view])

  const branchOrigins = useMemo(() => {
    const map = new Map<string, { x: number; y: number; z: number }>()
    Object.entries(data).forEach(([b, arr]) => {
      if (b === 'main' || arr.length === 0) return
      const parentSha = arr[0].parents?.[0]?.sha
      const parentPos = parentSha ? posBySha.get(parentSha) : undefined
      if (parentPos) map.set(b, parentPos)
    })
    return map
  }, [data, posBySha])

  const selectCommit = async (c: Commit) => {
    setSelectedCommit(c)
    try {
      const r = await fetch(`/api/github/commit?repo=${repo}&sha=${c.sha}`)
      const j = await r.json()
      setSelectedFiles(Array.isArray(j.files) ? j.files : [])
    } catch {
      setSelectedFiles([])
    }
  }

  const selectedPos = branchPositions.get(branch) || { y: 0, z: 0 }
  const pipes: [string, { y: number; z: number }][] =
    branch === 'all'
      ? Array.from(branchPositions.entries())
      : ([[branch, selectedPos]] as [string, { y: number; z: number }][])

  const controlsRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)

  function CameraRig({
    target,
    view,
    offset,
    range
  }: {
    target: number
    view: '3d' | 'top' | 'front'
    offset: number
    range?: { start: number; end: number }
  }) {
    const { camera } = useThree()
    useEffect(() => {
      const from = camera.position.clone()
      let to: THREE.Vector3
      let tgt: THREE.Vector3
      if (range) {
        const center = (range.start + range.end) / 2
        if (view === 'top') {
          to = new THREE.Vector3(center, offset, 40)
          tgt = new THREE.Vector3(center, offset, 0)
          camera.up.set(0, 1, 0)
        } else if (view === 'front') {
          to = new THREE.Vector3(range.start - 10, offset, 0)
          tgt = new THREE.Vector3(range.end, offset, 0)
          camera.up.set(0, 0, 1)
        } else {
          to = new THREE.Vector3(range.start - 10, offset, 5)
          tgt = new THREE.Vector3(range.end, offset, 0)
          camera.up.set(0, 1, 0)
        }
      } else {
        if (view === 'top') {
          to = new THREE.Vector3(target / 2, offset, 40)
          tgt = new THREE.Vector3(target / 2, offset, 0)
          camera.up.set(0, 1, 0)
        } else if (view === 'front') {
          to = new THREE.Vector3(-40, offset, 0)
          tgt = new THREE.Vector3(target, offset, 0)
          camera.up.set(0, 0, 1)
        } else {
          to = new THREE.Vector3(-10, offset, 20)
          tgt = new THREE.Vector3(target / 2, offset, 0)
          camera.up.set(0, 1, 0)
        }
      }
      const startRot = groupRef.current?.rotation.clone() || new THREE.Euler()
      const endRot = new THREE.Euler(0, 0, 0)
      let t = 0
      const anim = () => {
        t += 0.05
        camera.position.lerpVectors(from, to, t)
        controlsRef.current?.target.lerp(tgt, t)
        controlsRef.current?.update()
        if (groupRef.current) {
          groupRef.current.rotation.x = THREE.MathUtils.lerp(startRot.x, endRot.x, t)
          groupRef.current.rotation.y = THREE.MathUtils.lerp(startRot.y, endRot.y, t)
          groupRef.current.rotation.z = THREE.MathUtils.lerp(startRot.z, endRot.z, t)
        }
        if (t < 1) requestAnimationFrame(anim)
      }
      anim()
    }, [view, target, offset, range, camera])
    return null
  }

  function CommitSphere({ p, onSelect }: { p: DisplayPos; onSelect: (c: Commit) => void }) {
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
          onClick={() => onSelect(p.commit)}
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
              <ringGeometry args={[p.size + 0.02, p.size + 0.04, 32]} />
              <meshBasicMaterial color="#fff" />
            </mesh>
            <Html distanceFactor={50} position={[0, p.size + 0.2, 0]} zIndexRange={[100, 0]}>
              <div className="text-[5px] bg-emerald-600/80 text-white px-1 py-0.5 rounded">WE ARE HERE</div>
            </Html>
          </>
        )}
        {hovered && (
          <Html distanceFactor={30} position={[0, p.size + 0.3, 0]} zIndexRange={[100, 0]}>
            <div className="text-[8px] bg-black/70 text-white px-1 py-0.5 rounded whitespace-nowrap">
              {p.commit.sha.slice(0, 7)} {p.commit.message}
            </div>
          </Html>
        )}
      </group>
    )
  }

  function BranchPipe({
    b,
    curve,
    range,
    offset,
    depth
  }: {
    b: string
    curve: THREE.CatmullRomCurve3
    range: { start: number; end: number }
    offset: number
    depth: number
  }) {
    const matRef = useRef<THREE.MeshPhysicalMaterial>(null)
    const active = hoveredBranch === b
    useFrame(() => {
      if (matRef.current) {
        const target = active ? 0.05 : 0.25
        matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, target, 0.1)
      }
    })
    const main = b === 'main'
    const color = main ? '#22d3ee' : '#a855f7'
    return (
      <group>
        <mesh raycast={() => null}>
          <tubeGeometry args={[curve, 64, 0.5, 16, false]} />
          <meshPhysicalMaterial
            ref={matRef}
            color={color}
            transparent
            opacity={0.25}
            roughness={0}
            metalness={0}
            transmission={0.9}
            thickness={0.4}
            depthWrite={false}
          />
        </mesh>
        <Line
          points={curve.getPoints(32)}
          color={color}
          lineWidth={2}
          transparent
          opacity={0.8}
          toneMapped={false}
          onPointerOver={() => setHoveredBranch(b)}
          onPointerOut={() => setHoveredBranch(null)}
          onClick={() => setBranch(b)}
        />
        <Html position={[range.start, offset + 0.3, depth]} zIndexRange={[100, 0]}>
          <div className="text-[10px] text-zinc-400 bg-black/60 px-1 rounded">{b}</div>
        </Html>
      </group>
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
            onClick={() => {
              setView('front')
              setShowLayers(s => !s)
            }}
            className={`px-3 py-2 rounded text-sm ${showLayers ? 'bg-emerald-600' : 'bg-zinc-800'}`}
          >
            Layers
          </button>
        </div>
        <div className="h-[500px] w-full bg-black/40 rounded-xl overflow-hidden relative">
          <Canvas>
            {view === '3d' ? (
              <PerspectiveCamera makeDefault position={[-10, selectedPos.y, 20]} fov={50} />
            ) : (
              <OrthographicCamera
                makeDefault
                position={
                  view === 'top'
                    ? [displayPositions.length * 1.5, 0, 40]
                    : [-40, 0, 0]
                }
                zoom={view === 'front' ? 30 : 40}
              />
            )}
          <OrbitControls
            ref={controlsRef}
            enableRotate={view === '3d'}
            enablePan={view !== 'front'}
            enableZoom={view !== 'front'}
            screenSpacePanning={view !== 'front'}
          />
            <CameraRig
              target={displayPositions.length * GRID_X}
              view={view}
              offset={selectedPos.y}
              range={showLayers ? undefined : branch === 'all' ? undefined : branchRanges.get(branch)}
            />
            <color attach="background" args={[0, 0, 0]} />
            <ambientLight intensity={0.4} />
            <pointLight position={[0, 5, 10]} intensity={1} />
            <EffectComposer>
              <Bloom luminanceThreshold={0.4} intensity={0.8} />
            </EffectComposer>
            <group ref={groupRef}>
              {pipes.map(([b, pos]) => {
                const range = branchRanges.get(b) || { start: 0, end: displayPositions.length * GRID_X }
                const len = range.end - range.start
                const origin = branchOrigins.get(b)
                const offset = pos.y
                const z = pos.z
                const basePoints =
                  b === 'main'
                    ? [
                        new THREE.Vector3(range.start, offset, z),
                        new THREE.Vector3(range.end, offset, z)
                      ]
                    : origin
                    ? (() => {
                        const dir = range.start - origin.x
                        const first = new THREE.Vector3(
                          origin.x + Math.min(1, dir * 0.2),
                          origin.y + offset * 0.1,
                          z
                        )
                        return [
                          new THREE.Vector3(origin.x, origin.y, origin.z),
                          first,
                          new THREE.Vector3(range.start, offset * 0.3, z),
                          new THREE.Vector3(range.start + len * 0.3, offset * 0.6, z),
                          new THREE.Vector3(range.start + len * 0.6, offset, z),
                          new THREE.Vector3(range.end, offset, z)
                        ]
                      })()
                    : [
                        new THREE.Vector3(range.start, 0, z),
                        new THREE.Vector3(range.start + len * 0.3, offset * 0.3, z),
                        new THREE.Vector3(range.start + len * 0.6, offset, z),
                        new THREE.Vector3(range.end, offset, z)
                      ]
                const curve = new THREE.CatmullRomCurve3(basePoints)
                return <BranchPipe key={b} b={b} curve={curve} range={range} offset={offset} depth={z} />
              })}
              {displayPositions.map(p => (
                <CommitSphere key={p.commit.sha} p={p} onSelect={selectCommit} />
              ))}
            </group>
          </Canvas>
          {view === 'front' && showLayers && (
            <div
              className={`absolute inset-0 pointer-events-none ${
                branch === 'all' ? 'grid-overlay-4' : 'grid-overlay-3'
              }`}
            >
              {(branch === 'all' ? domainLayerLabels : typeLayerLabels).map(l => (
                <span
                  key={l.text}
                  className="absolute text-[10px] text-white/40"
                  style={l.style as React.CSSProperties}
                >
                  {l.text}
                </span>
              ))}
            </div>
          )}
          <>
            <div className="absolute top-2 right-2 text-[10px] space-y-1">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981]"></span>Success</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>Pending</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>Failure</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#6b7280]"></span>Unknown</div>
            </div>
            <div className="absolute bottom-2 left-2 text-[10px] space-y-1">
              <div className="flex items-center gap-1"><span className="w-4 h-1 bg-[#22d3ee]"></span>Main pipe</div>
              <div className="flex items-center gap-1"><span className="w-4 h-1 bg-[#a855f7]"></span>Branch pipe</div>
            </div>
          </>
          {selectedCommit && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50" onClick={closeModal}>
                <div className="bg-zinc-900 p-4 rounded-xl max-h-[80%] w-80 overflow-y-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <div className="text-sm font-semibold mb-2">{selectedCommit.message}</div>
                <ul className="space-y-1 text-xs">
                    {selectedFiles.map(
                      (f: {
                        filename: string
                        status: string
                        additions: number
                        deletions: number
                        patch?: string
                      }) => (
                        <li key={f.filename} className="flex justify-between">
                          <span>{f.filename}</span>
                          <span className="text-zinc-500">{f.status}</span>
                        </li>
                      )
                    )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
