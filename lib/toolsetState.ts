import type { DashboardData } from './types.oint'

let data: DashboardData | null = null
let listeners: Set<() => void> = new Set()

export function getOintData() {
  return data
}

export function subscribeOintData(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function setOintData(d: DashboardData | null) {
  data = d
  listeners.forEach(l => l())
}

