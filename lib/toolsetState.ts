import type { DashboardData } from './types.oint'

let data: DashboardData | null = null

export function getOintData() {
  return data
}

export function setOintData(d: DashboardData | null) {
  data = d
}
