import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/soc/AppShell";
import {
  PageHeader,
  Panel,
  Pill,
  SeverityBadge,
  SlaBar,
  formatMinutes,
} from "@/components/soc/primitives";
import { enrichedIncidents } from "@/lib/soc/derive";
import { SLA_POLICIES } from "@/lib/soc/logic";

export const Route = createFileRoute("/sla")({
  head: () => ({
    meta: [
      { title: "SLA & Escalation — Security Incident Automation Lab" },
      {
        name: "description",
        content:
          "Severity-based acknowledge/contain/resolve SLA budgets with deterministic at-risk and breach thresholds, driving a transparent escalation ladder.",
      },
      { property: "og:title", content: "SLA & Escalation" },
      {
        property: "og:description",
        content: "Deterministic SLA budgets and the escalation ladder they trigger.",
      },
    ],
  }),
  component: Sla,
});

function Sla() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="SLA & Escalation"
        title="Response time model"
        description="Budgets are fixed per severity. Consumption above 75% marks an SLA at risk; past 100% it is breached. Escalation is derived from SLA pressure, priority and business-service criticality."
      />

      <Panel title="SLA policy" description="Minutes allowed per stage, by severity.">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
              <th className="py-2 pr-3 font-medium">Severity</th>
              <th className="py-2 pr-3 font-medium">Acknowledge</th>
              <th className="py-2 pr-3 font-medium">Contain</th>
              <th className="py-2 font-medium">Resolve</th>
            </tr>
          </thead>
          <tbody>
            {SLA_POLICIES.map((p) => (
              <tr key={p.severity} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-3">
                  <SeverityBadge severity={p.severity} />
                </td>
                <td className="py-2 pr-3 font-mono text-xs">{formatMinutes(p.ackMinutes)}</td>
                <td className="py-2 pr-3 font-mono text-xs">{formatMinutes(p.containMinutes)}</td>
                <td className="py-2 font-mono text-xs">{formatMinutes(p.resolveMinutes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel
        title="Escalation ladder"
        description="Highest triggered level wins; every trigger is listed on the incident."
      >
        <ul className="space-y-2 text-sm">
          <li className="text-muted-foreground">
            <Pill tone="success">none</Pill> — no trigger met.
          </li>
          <li className="text-muted-foreground">
            <Pill tone="warning">tier2</Pill> — containment SLA at risk.
          </li>
          <li className="text-muted-foreground">
            <Pill tone="high">incident commander</Pill> — containment SLA breached, or P1 priority.
          </li>
          <li className="text-muted-foreground">
            <Pill tone="critical">executive</Pill> — critical incident on a mission-critical (C1)
            business service.
          </li>
        </ul>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        {enrichedIncidents.map((e) => (
          <Panel
            key={e.incident.id}
            title={e.incident.title}
            description={`${e.incident.id} · escalation: ${e.escalation.level.replace(/_/g, " ")}`}
            actions={<SeverityBadge severity={e.incident.severity} />}
          >
            <div className="space-y-4">
              <SlaBar sla={e.ackSla} label="Acknowledge" />
              <SlaBar sla={e.containSla} label="Contain" />
              <SlaBar sla={e.resolveSla} label="Resolve" />
            </div>
            {e.escalation.reasons.length > 0 && (
              <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                {e.escalation.reasons.map((r) => (
                  <li key={r}>· {r}</li>
                ))}
              </ul>
            )}
            <Link
              to="/incidents/$id"
              params={{ id: e.incident.id }}
              className="mt-4 inline-block text-xs text-primary hover:underline"
            >
              Open incident detail →
            </Link>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
