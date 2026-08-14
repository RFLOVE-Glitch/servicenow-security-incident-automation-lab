import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/soc/AppShell";
import { PageHeader, Panel, Pill, StatCard } from "@/components/soc/primitives";
import { enrichedIncidents } from "@/lib/soc/derive";

export const Route = createFileRoute("/detection")({
  head: () => ({
    meta: [
      { title: "Detection & Intake — Security Incident Automation Lab" },
      {
        name: "description",
        content:
          "Fabricated detection sources, normalization and deduplication for the synthetic incident intake pipeline, with aggregate confidence scoring.",
      },
      { property: "og:title", content: "Detection & Intake" },
      {
        property: "og:description",
        content: "Simulated SIEM/EDR/mail-gateway intake, normalization and dedupe keys.",
      },
    ],
  }),
  component: Detection,
});

function Detection() {
  const signals = enrichedIncidents.flatMap((e) =>
    e.incident.signals.map((s) => ({ signal: s, incident: e.incident, confidence: e.confidence })),
  );
  const sources = [...new Set(signals.map((s) => s.signal.source))];
  const normalized = signals.filter((s) => s.signal.normalized).length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Detection & Intake"
        title="Simulated detection pipeline"
        description="Signals arrive from fabricated sources, are normalized into a common shape, deduplicated by key, and aggregated into a single incident confidence used by priority and automation logic."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Signals ingested" value={signals.length} />
        <StatCard label="Distinct sources" value={sources.length} />
        <StatCard label="Normalized" value={`${normalized}/${signals.length}`} tone="success" />
        <StatCard
          label="Dedupe keys"
          value={new Set(signals.map((s) => s.signal.dedupeKey)).size}
          tone="primary"
        />
      </div>

      <Panel title="Fabricated sources" description="None of these connect to a real product.">
        <div className="flex flex-wrap gap-2">
          {sources.map((s) => (
            <Pill key={s} tone="info">
              {s}
            </Pill>
          ))}
        </div>
      </Panel>

      <Panel
        title="Intake stream"
        description="Aggregate confidence per incident is derived from its signals, never entered by hand."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                <th className="py-2 pr-3 font-medium">Source</th>
                <th className="py-2 pr-3 font-medium">Rule</th>
                <th className="py-2 pr-3 font-medium">MITRE</th>
                <th className="py-2 pr-3 font-medium">Conf.</th>
                <th className="py-2 pr-3 font-medium">Dedupe key</th>
                <th className="py-2 pr-3 font-medium">Norm.</th>
                <th className="py-2 font-medium">Incident</th>
              </tr>
            </thead>
            <tbody>
              {signals.map(({ signal, incident, confidence }) => (
                <tr key={signal.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-3 text-xs text-muted-foreground">{signal.source}</td>
                  <td className="py-2 pr-3 text-foreground">{signal.rule}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">
                    {signal.mitreTechnique}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">{signal.confidence}%</td>
                  <td className="py-2 pr-3 font-mono text-[11px] text-muted-foreground">
                    {signal.dedupeKey}
                  </td>
                  <td className="py-2 pr-3">
                    <Pill tone={signal.normalized ? "success" : "warning"}>
                      {signal.normalized ? "yes" : "no"}
                    </Pill>
                  </td>
                  <td className="py-2">
                    <Link
                      to="/incidents/$id"
                      params={{ id: incident.id }}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {incident.id}
                    </Link>
                    <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                      agg {confidence}%
                    </span>
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
