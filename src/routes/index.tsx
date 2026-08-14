import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/soc/AppShell";
import {
  AiLabel,
  ControlNote,
  PageHeader,
  Panel,
  Pill,
  PriorityBadge,
  SeverityBadge,
  StatCard,
  formatMinutes,
  slaLabel,
} from "@/components/soc/primitives";
import { enrichedIncidents, programMetrics } from "@/lib/soc/derive";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Executive Overview — Security Incident Automation Lab" },
      {
        name: "description",
        content:
          "Synthetic security operations dashboard demonstrating deterministic incident triage, SLA tracking and human-gated response automation.",
      },
      { property: "og:title", content: "Security Incident Automation Lab" },
      {
        property: "og:description",
        content:
          "Recruiter-facing portfolio demo of an enterprise security incident workflow: explainable priority scoring, SLA/escalation and simulated playbook automation.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const m = programMetrics();
  const top = enrichedIncidents.slice(0, 5);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Executive Overview"
        title="Security Incident Automation Lab"
        description="A portfolio demonstration of a defensive enterprise incident-response workflow inspired by ServiceNow-style security operations. Every incident, host and detection source below is synthetic and every integration is simulated."
        actions={<AiLabel />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open incidents" value={m.open} hint={`${m.total} total in the fixture set`} />
        <StatCard label="P1 incidents" value={m.p1} tone="critical" hint="Require incident commander" />
        <StatCard label="Resolve SLA breached" value={m.breached} tone="warning" hint={`${m.atRisk} containment SLAs at risk`} />
        <StatCard
          label="Automation coverage"
          value={`${m.automationCoveragePct}%`}
          tone="primary"
          hint={`${m.automatedActions} simulated automated actions logged`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Highest-priority queue"
          description="Ordered by deterministic priority score. Click through for the full scoring, routing and automation trace."
        >
          <ul className="space-y-2">
            {top.map((e) => (
              <li key={e.incident.id}>
                <Link
                  to="/incidents/$id"
                  params={{ id: e.incident.id }}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-border/70 bg-surface/50 px-3 py-3 transition-colors hover:border-primary/50 hover:bg-surface"
                >
                  <PriorityBadge priority={e.priority.priority} />
                  <span className="font-mono text-xs text-muted-foreground">{e.incident.id}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {e.incident.title}
                  </span>
                  <SeverityBadge severity={e.incident.severity} />
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
                  <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-6">
          <Panel title="Safety controls in force" description="Enforced by pure, unit-tested logic.">
            <div className="space-y-2">
              <ControlNote>High and critical incidents can never be auto-closed.</ControlNote>
              <ControlNote>
                High-impact actions always require documented human approval before execution.
              </ControlNote>
              <ControlNote>
                Simulated AI triage is advisory only and is labelled everywhere it appears.
              </ControlNote>
            </div>
          </Panel>

          <Panel title="Program signal">
            <dl className="space-y-2 text-sm">
              <Row label="Mean detection confidence" value={`${m.meanConfidence}%`} />
              <Row label="Tasks awaiting approval" value={m.awaitingApproval} />
              <Row label="Human approvals recorded" value={m.humanApprovals} />
              <Row label="Automated audit entries" value={m.automatedActions} />
            </dl>
          </Panel>
        </div>
      </div>

      <Panel
        title="Scope & non-affiliation"
        description="Read this before evaluating the project."
        actions={<ShieldCheck className="size-4 text-success" aria-hidden />}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          This lab is inspired by publicly documented ServiceNow-style security operations
          workflows. It is <strong className="text-foreground">not affiliated with or endorsed by
          ServiceNow</strong> and has no live ServiceNow, SIEM, EDR, identity-provider, credential,
          customer-data or production-incident connection. All logic runs client-side over typed
          fixtures. See{" "}
          <Link to="/docs" className="text-primary underline-offset-4 hover:underline">
            Docs &amp; Tests
          </Link>{" "}
          for the implemented-vs-production breakdown, and{" "}
          <Link to="/architecture" className="text-primary underline-offset-4 hover:underline">
            Architecture &amp; Security
          </Link>{" "}
          for the control model. Ages are precomputed in minutes ({formatMinutes(1440)} = one day)
          so every rendered value is deterministic.
        </p>
      </Panel>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2 last:border-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm text-foreground">{value}</dd>
    </div>
  );
}
