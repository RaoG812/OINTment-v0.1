export type ActionItem = { id: string; title: string; severity: 'critical'|'high'|'medium'|'low'; rationale: string };
export type StackInfo = { appName: string; description: string; integrations: { name: string; logoUrl?: string }[] };
export type FinanceInfo = { effectivenessPct: number };
export type PlanItem = { day: string; step: string };
export type DashboardData = {
  generatedAt: string;
  pulse: {
    envs: string[];
    deploysToday: number;
    criticalAlerts: number;
    filesAnalyzed: number;
    docsReviewed: number;
  };
  stack: StackInfo;
  actions: ActionItem[];
  onboardingPlan: PlanItem[];
  reliability: { coveragePct: number; evidenceCompletenessPct: number; llmStaticAgreementPct: number };
  finance?: FinanceInfo;
};
