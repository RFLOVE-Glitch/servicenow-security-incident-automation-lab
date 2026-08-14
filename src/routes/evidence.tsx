import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/soc/AppShell";
import { ControlNote, PageHeader, Panel, Pill, StatCard } from "@/components/soc/primitives";
import { auditLog, evidence } from "@/lib/soc/derive";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence & Audit — Security Incident Automation Lab" },
      {
        name: "description",
        content:
          "Synthetic evidence artifacts with simulated integrity digests and an append-only audit trail distinguishing analyst, automation and system actors.",
      },
      { property: "og:title", content: "Evidence & Audit" },
      {
        property: "og:description",
        content: "Chain-of-custody and audit modelling over synthetic artifacts.",
      },
    ],
  }),
  component: Evidence,
});

function Evidence() {
  const approvals = auditLog.filter((a) => a.humanApproved).length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Evidence & Audit"
        title="Chain of custody"
        description="Every artifact carries a collector, timestamp and simulated integrity digest. Every consequential action produces an audit entry that names the actor and whether a human approved it."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Evidence items" value={evidence.length} />
        <StatCard label="Audit entries" value={auditLog.length} />
        <StatCard label="Human approvals" value={approvals} tone="success" />
        <StatCard
          label="Automation entries"
          value={auditLog.filter((a) => a.actor === "automation").length}
          tone="primary"
        />
      </div>

      <ControlNote>
        Digests are fabricated placeholders over synthetic content — they demonstrate the integrity
        model, they do not attest to anything.
      </ControlNote>

      <Panel title="Evidence register">
        <div className="space-y-2">
          {evidence.map((ev) => (
            <div key={ev.id} className="rounded-md border border-border/70 bg-surface/50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="outline">{ev.kind.replace(/_/g, " ")}</Pill>
                <span className="text-sm text-foreground">{ev.label}</span>
                <Link
                  to="/incidents/$id"
                  params={{ id: ev.incidentId }}
                  className="ml-auto font-mono text-xs text-primary hover:underline"
                >
                  {ev.incidentId}
                </Link>
              </div>
              <p className="mt-1 font-mono text-xs break-all text-muted-foreground">{ev.value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {ev.collectedBy} · {ev.collectedAt} · digest {ev.integrityDigest}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Audit trail"
        description="In-memory for the demo; production requires immutable storage."
      >
        <ol className="space-y-2">
          {auditLog.map((a) => (
            <li key={a.id} className="border-b border-border/50 pb-2 last:border-0">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Pill
                  tone={
                    a.actor === "automation" ? "info" : a.actor === "system" ? "neutral" : "primary"
                  }
                >
                  {a.actor}
                </Pill>
                <span className="text-foreground">{a.action}</span>
                {a.humanApproved && <Pill tone="success">human approved</Pill>}
                <Link
                  to="/incidents/$id"
                  params={{ id: a.incidentId }}
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {a.incidentId}
                </Link>
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">{a.at}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {a.actorName} — {a.detail}
              </p>
            </li>
          ))}
        </ol>
      </Panel>
    </AppShell>
  );
}
