let created = false
let finance = false
export function markCreated(hasFinance = false) {
  created = true
  finance = hasFinance
}
export function isCreated() {
  return created
}
export function hasFinanceData() {
  return finance
}
