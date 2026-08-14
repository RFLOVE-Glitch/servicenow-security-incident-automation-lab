import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/soc/AppShell";
import {
  PageHeader,
  Panel,
  Pill,
  PriorityBadge,
  SeverityBadge,
  formatMinutes,
  slaLabel,
} from "@/components/soc/primitives";
import { enrichedIncidents } from "@/lib/soc/derive";

export const Route = createFileRoute("/incidents/")({
  head: () => ({
    meta: [
      { title: "Incident Queue — Security Incident Automation Lab" },
      {
        name: "description",
        content:
          "Synthetic security incident queue ranked by deterministic priority scoring across severity, confidence, asset tier, service criticality and identity risk.",
      },
      { property: "og:title", content: "Incident Queue" },
      {
        property: "og:description",
        content: "Deterministic, explainable triage queue over synthetic security incidents.",
      },
    ],
  }),
  component: IncidentQueue,
});

function IncidentQueue() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Incident Queue"
        title="Triage queue"
        description="All synthetic incidents ordered by computed priority score. Routing, SLA state and automation posture are derived, never hand-authored."
      />

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                <th className="py-2 pr-3 font-medium">Priority</th>
                <th className="py-2 pr-3 font-medium">Incident</th>
                <th className="py-2 pr-3 font-medium">Severity</th>
                <th className="py-2 pr-3 font-medium">State</th>
                <th className="py-2 pr-3 font-medium">Assignment</th>
                <th className="py-2 pr-3 font-medium">Conf.</th>
                <th className="py-2 pr-3 font-medium">Age</th>
                <th className="py-2 font-medium">Resolve SLA</th>
              </tr>
            </thead>
            <tbody>
              {enrichedIncidents.map((e) => (
                <tr key={e.incident.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 pr-3 align-top">
                    <PriorityBadge priority={e.priority.priority} />
                    <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {e.priority.score} pts
                    </div>
                  </td>
                  <td className="py-3 pr-3 align-top">
                    <Link
                      to="/incidents/$id"
                      params={{ id: e.incident.id }}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {e.incident.title}
                    </Link>
                    <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {e.incident.id} · {e.asset.hostname} · {e.service.name}
                    </div>
                  </td>
                  <td className="py-3 pr-3 align-top">
                    <SeverityBadge severity={e.incident.severity} />
                  </td>
                  <td className="py-3 pr-3 align-top text-xs text-muted-foreground capitalize">
                    {e.incident.state}
                  </td>
                  <td className="py-3 pr-3 align-top text-xs text-foreground">{e.routing.group}</td>
                  <td className="py-3 pr-3 align-top font-mono text-xs">{e.confidence}%</td>
                  <td className="py-3 pr-3 align-top font-mono text-xs text-muted-foreground">
                    {formatMinutes(e.incident.ageMinutes)}
                  </td>
                  <td className="py-3 align-top">
                    <Pill
                      tone={
                        e.resolveSla.state === "breached"
                          ? "critical"
                          : e.resolveSla.state === "at_risk"
                            ? "warning"
                            : "success"
                      }
                    >
                      {slaLabel[e.resolveSla.state]}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
