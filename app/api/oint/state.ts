let created = false
let finance = false
export function markCreated(docs: number, repo: boolean, vuln: boolean, hasFinance = false) {
  created = docs > 0 && repo && vuln
  finance = hasFinance
}
export function isCreated() {
  return created
}
export function hasFinanceData() {
  return finance
}
