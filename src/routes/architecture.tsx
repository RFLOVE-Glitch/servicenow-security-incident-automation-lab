import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/soc/AppShell";
import { ControlNote, HumanGate, PageHeader, Panel, Pill } from "@/components/soc/primitives";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "Architecture & Security — Security Incident Automation Lab" },
      {
        name: "description",
        content:
          "How the demo is layered, which security controls are implemented in code, and which enterprise controls are documented as production-only requirements.",
      },
      { property: "og:title", content: "Architecture & Security" },
      {
        property: "og:description",
        content: "Layered architecture and the implemented-vs-production security control model.",
      },
    ],
  }),
  component: Architecture,
});

const diagram = `Fabricated detection sources (SIM-SIEM / SIM-EDR / SIM-CloudTrail /
SIM-MailGateway / SIM-IdentityProvider / SIM-VulnScanner / SIM-UserReport)
        |
        v
  Intake & normalization  ->  dedupe key  ->  aggregate confidence
        |
        v
  Deterministic decision core  (src/lib/soc/logic.ts, pure + unit tested)
    - computePriority   severity + confidence + asset tier + service
                        criticality + identity risk + SLA age
    - routeIncident     first-match-wins rules, full evaluation trace
    - computeSla        ack / contain / resolve budgets per severity
    - evaluateAutomation  playbook pre-flight + human-approval gating
    - evaluateEscalation  tier2 -> incident commander -> executive
    - canAutoClose      hard block on high/critical
        |
        v
  Derived views (src/lib/soc/derive.ts)  ->  React routes + primitives
        |
        v
  Simulated actions -> response tasks + evidence + audit entries (in memory)`;

export function Architecture() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Architecture & Security"
        title="How the lab is built"
        description="A single-page TanStack Start application. All decision logic is pure TypeScript over typed fixtures, so every screen is deterministic and every number is reproducible in a unit test."
      />

      <Panel title="Data & decision flow">
        <pre className="overflow-x-auto rounded-md border border-border/70 bg-surface/60 p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
{diagram}
        </pre>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Layers">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <span className="text-foreground">types.ts</span> — domain model; synthetic naming is
              enforced at the type level (source names carry a “(synthetic)” suffix).
            </li>
            <li>
              <span className="text-foreground">logic.ts</span> — pure decision functions. No I/O, no
              randomness, no clock reads: ages are precomputed in minutes.
            </li>
            <li>
              <span className="text-foreground">fixtures.ts</span> — the synthetic incident set,
              assets, identities, services, playbooks, tasks, evidence and audit entries.
            </li>
            <li>
              <span className="text-foreground">derive.ts</span> — enrichment and program metrics.
            </li>
            <li>
              <span className="text-foreground">components/soc</span> — the shell and presentation
              primitives, including the mandatory disclosure components.
            </li>
            <li>
              <span className="text-foreground">routes/</span> — one route per dashboard section.
            </li>
          </ul>
        </Panel>

        <Panel title="Implemented security controls">
          <div className="space-y-2">
            <ControlNote>
              Hard auto-close block for high and critical incidents, unit tested.
            </ControlNote>
            <ControlNote>
              Human-approval gating for every high-impact action, and for any non-trivial action on
              a tier0 or tier1 production asset.
            </ControlNote>
            <ControlNote>
              Explainability by construction: priority factors, routing rule traces and automation
              reasons are rendered, not summarised.
            </ControlNote>
            <ControlNote>
              Simulated AI output is labelled everywhere it appears and is advisory only.
            </ControlNote>
            <ControlNote>
              No secrets, credentials, tokens or network calls exist anywhere in the codebase.
            </ControlNote>
          </div>
        </Panel>
      </div>

      <Panel
        title="Production-only requirements (explicitly NOT implemented)"
        description="These are documented as gaps rather than faked."
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {[
            "Authentication & SSO",
            "RBAC / least privilege",
            "Real ServiceNow / SIEM / EDR / IdP integrations",
            "Secret vaulting & rotation",
            "Persistent immutable audit storage",
            "Signed inbound webhooks",
            "Change-management approvals",
            "Data retention & privacy controls",
            "Rate limiting & abuse protection",
            "Observability & alerting",
          ].map((t) => (
            <Pill key={t} tone="neutral">
              {t}
            </Pill>
          ))}
        </div>
        <HumanGate reason="This project must never be deployed as an operational security tool. It is a portfolio artifact: no live instance, no production incidents, no customer data, and no affiliation with or endorsement by ServiceNow." />
      </Panel>
    </AppShell>
  );
}
