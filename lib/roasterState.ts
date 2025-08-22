export type Department = 'frontend' | 'backend' | 'ops'
export type Comment = { department: string; comment: string; temperature: number }

const empty: Record<Department, Comment> = {
  frontend: { department: 'frontend', comment: 'Awaiting review', temperature: 0 },
  backend: { department: 'backend', comment: 'Awaiting review', temperature: 0 },
  ops: { department: 'ops', comment: 'Awaiting review', temperature: 0 }
}

export type RoasterState = {
  level: number
  widgets: Record<Department, Comment>
  ointWidgets: Record<Department, Comment> | null
  healed: boolean
}

let state: RoasterState = {
  level: 0.5,
  widgets: empty,
  ointWidgets: null,
  healed: false
}

export function getRoasterState(): RoasterState {
  return state
}

export function setRoasterState(partial: Partial<RoasterState>) {
  state = { ...state, ...partial }
}
