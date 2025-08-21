export type EvidenceRef = { filePath:string; startLine:number; endLine:number; commit:string };
export type IntegrationRow = { name:string; category:string; impact:number; security:number; ops:number; health:number; coupling:number; upgrade:number; logoUrl?:string; evidence?:EvidenceRef[] };
export type ActionItem = { id:string; title:string; severity:'critical'|'high'|'medium'|'low'; rationale:string; };
export type DashboardData = {
  generatedAt:string;
  pulse:{ envs:string[]; deploysToday:number; criticalAlerts:number; };
  integrationsTop10:IntegrationRow[];
  actions:ActionItem[];
  reliability:{ coveragePct:number; evidenceCompletenessPct:number; llmStaticAgreementPct:number; };
};
