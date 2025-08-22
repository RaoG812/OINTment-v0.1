let created = false
let finance = false
let knowledge: { docs: { name: string; text: string }[]; files: string[] } = {
  docs: [],
  files: []
}

export function markCreated(
  docs: { name: string; text: string }[],
  repoFiles: string[],
  _vuln: boolean,
  hasFinance = false
) {
  created = docs.length > 0 && repoFiles.length > 0
  finance = hasFinance
  knowledge = { docs, files: repoFiles }
}

export function isCreated() {
  return created
}

export function hasFinanceData() {
  return finance
}

export function getKnowledge() {
  return knowledge
}
