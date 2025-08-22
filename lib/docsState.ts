export interface DocItem {
  file: File
  name: string
  type: 'prd' | 'estimate' | 'other'
}

let docs: (DocItem | null)[] = Array(5).fill(null)

export function getDocs() {
  return docs
}

export function setDocs(newDocs: (DocItem | null)[]) {
  docs = newDocs
}
