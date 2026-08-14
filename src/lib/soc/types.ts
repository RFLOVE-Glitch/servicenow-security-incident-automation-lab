/**
 * Domain types for the ServiceNow Security Incident Automation Lab.
 *
 * SYNTHETIC DATA ONLY. These types model a security incident response
 * workflow inspired by public descriptions of ServiceNow-style Security
 * Operations processes. This project is NOT affiliated with ServiceNow and
 * contains no live instance, no real integrations, and no customer data.
 */

export type Severity = "critical" | "high" | "medium" | "low";

export type AssetTier = "tier0" | "tier1" | "tier2" | "tier3";

export type IdentityRisk = "privileged" | "elevated" | "standard" | "service";

export type IncidentState =
  | "new"
  | "triage"
  | "analysis"
  | "containment"
  | "eradication"
  | "recovery"
  | "review"
  | "closed";

export type IncidentCategory =
  | "phishing"
  | "malware"
  | "credential_abuse"
  | "data_exfiltration"
  | "vulnerable_asset"
  | "insider_risk"
  | "cloud_misconfiguration"
  | "denial_of_service";

/** Fabricated, non-production detection sources. */
export type EventSource =
  | "SIM-SIEM (synthetic)"
  | "SIM-EDR (synthetic)"
  | "SIM-CloudTrail (synthetic)"
  | "SIM-MailGateway (synthetic)"
  | "SIM-IdentityProvider (synthetic)"
  | "SIM-VulnScanner (synthetic)"
  | "SIM-UserReport (synthetic)";

export type AssignmentGroup =
  | "SOC Tier 1 Triage"
  | "SOC Tier 2 Analysis"
  | "Incident Response (IR)"
  | "Identity & Access Team"
  | "Cloud Security Engineering"
  | "Vulnerability Management";

export interface BusinessService {
  id: string;
  name: string;
  /** 1 = mission critical, 4 = non-critical. */
  criticality: 1 | 2 | 3 | 4;
  owner: string;
}

export interface Asset {
  id: string;
  hostname: string;
  tier: AssetTier;
  environment: "production" | "staging" | "development";
  businessServiceId: string;
}

export interface Identity {
  id: string;
  displayName: string;
  risk: IdentityRisk;
  department: string;
}

export interface DetectionSignal {
  id: string;
  source: EventSource;
  rule: string;
  /** Detection confidence 0-100, as reported by the simulated source. */
  confidence: number;
  observedAt: string;
  mitreTechnique: string;
  dedupeKey: string;
  /** Simulated intake normalization result. */
  normalized: boolean;
}

export type TaskStatus = "open" | "in_progress" | "blocked" | "complete";

export interface ResponseTask {
  id: string;
  incidentId: string;
  title: string;
  assignmentGroup: AssignmentGroup;
  status: TaskStatus;
  /** Whether this task was created by a simulated playbook run. */
  automated: boolean;
  requiresApproval: boolean;
  dueInMinutes: number;
}

export type EvidenceKind =
  | "log_excerpt"
  | "hash"
  | "screenshot_reference"
  | "network_indicator"
  | "analyst_note";

export interface EvidenceItem {
  id: string;
  incidentId: string;
  kind: EvidenceKind;
  label: string;
  value: string;
  collectedBy: string;
  collectedAt: string;
  /** Simulated integrity digest over synthetic content. */
  integrityDigest: string;
}

export type AuditActor = "analyst" | "automation" | "system";

export interface AuditEntry {
  id: string;
  incidentId: string;
  at: string;
  actor: AuditActor;
  actorName: string;
  action: string;
  detail: string;
  /** True when a human explicitly approved a consequential action. */
  humanApproved?: boolean;
}

export interface Incident {
  /** Synthetic identifier, e.g. SIR-2041 (not a real ticket number). */
  id: string;
  title: string;
  category: IncidentCategory;
  severity: Severity;
  state: IncidentState;
  openedAt: string;
  /** Minutes since the incident was opened, precomputed for determinism. */
  ageMinutes: number;
  assetId: string;
  identityId: string;
  businessServiceId: string;
  signals: DetectionSignal[];
  /** Simulated AI triage output. Always labeled, never authoritative. */
  aiSummary: string;
  aiSuggestedActions: string[];
  containmentApproved: boolean;
  assignedGroup?: AssignmentGroup;
}

export type ActionImpact = "low" | "medium" | "high";

export interface PlaybookAction {
  id: string;
  label: string;
  impact: ActionImpact;
  /** High-impact actions always require documented human approval. */
  requiresHumanApproval: boolean;
  simulatedIntegration: string;
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  appliesToCategories: IncidentCategory[];
  minSeverity: Severity;
  /** Minimum aggregate detection confidence required to run. */
  minConfidence: number;
  actions: PlaybookAction[];
  /** Human-readable, deterministic guard conditions. */
  guardrails: string[];
}

export interface SlaPolicy {
  severity: Severity;
  /** Minutes allowed before first analyst acknowledgement. */
  ackMinutes: number;
  /** Minutes allowed before containment must be underway. */
  containMinutes: number;
  /** Minutes allowed before resolution. */
  resolveMinutes: number;
}

export type SlaState = "on_track" | "at_risk" | "breached";

export interface SlaStatus {
  target: "acknowledge" | "contain" | "resolve";
  budgetMinutes: number;
  elapsedMinutes: number;
  remainingMinutes: number;
  percentConsumed: number;
  state: SlaState;
}

export interface PriorityResult {
  score: number;
  /** P1 (highest) .. P4 */
  priority: "P1" | "P2" | "P3" | "P4";
  factors: { label: string; detail: string; points: number }[];
}

export interface RoutingResult {
  group: AssignmentGroup;
  reason: string;
  rulesEvaluated: { rule: string; matched: boolean }[];
}

export type AutomationDecision = "eligible" | "requires_approval" | "blocked";

export interface AutomationEligibility {
  decision: AutomationDecision;
  reasons: string[];
  /** Actions that may execute without a human in the loop (simulated). */
  autoExecutable: PlaybookAction[];
  /** Actions gated behind explicit human approval. */
  approvalRequired: PlaybookAction[];
}

export type EscalationLevel = "none" | "tier2" | "incident_commander" | "executive";

export interface EscalationResult {
  level: EscalationLevel;
  reasons: string[];
  notify: string[];
}
