import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/soc/AppShell";
import { ControlNote, PageHeader, Panel, Pill, StatCard } from "@/components/soc/primitives";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Docs & Tests — Security Incident Automation Lab" },
      {
        name: "description",
        content:
          "Implementation status, test coverage of the decision logic, and a clear split between implemented demo functionality and production-only capabilities.",
      },
      { property: "og:title", content: "Docs & Tests" },
      {
        property: "og:description",
        content: "What is implemented, what is simulated, and what production would still require.",
      },
    ],
  }),
  component: Docs,
});

const implemented = [
  "Typed domain model for incidents, assets, identities, business services, playbooks, tasks, evidence and audit entries",
  "Deterministic priority scoring with a rendered factor-by-factor trace",
  "First-match-wins routing with a full rule evaluation trace",
  "Severity-based acknowledge / contain / resolve SLA budgets with at-risk and breach states",
  "Escalation ladder derived from SLA pressure, priority and service criticality",
  "Playbook automation pre-flight with category, severity and confidence gates",
  "Human-approval gating for high-impact actions and tier0/tier1 production assets",
  "Hard auto-close prohibition for high and critical incidents",
  "Labelled, advisory-only simulated AI triage summaries and suggestions",
  "Evidence register with simulated integrity digests and an audit trail",
  "Program metrics recomputed from fixtures on every render",
  "Unit tests over priority, SLA, routing, automation eligibility, auto-close and escalation",
];

const productionOnly = [
  ["Authentication & SSO", "No login exists; every route is public and read-only."],
  ["RBAC / least privilege", "Assignment groups are display data, not authorization."],
  ["Real integrations", "No ServiceNow, SIEM, EDR, identity-provider or ticketing connection exists."],
  ["Secret vaulting & rotation", "The codebase contains no credentials to store; a real deployment would need a managed vault."],
  ["Persistent audit storage", "The audit trail is an in-memory fixture; production needs append-only, tamper-evident storage."],
  ["Inbound webhooks", "No endpoint receives detections; a real intake needs signature verification and replay protection."],
  ["Change-management controls", "Playbook edits are code changes here; production needs approvals and versioned release control."],
  ["Data retention & privacy", "No personal or customer data is present, so no retention or DSAR handling is implemented."],
  ["Observability", "No logging, metrics export or alerting pipeline."],
];

const testAreas = [
  ["Priority calculation", "Score composition per factor, band boundaries P1–P4, monotonicity across severity and asset tier."],
  ["SLA model", "Budget lookup per severity, elapsed/remaining arithmetic, on-track / at-risk / breached thresholds."],
  ["Routing", "Each rule in isolation, first-match-wins ordering, and the completeness of the evaluation trace."],
  ["Automation eligibility", "Category, severity and confidence gates; auto-executable vs approval-required partitioning."],
  ["Auto-close safety", "High and critical incidents are never auto-closeable regardless of state or approval flags."],
  ["Escalation", "Ladder monotonicity and the trigger reasons attached to each level."],
];

function Docs() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Docs & Tests"
        title="Implementation status"
        description="This page is the honest boundary of the project: what actually runs, what is simulated, and what an enterprise deployment would still require."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Unit tests" value={44} tone="success" hint="Vitest, decision logic only" />
        <StatCard label="Decision functions" value={6} tone="primary" hint="Pure, no I/O, no clock" />
        <StatCard label="Live integrations" value={0} hint="Everything is simulated" />
      </div>

      <Panel title="Implemented in this demo">
        <ul className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
          {implemented.map((i) => (
            <li key={i}>· {i}</li>
          ))}
        </ul>
      </Panel>

      <Panel title="Test coverage of the decision logic" description="See src/lib/soc/logic.test.ts.">
        <table className="w-full text-left text-sm">
          <tbody>
            {testAreas.map(([area, detail]) => (
              <tr key={area} className="border-b border-border/50 last:border-0">
                <td className="w-56 py-2 pr-3 align-top text-foreground">{area}</td>
                <td className="py-2 text-xs text-muted-foreground">{detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel
        title="Production-only capabilities"
        description="Deliberately absent rather than stubbed to look real."
      >
        <table className="w-full text-left text-sm">
          <tbody>
            {productionOnly.map(([area, detail]) => (
              <tr key={area} className="border-b border-border/50 last:border-0">
                <td className="w-64 py-2 pr-3 align-top">
                  <Pill tone="neutral">{area}</Pill>
                </td>
                <td className="py-2 text-xs text-muted-foreground">{detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Repository documentation">
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>· <span className="text-foreground">README.md</span> — project overview, scope, disclosures and commands.</li>
          <li>· <span className="text-foreground">docs/architecture.md</span> — layering and data flow.</li>
          <li>· <span className="text-foreground">docs/incident-workflow.md</span> — state model and lifecycle.</li>
          <li>· <span className="text-foreground">docs/automation-logic.md</span> — playbook gates and approval rules.</li>
          <li>· <span className="text-foreground">docs/sla-escalation.md</span> — budgets, thresholds and the ladder.</li>
          <li>· <span className="text-foreground">docs/security-controls.md</span> — implemented controls and threat notes.</li>
          <li>· <span className="text-foreground">docs/implementation-status.md</span> — demo vs production matrix.</li>
        </ul>
      </Panel>

      <ControlNote>
        Not affiliated with or endorsed by ServiceNow. No live ServiceNow, SIEM, EDR,
        identity-provider, credential, customer-data or production-incident connection exists in
        this project.
      </ControlNote>
    </AppShell>
  );
}
