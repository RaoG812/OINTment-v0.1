import type { DashboardData } from './types.oint'

let data: DashboardData | null = null
let listeners: Set<() => void> = new Set()

export function getOintData() {
  if (!data && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('ointData')
      if (stored) data = JSON.parse(stored) as DashboardData
    } catch {}
  }
  return data
}

export function subscribeOintData(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function setOintData(d: DashboardData | null) {
  data = d
  if (typeof window !== 'undefined') {
    try {
      if (d) localStorage.setItem('ointData', JSON.stringify(d))
      else localStorage.removeItem('ointData')
    } catch {}
  }
  listeners.forEach(l => l())
}

