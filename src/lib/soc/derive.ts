/** Derived views over the synthetic fixture set, computed with pure logic. */

import {
  assets,
  auditLog,
  businessServices,
  evidence,
  getAsset,
  getIdentity,
  getService,
  identities,
  incidents,
  playbooks,
  responseTasks,
} from "./fixtures";
import {
  aggregateConfidence,
  canAutoClose,
  computePriority,
  computeSla,
  evaluateAutomation,
  evaluateEscalation,
  routeIncident,
} from "./logic";
import type {
  Asset,
  AutomationEligibility,
  BusinessService,
  EscalationResult,
  Identity,
  Incident,
  Playbook,
  PriorityResult,
  RoutingResult,
  SlaStatus,
} from "./types";

export interface EnrichedIncident {
  incident: Incident;
  asset: Asset;
  identity: Identity;
  service: BusinessService;
  confidence: number;
  priority: PriorityResult;
  routing: RoutingResult;
  ackSla: SlaStatus;
  containSla: SlaStatus;
  resolveSla: SlaStatus;
  escalation: EscalationResult;
  playbooks: { playbook: Playbook; eligibility: AutomationEligibility }[];
  autoClose: { allowed: boolean; reason: string };
}

export function enrich(incident: Incident): EnrichedIncident {
  const asset = getAsset(incident.assetId);
  const identity = getIdentity(incident.identityId);
  const service = getService(incident.businessServiceId);
  const priority = computePriority(incident, asset, service, identity);
  const routing = routeIncident(incident, asset, identity, priority);
  const matching = playbooks.filter((p) => p.appliesToCategories.includes(incident.category));

  return {
    incident,
    asset,
    identity,
    service,
    confidence: aggregateConfidence(incident),
    priority,
    routing,
    ackSla: computeSla(incident.severity, incident.ageMinutes, "acknowledge"),
    containSla: computeSla(incident.severity, incident.ageMinutes, "contain"),
    resolveSla: computeSla(incident.severity, incident.ageMinutes, "resolve"),
    escalation: evaluateEscalation(incident, priority, service),
    playbooks: matching.map((playbook) => ({
      playbook,
      eligibility: evaluateAutomation(incident, playbook, asset),
    })),
    autoClose: canAutoClose(incident),
  };
}

const PRIORITY_ORDER = { P1: 0, P2: 1, P3: 2, P4: 3 } as const;

export const enrichedIncidents: EnrichedIncident[] = incidents
  .map(enrich)
  .sort(
    (a, b) =>
      PRIORITY_ORDER[a.priority.priority] - PRIORITY_ORDER[b.priority.priority] ||
      b.priority.score - a.priority.score,
  );

export function findEnriched(id: string): EnrichedIncident | undefined {
  return enrichedIncidents.find((e) => e.incident.id === id);
}

export function tasksFor(incidentId: string) {
  return responseTasks.filter((t) => t.incidentId === incidentId);
}

export function evidenceFor(incidentId: string) {
  return evidence.filter((e) => e.incidentId === incidentId);
}

export function auditFor(incidentId: string) {
  return auditLog.filter((a) => a.incidentId === incidentId);
}

export interface ProgramMetrics {
  total: number;
  open: number;
  p1: number;
  breached: number;
  atRisk: number;
  awaitingApproval: number;
  automatedActions: number;
  humanApprovals: number;
  meanConfidence: number;
  automationCoveragePct: number;
}

export function programMetrics(): ProgramMetrics {
  const open = enrichedIncidents.filter((e) => e.incident.state !== "closed");
  const covered = enrichedIncidents.filter((e) =>
    e.playbooks.some((p) => p.eligibility.decision !== "blocked"),
  );
  return {
    total: enrichedIncidents.length,
    open: open.length,
    p1: enrichedIncidents.filter((e) => e.priority.priority === "P1").length,
    breached: enrichedIncidents.filter((e) => e.resolveSla.state === "breached").length,
    atRisk: enrichedIncidents.filter((e) => e.containSla.state === "at_risk").length,
    awaitingApproval: responseTasks.filter((t) => t.requiresApproval && t.status !== "complete")
      .length,
    automatedActions: auditLog.filter((a) => a.actor === "automation").length,
    humanApprovals: auditLog.filter((a) => a.humanApproved).length,
    meanConfidence: Math.round(
      enrichedIncidents.reduce((s, e) => s + e.confidence, 0) / enrichedIncidents.length,
    ),
    automationCoveragePct: Math.round((covered.length / enrichedIncidents.length) * 100),
  };
}

export {
  assets,
  businessServices,
  identities,
  incidents,
  playbooks,
  responseTasks,
  evidence,
  auditLog,
};
