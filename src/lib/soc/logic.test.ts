import { describe, expect, it } from "vitest";

import {
  aggregateConfidence,
  canAutoClose,
  computePriority,
  computeSla,
  evaluateAutomation,
  evaluateEscalation,
  getSlaPolicy,
  routeIncident,
  slaAgePoints,
} from "./logic";
import type {
  Asset,
  BusinessService,
  Identity,
  Incident,
  Playbook,
  DetectionSignal,
} from "./types";
import { enrichedIncidents, programMetrics } from "./derive";
import { incidents, playbooks } from "./fixtures";

/* ----------------------------- builders ----------------------------- */

const signal = (over: Partial<DetectionSignal> = {}): DetectionSignal => ({
  id: "sig-1",
  source: "SIM-SIEM (synthetic)",
  rule: "test rule",
  confidence: 80,
  observedAt: "2026-08-14T00:00:00Z",
  mitreTechnique: "T0000",
  dedupeKey: "k",
  normalized: true,
  ...over,
});

const incident = (over: Partial<Incident> = {}): Incident => ({
  id: "SIR-0001",
  title: "test incident",
  category: "malware",
  severity: "medium",
  state: "triage",
  openedAt: "2026-08-14T00:00:00Z",
  ageMinutes: 10,
  assetId: "as-05",
  identityId: "id-05",
  businessServiceId: "bs-corp",
  signals: [signal()],
  aiSummary: "simulated",
  aiSuggestedActions: [],
  containmentApproved: false,
  ...over,
});

const asset = (over: Partial<Asset> = {}): Asset => ({
  id: "as-x",
  hostname: "syn-host",
  tier: "tier3",
  environment: "production",
  businessServiceId: "bs-corp",
  ...over,
});

const service = (over: Partial<BusinessService> = {}): BusinessService => ({
  id: "bs-corp",
  name: "Corporate Workstations",
  criticality: 3,
  owner: "owner",
  ...over,
});

const identity = (over: Partial<Identity> = {}): Identity => ({
  id: "id-x",
  displayName: "u.test",
  risk: "standard",
  department: "Ops",
  ...over,
});

const playbook = (over: Partial<Playbook> = {}): Playbook => ({
  id: "pb-x",
  name: "Test playbook",
  description: "",
  appliesToCategories: ["malware"],
  minSeverity: "low",
  minConfidence: 50,
  actions: [
    {
      id: "a1",
      label: "low action",
      impact: "low",
      requiresHumanApproval: false,
      simulatedIntegration: "SIM",
    },
    {
      id: "a2",
      label: "medium action",
      impact: "medium",
      requiresHumanApproval: false,
      simulatedIntegration: "SIM",
    },
    {
      id: "a3",
      label: "high action",
      impact: "high",
      requiresHumanApproval: true,
      simulatedIntegration: "SIM",
    },
  ],
  guardrails: [],
  ...over,
});

/* --------------------------- confidence ----------------------------- */

describe("aggregateConfidence", () => {
  it("returns 0 with no signals", () => {
    expect(aggregateConfidence(incident({ signals: [] }))).toBe(0);
  });

  it("uses the highest single-signal confidence", () => {
    const i = incident({
      signals: [signal({ confidence: 40 }), signal({ id: "s2", confidence: 70 })],
    });
    // same source -> no corroboration bonus
    expect(aggregateConfidence(i)).toBe(70);
  });

  it("adds +5 per additional distinct source", () => {
    const i = incident({
      signals: [
        signal({ confidence: 70 }),
        signal({ id: "s2", source: "SIM-EDR (synthetic)", confidence: 50 }),
        signal({ id: "s3", source: "SIM-UserReport (synthetic)", confidence: 30 }),
      ],
    });
    expect(aggregateConfidence(i)).toBe(80);
  });

  it("caps at 100", () => {
    const i = incident({
      signals: [
        signal({ confidence: 99 }),
        signal({ id: "s2", source: "SIM-EDR (synthetic)", confidence: 99 }),
      ],
    });
    expect(aggregateConfidence(i)).toBe(100);
  });
});

/* ------------------------------- SLA -------------------------------- */

describe("computeSla", () => {
  it("exposes a policy per severity", () => {
    expect(getSlaPolicy("critical").ackMinutes).toBe(15);
    expect(getSlaPolicy("low").resolveMinutes).toBe(4320);
  });

  it("marks on_track below 75% consumed", () => {
    const sla = computeSla("high", 100, "resolve"); // 100/480 ~ 21%
    expect(sla.state).toBe("on_track");
    expect(sla.remainingMinutes).toBe(380);
    expect(sla.percentConsumed).toBe(21);
  });

  it("marks at_risk at 75%", () => {
    expect(computeSla("critical", 180, "resolve").state).toBe("at_risk"); // 180/240 = 75%
  });

  it("marks breached at or beyond 100%", () => {
    const sla = computeSla("critical", 260, "resolve");
    expect(sla.state).toBe("breached");
    expect(sla.remainingMinutes).toBeLessThan(0);
  });

  it("scores age pressure in bands", () => {
    expect(slaAgePoints("critical", 10)).toBe(0);
    expect(slaAgePoints("critical", 130)).toBe(3);
    expect(slaAgePoints("critical", 190)).toBe(5);
    expect(slaAgePoints("critical", 400)).toBe(8);
  });
});

/* ---------------------------- priority ------------------------------ */

describe("computePriority", () => {
  it("is deterministic for identical inputs", () => {
    const args = [incident(), asset(), service(), identity()] as const;
    expect(computePriority(...args)).toEqual(computePriority(...args));
  });

  it("sums documented factor weights", () => {
    const result = computePriority(
      incident({ severity: "medium", ageMinutes: 10, signals: [signal({ confidence: 80 })] }),
      asset({ tier: "tier3" }),
      service({ criticality: 3 }),
      identity({ risk: "standard" }),
    );
    // 22 severity + 12 confidence + 2 asset + 4 service + 2 identity + 0 age
    expect(result.score).toBe(42);
    expect(result.priority).toBe("P4");
    expect(result.factors).toHaveLength(6);
  });

  it("escalates to P1 for a critical incident on a tier0 mission-critical asset", () => {
    const result = computePriority(
      incident({ severity: "critical", ageMinutes: 200, signals: [signal({ confidence: 90 })] }),
      asset({ tier: "tier0" }),
      service({ criticality: 1 }),
      identity({ risk: "privileged" }),
    );
    // 50 + 14 + 15 + 12 + 10 + 5 = 106
    expect(result.score).toBe(106);
    expect(result.priority).toBe("P1");
  });

  it("orders priority bands monotonically with severity", () => {
    const base = { a: asset(), s: service(), i: identity() };
    const low = computePriority(incident({ severity: "low" }), base.a, base.s, base.i).score;
    const high = computePriority(incident({ severity: "high" }), base.a, base.s, base.i).score;
    expect(high).toBeGreaterThan(low);
  });

  it("explains every factor it counted", () => {
    const result = computePriority(incident(), asset(), service(), identity());
    expect(result.factors.map((f) => f.label)).toEqual([
      "Severity",
      "Detection confidence",
      "Asset criticality",
      "Business service",
      "Identity risk",
      "SLA age pressure",
    ]);
    expect(result.factors.reduce((s, f) => s + f.points, 0)).toBe(result.score);
  });
});

/* ----------------------------- routing ------------------------------ */

describe("routeIncident", () => {
  const route = (i: Incident, a = asset(), id = identity()) =>
    routeIncident(i, a, id, computePriority(i, a, service(), id));

  it("sends critical incidents to Incident Response", () => {
    expect(route(incident({ severity: "critical" })).group).toBe("Incident Response (IR)");
  });

  it("sends credential abuse to the Identity & Access team", () => {
    expect(route(incident({ category: "credential_abuse", severity: "medium" })).group).toBe(
      "Identity & Access Team",
    );
  });

  it("sends cloud misconfiguration to Cloud Security Engineering", () => {
    expect(route(incident({ category: "cloud_misconfiguration", severity: "low" })).group).toBe(
      "Cloud Security Engineering",
    );
  });

  it("sends vulnerable assets to Vulnerability Management", () => {
    expect(route(incident({ category: "vulnerable_asset", severity: "low" })).group).toBe(
      "Vulnerability Management",
    );
  });

  it("sends tier1 production assets to SOC Tier 2", () => {
    expect(
      route(incident({ severity: "medium" }), asset({ tier: "tier1", environment: "production" }))
        .group,
    ).toBe("SOC Tier 2 Analysis");
  });

  it("falls back to SOC Tier 1", () => {
    expect(route(incident({ severity: "low", category: "denial_of_service" })).group).toBe(
      "SOC Tier 1 Triage",
    );
  });

  it("returns a full rule-evaluation trace with first-match-wins semantics", () => {
    const result = route(incident({ severity: "critical", category: "credential_abuse" }));
    expect(result.group).toBe("Incident Response (IR)");
    expect(result.rulesEvaluated).toHaveLength(6);
    expect(result.rulesEvaluated[0]?.matched).toBe(true);
  });
});

/* ----------------------- automation eligibility --------------------- */

describe("evaluateAutomation", () => {
  it("blocks when the category is not covered", () => {
    const result = evaluateAutomation(incident({ category: "phishing" }), playbook(), asset());
    expect(result.decision).toBe("blocked");
    expect(result.reasons[0]).toContain("does not cover category");
  });

  it("blocks when severity is below the playbook minimum", () => {
    const result = evaluateAutomation(
      incident({ severity: "low" }),
      playbook({ minSeverity: "high" }),
      asset(),
    );
    expect(result.decision).toBe("blocked");
    expect(result.reasons.join(" ")).toContain("below playbook minimum");
  });

  it("blocks when aggregate confidence is below the threshold", () => {
    const result = evaluateAutomation(
      incident({ signals: [signal({ confidence: 40 })] }),
      playbook({ minConfidence: 75 }),
      asset(),
    );
    expect(result.decision).toBe("blocked");
    expect(result.reasons.join(" ")).toContain("below the required 75%");
  });

  it("gates high-impact actions behind human approval", () => {
    const result = evaluateAutomation(incident(), playbook(), asset({ tier: "tier3" }));
    expect(result.decision).toBe("requires_approval");
    expect(result.autoExecutable.map((a) => a.id)).toEqual(["a1", "a2"]);
    expect(result.approvalRequired.map((a) => a.id)).toEqual(["a3"]);
  });

  it("gates every non-trivial action on tier0 assets", () => {
    const result = evaluateAutomation(incident(), playbook(), asset({ tier: "tier0" }));
    expect(result.autoExecutable.map((a) => a.id)).toEqual(["a1"]);
    expect(result.approvalRequired.map((a) => a.id)).toEqual(["a2", "a3"]);
  });

  it("gates every non-trivial action on high-severity incidents", () => {
    const result = evaluateAutomation(
      incident({ severity: "high" }),
      playbook(),
      asset({ tier: "tier3" }),
    );
    expect(result.approvalRequired.map((a) => a.id)).toEqual(["a2", "a3"]);
    expect(result.reasons.join(" ")).toContain("documented human approval");
  });

  it("is fully eligible when only low-impact actions exist", () => {
    const result = evaluateAutomation(
      incident(),
      playbook({
        actions: [
          {
            id: "a1",
            label: "collect",
            impact: "low",
            requiresHumanApproval: false,
            simulatedIntegration: "SIM",
          },
        ],
      }),
      asset(),
    );
    expect(result.decision).toBe("eligible");
    expect(result.approvalRequired).toHaveLength(0);
  });
});

describe("canAutoClose", () => {
  it("never auto-closes critical incidents", () => {
    const result = canAutoClose(
      incident({ severity: "critical", state: "review", containmentApproved: true }),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("prohibited");
  });

  it("never auto-closes high-severity incidents", () => {
    expect(
      canAutoClose(incident({ severity: "high", state: "review", containmentApproved: true }))
        .allowed,
    ).toBe(false);
  });

  it("requires validated containment", () => {
    const result = canAutoClose(
      incident({ severity: "low", state: "review", containmentApproved: false }),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("validated by a human");
  });

  it("requires the review state", () => {
    const result = canAutoClose(
      incident({ severity: "low", state: "analysis", containmentApproved: true }),
    );
    expect(result.allowed).toBe(false);
  });

  it("allows a validated low-severity incident in review", () => {
    expect(
      canAutoClose(incident({ severity: "low", state: "review", containmentApproved: true }))
        .allowed,
    ).toBe(true);
  });

  it("blocks auto-close for every high/critical fixture incident", () => {
    for (const i of incidents.filter((x) => x.severity === "high" || x.severity === "critical")) {
      expect(canAutoClose(i).allowed).toBe(false);
    }
  });
});

/* ---------------------------- escalation ---------------------------- */

describe("evaluateEscalation", () => {
  const esc = (i: Incident, s = service()) =>
    evaluateEscalation(i, computePriority(i, asset(), s, identity()), s);

  it("does not escalate a fresh low-severity incident", () => {
    const result = esc(incident({ severity: "low", ageMinutes: 5, category: "denial_of_service" }));
    expect(result.level).toBe("none");
    expect(result.reasons).toContain("No escalation trigger matched.");
    expect(result.notify).toHaveLength(0);
  });

  it("escalates to tier2 when the containment SLA is at risk", () => {
    // medium: contain budget 480 -> 400 min = 83%
    const result = esc(incident({ severity: "medium", ageMinutes: 400 }));
    expect(result.level).toBe("tier2");
    expect(result.notify).toContain("SOC Shift Lead");
  });

  it("escalates to incident commander on a breached containment SLA", () => {
    const result = esc(incident({ severity: "medium", ageMinutes: 600 }));
    expect(result.level).toBe("incident_commander");
  });

  it("escalates to executive for a critical incident on a mission-critical service", () => {
    const result = esc(
      incident({ severity: "critical", ageMinutes: 20 }),
      service({ criticality: 1 }),
    );
    expect(result.level).toBe("executive");
    expect(result.notify).toContain("CISO delegate");
  });

  it("only ever raises the level, never lowers it", () => {
    const result = esc(
      incident({ severity: "critical", ageMinutes: 400 }),
      service({ criticality: 1 }),
    );
    expect(result.level).toBe("executive");
    expect(result.reasons.length).toBeGreaterThan(2);
  });
});

/* --------------------------- fixture wiring -------------------------- */

describe("fixture integration", () => {
  it("enriches every incident and sorts by priority", () => {
    expect(enrichedIncidents).toHaveLength(incidents.length);
    const order = enrichedIncidents.map((e) => e.priority.priority);
    expect(order).toEqual([...order].sort());
  });

  it("uses only synthetic incident identifiers", () => {
    for (const i of incidents) expect(i.id).toMatch(/^SIR-\d{4}$/);
  });

  it("labels every detection source as synthetic", () => {
    for (const i of incidents) for (const s of i.signals) expect(s.source).toContain("(synthetic)");
  });

  it("only references simulated integrations in playbooks", () => {
    for (const p of playbooks)
      for (const a of p.actions) expect(a.simulatedIntegration.startsWith("SIM-")).toBe(true);
  });

  it("computes program metrics without NaN", () => {
    const m = programMetrics();
    expect(m.total).toBe(incidents.length);
    expect(Number.isFinite(m.meanConfidence)).toBe(true);
    expect(m.automationCoveragePct).toBeGreaterThan(0);
  });
});
