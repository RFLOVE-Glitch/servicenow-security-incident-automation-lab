import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/soc/AppShell";
import { PageHeader, Panel, Pill, StatCard, formatMinutes } from "@/components/soc/primitives";
import { enrichedIncidents, programMetrics } from "@/lib/soc/derive";
import type { IncidentCategory } from "@/lib/soc/types";

export const Route = createFileRoute("/metrics")({
  head: () => ({
    meta: [
      { title: "Metrics & Reporting — Security Incident Automation Lab" },
      {
        name: "description",
        content:
          "Program-level reporting over the synthetic incident set: priority mix, category distribution, SLA attainment, automation coverage and human-approval rate.",
      },
      { property: "og:title", content: "Metrics & Reporting" },
      {
        property: "og:description",
        content: "Deterministic program metrics derived from the synthetic incident fixtures.",
      },
    ],
  }),
  component: Metrics,
});

function Metrics() {
  const m = programMetrics();

  const byPriority = (["P1", "P2", "P3", "P4"] as const).map((p) => ({
    key: p,
    count: enrichedIncidents.filter((e) => e.priority.priority === p).length,
  }));

  const categories = [
    ...new Set(enrichedIncidents.map((e) => e.incident.category)),
  ] as IncidentCategory[];
  const byCategory = categories.map((c) => ({
    key: c,
    count: enrichedIncidents.filter((e) => e.incident.category === c).length,
  }));

  const slaAttainment = (["ackSla", "containSla", "resolveSla"] as const).map((k) => ({
    key: k,
    onTrack: enrichedIncidents.filter((e) => e[k].state === "on_track").length,
    atRisk: enrichedIncidents.filter((e) => e[k].state === "at_risk").length,
    breached: enrichedIncidents.filter((e) => e[k].state === "breached").length,
  }));

  const meanAge = Math.round(
    enrichedIncidents.reduce((s, e) => s + e.incident.ageMinutes, 0) / enrichedIncidents.length,
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Metrics & Reporting"
        title="Program reporting"
        description="All figures are recomputed from the fixture set on every render, so the numbers here always agree with the incident pages."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Incidents" value={m.total} hint={`${m.open} open`} />
        <StatCard label="Mean confidence" value={`${m.meanConfidence}%`} tone="primary" />
        <StatCard label="Mean age" value={formatMinutes(meanAge)} />
        <StatCard
          label="Automation coverage"
          value={`${m.automationCoveragePct}%`}
          tone="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Priority mix">
          <BarList items={byPriority} total={m.total} />
        </Panel>
        <Panel title="Category distribution">
          <BarList
            items={byCategory.map((c) => ({ key: c.key.replace(/_/g, " "), count: c.count }))}
            total={m.total}
          />
        </Panel>
      </div>

      <Panel title="SLA attainment" description="Counts across all incidents in the fixture set.">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
              <th className="py-2 pr-3 font-medium">Stage</th>
              <th className="py-2 pr-3 font-medium">On track</th>
              <th className="py-2 pr-3 font-medium">At risk</th>
              <th className="py-2 font-medium">Breached</th>
            </tr>
          </thead>
          <tbody>
            {slaAttainment.map((s) => (
              <tr key={s.key} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-3 text-foreground capitalize">{s.key.replace("Sla", "")}</td>
                <td className="py-2 pr-3">
                  <Pill tone="success">{s.onTrack}</Pill>
                </td>
                <td className="py-2 pr-3">
                  <Pill tone="warning">{s.atRisk}</Pill>
                </td>
                <td className="py-2">
                  <Pill tone="critical">{s.breached}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel
        title="Human-in-the-loop"
        description="Automation is measured against approval activity, not in isolation."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Simulated automated actions" value={m.automatedActions} tone="primary" />
          <StatCard label="Recorded human approvals" value={m.humanApprovals} tone="success" />
          <StatCard label="Tasks awaiting approval" value={m.awaitingApproval} tone="critical" />
        </div>
      </Panel>
    </AppShell>
  );
}

function BarList({ items, total }: { items: { key: string; count: number }[]; total: number }) {
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.key}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground capitalize">{i.key}</span>
            <span className="font-mono text-muted-foreground">{i.count}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${total === 0 ? 0 : Math.round((i.count / total) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
