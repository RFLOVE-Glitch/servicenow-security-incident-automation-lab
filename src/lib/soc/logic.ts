/**
 * Deterministic, explainable decision logic.
 *
 * Every function here is a pure function of its inputs: the same inputs always
 * produce the same output and the same explanation. No network calls, no
 * randomness, no clock reads. This is what makes the demo auditable.
 */

import type {
  Asset,
  AssignmentGroup,
  AutomationEligibility,
  BusinessService,
  EscalationResult,
  Identity,
  Incident,
  Playbook,
  PlaybookAction,
  PriorityResult,
  RoutingResult,
  Severity,
  SlaPolicy,
  SlaStatus,
} from "./types";

/* ------------------------------------------------------------------ */
/* Weights — single source of truth, documented in docs/automation.md  */
/* ------------------------------------------------------------------ */

export const SEVERITY_POINTS: Record<Severity, number> = {
  critical: 50,
  high: 38,
  medium: 22,
  low: 10,
};

export const SEVERITY_RANK: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const ASSET_TIER_POINTS = {
  tier0: 15,
  tier1: 11,
  tier2: 6,
  tier3: 2,
} as const;

export const SERVICE_CRITICALITY_POINTS: Record<1 | 2 | 3 | 4, number> = {
  1: 12,
  2: 8,
  3: 4,
  4: 1,
};

export const IDENTITY_RISK_POINTS = {
  privileged: 10,
  elevated: 6,
  service: 4,
  standard: 2,
} as const;

export const SLA_POLICIES: SlaPolicy[] = [
  { severity: "critical", ackMinutes: 15, containMinutes: 60, resolveMinutes: 240 },
  { severity: "high", ackMinutes: 30, containMinutes: 120, resolveMinutes: 480 },
  { severity: "medium", ackMinutes: 120, containMinutes: 480, resolveMinutes: 1440 },
  { severity: "low", ackMinutes: 480, containMinutes: 1440, resolveMinutes: 4320 },
];

export function getSlaPolicy(severity: Severity): SlaPolicy {
  const policy = SLA_POLICIES.find((p) => p.severity === severity);
  if (!policy) throw new Error(`No SLA policy for severity: ${severity}`);
  return policy;
}

/* ------------------------------------------------------------------ */
/* Detection confidence                                                */
/* ------------------------------------------------------------------ */

/**
 * Aggregate confidence across correlated signals. Deterministic: the highest
 * single-signal confidence, plus a +5 corroboration bonus per additional
 * distinct source, capped at 100.
 */
export function aggregateConfidence(incident: Incident): number {
  if (incident.signals.length === 0) return 0;
  const max = Math.max(...incident.signals.map((s) => s.confidence));
  const distinctSources = new Set(incident.signals.map((s) => s.source)).size;
  return Math.min(100, max + (distinctSources - 1) * 5);
}

/* ------------------------------------------------------------------ */
/* SLA                                                                 */
/* ------------------------------------------------------------------ */

export function computeSla(
  severity: Severity,
  ageMinutes: number,
  target: SlaStatus["target"] = "resolve",
): SlaStatus {
  const policy = getSlaPolicy(severity);
  const budgetMinutes =
    target === "acknowledge"
      ? policy.ackMinutes
      : target === "contain"
        ? policy.containMinutes
        : policy.resolveMinutes;

  const elapsedMinutes = Math.max(0, ageMinutes);
  const remainingMinutes = budgetMinutes - elapsedMinutes;
  const percentConsumed = Math.round((elapsedMinutes / budgetMinutes) * 100);

  const state: SlaStatus["state"] =
    percentConsumed >= 100 ? "breached" : percentConsumed >= 75 ? "at_risk" : "on_track";

  return { target, budgetMinutes, elapsedMinutes, remainingMinutes, percentConsumed, state };
}

/** Age pressure points folded into the priority score. */
export function slaAgePoints(severity: Severity, ageMinutes: number): number {
  const { percentConsumed } = computeSla(severity, ageMinutes, "resolve");
  if (percentConsumed >= 100) return 8;
  if (percentConsumed >= 75) return 5;
  if (percentConsumed >= 50) return 3;
  return 0;
}

/* ------------------------------------------------------------------ */
/* Priority                                                            */
/* ------------------------------------------------------------------ */

export function computePriority(
  incident: Incident,
  asset: Asset,
  service: BusinessService,
  identity: Identity,
): PriorityResult {
  const confidence = aggregateConfidence(incident);
  const confidencePoints = Math.round(confidence * 0.15);
  const agePoints = slaAgePoints(incident.severity, incident.ageMinutes);

  const factors: PriorityResult["factors"] = [
    {
      label: "Severity",
      detail: incident.severity,
      points: SEVERITY_POINTS[incident.severity],
    },
    {
      label: "Detection confidence",
      detail: `${confidence}% aggregate across ${incident.signals.length} signal(s)`,
      points: confidencePoints,
    },
    {
      label: "Asset criticality",
      detail: `${asset.hostname} (${asset.tier}, ${asset.environment})`,
      points: ASSET_TIER_POINTS[asset.tier],
    },
    {
      label: "Business service",
      detail: `${service.name} (criticality ${service.criticality})`,
      points: SERVICE_CRITICALITY_POINTS[service.criticality],
    },
    {
      label: "Identity risk",
      detail: `${identity.displayName} (${identity.risk})`,
      points: IDENTITY_RISK_POINTS[identity.risk],
    },
    {
      label: "SLA age pressure",
      detail: `${incident.ageMinutes} min elapsed vs resolve budget`,
      points: agePoints,
    },
  ];

  const score = factors.reduce((sum, f) => sum + f.points, 0);
  const priority: PriorityResult["priority"] =
    score >= 85 ? "P1" : score >= 65 ? "P2" : score >= 45 ? "P3" : "P4";

  return { score, priority, factors };
}

/* ------------------------------------------------------------------ */
/* Routing                                                             */
/* ------------------------------------------------------------------ */

/**
 * First-match-wins routing. Rules are evaluated top to bottom and the full
 * evaluation trace is returned so an analyst can see why a queue was chosen.
 */
export function routeIncident(
  incident: Incident,
  asset: Asset,
  identity: Identity,
  priority: PriorityResult,
): RoutingResult {
  const rules: { rule: string; matched: boolean; group: AssignmentGroup; reason: string }[] = [
    {
      rule: "P1 or critical severity -> Incident Response",
      matched: priority.priority === "P1" || incident.severity === "critical",
      group: "Incident Response (IR)",
      reason: "Highest-priority incidents go directly to the IR team.",
    },
    {
      rule: "Credential abuse / insider risk, or privileged identity -> Identity & Access",
      matched:
        incident.category === "credential_abuse" ||
        incident.category === "insider_risk" ||
        identity.risk === "privileged",
      group: "Identity & Access Team",
      reason: "Identity-centric incidents require account and entitlement review.",
    },
    {
      rule: "Cloud misconfiguration -> Cloud Security Engineering",
      matched: incident.category === "cloud_misconfiguration",
      group: "Cloud Security Engineering",
      reason: "Cloud control-plane findings are remediated by the cloud team.",
    },
    {
      rule: "Vulnerable asset -> Vulnerability Management",
      matched: incident.category === "vulnerable_asset",
      group: "Vulnerability Management",
      reason: "Exposure findings are tracked through the vulnerability program.",
    },
    {
      rule: "P2, or tier0/tier1 production asset -> SOC Tier 2",
      matched:
        priority.priority === "P2" ||
        ((asset.tier === "tier0" || asset.tier === "tier1") && asset.environment === "production"),
      group: "SOC Tier 2 Analysis",
      reason: "Elevated impact requires deeper analysis before containment.",
    },
    {
      rule: "Default -> SOC Tier 1",
      matched: true,
      group: "SOC Tier 1 Triage",
      reason: "No elevated condition matched; standard triage queue applies.",
    },
  ];

  const first = rules.find((r) => r.matched);
  // The default rule always matches, so `first` is never undefined.
  const winner = first ?? rules[rules.length - 1]!;

  return {
    group: winner.group,
    reason: winner.reason,
    rulesEvaluated: rules.map((r) => ({ rule: r.rule, matched: r.matched })),
  };
}

/* ------------------------------------------------------------------ */
/* Automation eligibility                                              */
/* ------------------------------------------------------------------ */

/** Actions that may never execute automatically on a high/critical incident. */
export const CONSEQUENTIAL_IMPACTS: PlaybookAction["impact"][] = ["high"];

export function evaluateAutomation(
  incident: Incident,
  playbook: Playbook,
  asset: Asset,
): AutomationEligibility {
  const reasons: string[] = [];
  const confidence = aggregateConfidence(incident);

  const categoryMatch = playbook.appliesToCategories.includes(incident.category);
  if (!categoryMatch) {
    reasons.push(`Playbook does not cover category "${incident.category}".`);
  }

  const severityMatch = SEVERITY_RANK[incident.severity] >= SEVERITY_RANK[playbook.minSeverity];
  if (!severityMatch) {
    reasons.push(
      `Incident severity "${incident.severity}" is below playbook minimum "${playbook.minSeverity}".`,
    );
  }

  const confidenceMatch = confidence >= playbook.minConfidence;
  if (!confidenceMatch) {
    reasons.push(
      `Aggregate confidence ${confidence}% is below the required ${playbook.minConfidence}%.`,
    );
  }

  if (!categoryMatch || !severityMatch || !confidenceMatch) {
    return { decision: "blocked", reasons, autoExecutable: [], approvalRequired: [] };
  }

  reasons.push(
    `Category, severity and confidence (${confidence}%) all satisfy playbook preconditions.`,
  );

  const highImpactIncident =
    incident.severity === "critical" ||
    incident.severity === "high" ||
    asset.tier === "tier0" ||
    (asset.tier === "tier1" && asset.environment === "production");

  const autoExecutable: PlaybookAction[] = [];
  const approvalRequired: PlaybookAction[] = [];

  for (const action of playbook.actions) {
    const gated =
      action.requiresHumanApproval ||
      CONSEQUENTIAL_IMPACTS.includes(action.impact) ||
      (highImpactIncident && action.impact !== "low");
    if (gated) approvalRequired.push(action);
    else autoExecutable.push(action);
  }

  if (highImpactIncident) {
    reasons.push(
      "High-severity incident or tier0/tier1 production asset: all non-trivial actions require documented human approval.",
    );
  }

  return {
    decision: approvalRequired.length > 0 ? "requires_approval" : "eligible",
    reasons,
    autoExecutable,
    approvalRequired,
  };
}

/**
 * Hard safety control: a high or critical incident can never be auto-closed.
 * Closure always requires recorded human validation.
 */
export function canAutoClose(incident: Incident): { allowed: boolean; reason: string } {
  if (incident.severity === "critical" || incident.severity === "high") {
    return {
      allowed: false,
      reason: "Auto-close is prohibited for high and critical severity incidents.",
    };
  }
  if (!incident.containmentApproved) {
    return { allowed: false, reason: "Containment has not been validated by a human analyst." };
  }
  if (incident.state !== "review") {
    return {
      allowed: false,
      reason: `Incident must be in "review" state, currently "${incident.state}".`,
    };
  }
  return { allowed: true, reason: "Low/medium incident in review with validated containment." };
}

/* ------------------------------------------------------------------ */
/* Escalation                                                          */
/* ------------------------------------------------------------------ */

export function evaluateEscalation(
  incident: Incident,
  priority: PriorityResult,
  service: BusinessService,
): EscalationResult {
  const sla = computeSla(incident.severity, incident.ageMinutes, "contain");
  const reasons: string[] = [];
  const order = ["none", "tier2", "incident_commander", "executive"] as const;
  let levelIndex = 0;

  const raise = (next: EscalationResult["level"], reason: string) => {
    const nextIndex = order.indexOf(next);
    if (nextIndex > levelIndex) levelIndex = nextIndex;
    reasons.push(reason);
  };

  if (sla.state === "at_risk") {
    raise("tier2", `Containment SLA at risk (${sla.percentConsumed}% consumed).`);
  }
  if (sla.state === "breached") {
    raise("incident_commander", `Containment SLA breached (${sla.percentConsumed}% consumed).`);
  }
  if (priority.priority === "P1") {
    raise("incident_commander", "P1 priority requires an incident commander.");
  }
  if (incident.severity === "critical" && service.criticality === 1) {
    raise("executive", `Critical incident affecting mission-critical service "${service.name}".`);
  }
  if (sla.state === "breached" && incident.severity === "critical") {
    raise("executive", "Critical incident with a breached containment SLA.");
  }

  const level = order[levelIndex] as EscalationResult["level"];
  if (level === "none") reasons.push("No escalation trigger matched.");

  const notify: string[] = [];
  if (level === "tier2") notify.push("SOC Tier 2 Analysis", "SOC Shift Lead");
  if (level === "incident_commander")
    notify.push("SOC Shift Lead", "Incident Commander on-call", "Incident Response (IR)");
  if (level === "executive")
    notify.push("Incident Commander on-call", "CISO delegate", "Business Service Owner");

  return { level, reasons, notify };
}
