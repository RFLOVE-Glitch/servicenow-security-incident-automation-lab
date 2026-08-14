import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { AppShell } from "@/components/soc/AppShell";
import {
  AiLabel,
  ControlNote,
  HumanGate,
  KeyValue,
  PageHeader,
  Panel,
  Pill,
  PriorityBadge,
  SeverityBadge,
  SlaBar,
  StatusPill,
  formatMinutes,
} from "@/components/soc/primitives";
import { auditFor, evidenceFor, findEnriched, tasksFor } from "@/lib/soc/derive";

export const Route = createFileRoute("/incidents/$id")({
  loader: ({ params }) => {
    const enriched = findEnriched(params.id);
    if (!enriched) throw notFound();
    return { id: enriched.incident.id, title: enriched.incident.title };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Incident unavailable — Security Incident Automation Lab" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.id} · ${loaderData.title} — Incident Detail`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `Full deterministic triage trace for synthetic incident ${loaderData.id}: priority factors, routing rules, SLA posture, automation eligibility, evidence and audit history.`,
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: `Explainable triage trace for synthetic incident ${loaderData.id}.`,
        },
      ],
    };
  },
  notFoundComponent: IncidentNotFound,
  component: IncidentDetail,
});

function IncidentNotFound() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Incident Detail"
        title="Incident not found"
        description="No synthetic incident matches that identifier."
      />
      <Link to="/incidents" className="text-sm text-primary hover:underline">
        Back to the incident queue
      </Link>
    </AppShell>
  );
}

function IncidentDetail() {
  const { id } = Route.useParams();
  const e = findEnriched(id);
  if (!e) return <IncidentNotFound />;

  const { incident, asset, identity, service } = e;
  const tasks = tasksFor(incident.id);
  const items = evidenceFor(incident.id);
  const audit = auditFor(incident.id);

  return (
    <AppShell>
      <PageHeader
        eyebrow={`Incident Detail · ${incident.id}`}
        title={incident.title}
        description={`${incident.category.replace(/_/g, " ")} affecting ${asset.hostname} (${asset.tier}, ${asset.environment}) in business service "${service.name}".`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={e.priority.priority} />
            <SeverityBadge severity={incident.severity} />
            <Pill tone="outline">{incident.state}</Pill>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel
            title="Simulated AI triage summary"
            description="Advisory only. Never used to take an action on its own."
            actions={<AiLabel />}
          >
            <p className="text-sm leading-relaxed text-foreground">{incident.aiSummary}</p>
            <p className="mt-4 label-caps">Suggested actions (require analyst review)</p>
            <ul className="mt-2 space-y-1.5">
              {incident.aiSuggestedActions.map((a) => (
                <li key={a} className="text-sm text-muted-foreground">
                  · {a}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <HumanGate reason="No suggestion here is executed automatically. An analyst must approve each consequential action and the decision is recorded in the audit trail." />
            </div>
          </Panel>

          <Panel
            title="Priority scoring trace"
            description={`Deterministic score ${e.priority.score} → ${e.priority.priority}.`}
          >
            <table className="w-full text-left text-sm">
              <tbody>
                {e.priority.factors.map((f) => (
                  <tr key={f.label} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 text-foreground">{f.label}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{f.detail}</td>
                    <td className="py-2 text-right font-mono text-sm text-primary">+{f.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel
            title="Routing decision"
            description={`Assigned to ${e.routing.group}. First matching rule wins.`}
          >
            <p className="mb-3 text-sm text-muted-foreground">{e.routing.reason}</p>
            <ul className="space-y-1.5">
              {e.routing.rulesEvaluated.map((r) => (
                <li key={r.rule} className="flex items-center gap-2 text-xs">
                  <Pill tone={r.matched ? "success" : "neutral"}>
                    {r.matched ? "matched" : "no match"}
                  </Pill>
                  <span className="text-muted-foreground">{r.rule}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Detection signals" description="Fabricated sources, normalized at intake.">
            <div className="space-y-3">
              {incident.signals.map((s) => (
                <div key={s.id} className="rounded-md border border-border/70 bg-surface/50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="info">{s.source}</Pill>
                    <span className="text-sm text-foreground">{s.rule}</span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {s.confidence}% conf.
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
                    <span>MITRE: {s.mitreTechnique}</span>
                    <span>Observed: {s.observedAt}</span>
                    <span className="font-mono">dedupe: {s.dedupeKey}</span>
                    <span>{s.normalized ? "Normalized ✓" : "Raw (not normalized)"}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Automation eligibility" description="Simulated playbook pre-flight.">
            <div className="space-y-4">
              {e.playbooks.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No playbook covers this incident category.
                </p>
              )}
              {e.playbooks.map(({ playbook, eligibility }) => (
                <div key={playbook.id} className="rounded-md border border-border/70 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{playbook.name}</span>
                    <Pill
                      tone={
                        eligibility.decision === "eligible"
                          ? "success"
                          : eligibility.decision === "requires_approval"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {eligibility.decision.replace(/_/g, " ")}
                    </Pill>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {eligibility.reasons.map((r) => (
                      <li key={r}>· {r}</li>
                    ))}
                  </ul>
                  {eligibility.autoExecutable.length > 0 && (
                    <div className="mt-3">
                      <p className="label-caps">Auto-executable (low impact, simulated)</p>
                      <ul className="mt-1 space-y-1 text-xs text-success">
                        {eligibility.autoExecutable.map((a) => (
                          <li key={a.id}>· {a.label}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {eligibility.approvalRequired.length > 0 && (
                    <div className="mt-3">
                      <p className="label-caps">Human approval required</p>
                      <ul className="mt-1 space-y-1 text-xs text-critical">
                        {eligibility.approvalRequired.map((a) => (
                          <li key={a.id}>
                            · {a.label} <span className="text-muted-foreground">({a.impact} impact · {a.simulatedIntegration})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Response tasks">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks generated for this incident.</p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center gap-2 border-b border-border/50 pb-2 last:border-0"
                  >
                    <StatusPill status={t.status} />
                    <span className="min-w-0 flex-1 text-sm text-foreground">{t.title}</span>
                    <span className="text-xs text-muted-foreground">{t.assignmentGroup}</span>
                    {t.automated && <Pill tone="info">automated</Pill>}
                    {t.requiresApproval && <Pill tone="critical">approval</Pill>}
                    <span className="font-mono text-[11px] text-muted-foreground">
                      due {formatMinutes(t.dueInMinutes)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Evidence" description="Synthetic artifacts with simulated integrity digests.">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No evidence recorded.</p>
            ) : (
              <div className="space-y-2">
                {items.map((ev) => (
                  <div key={ev.id} className="rounded-md border border-border/70 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="outline">{ev.kind.replace(/_/g, " ")}</Pill>
                      <span className="text-sm text-foreground">{ev.label}</span>
                    </div>
                    <p className="mt-1 font-mono text-xs break-all text-muted-foreground">{ev.value}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {ev.collectedBy} · {ev.collectedAt} · digest {ev.integrityDigest}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Audit trail" description="Append-only in the demo; in-memory only.">
            <ol className="space-y-2">
              {audit.map((a) => (
                <li key={a.id} className="border-b border-border/50 pb-2 text-sm last:border-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={a.actor === "automation" ? "info" : a.actor === "system" ? "neutral" : "primary"}>
                      {a.actor}
                    </Pill>
                    <span className="text-foreground">{a.action}</span>
                    {a.humanApproved && <Pill tone="success">human approved</Pill>}
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">{a.at}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.actorName} — {a.detail}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="SLA posture">
            <div className="space-y-4">
              <SlaBar sla={e.ackSla} label="Acknowledge" />
              <SlaBar sla={e.containSla} label="Contain" />
              <SlaBar sla={e.resolveSla} label="Resolve" />
            </div>
          </Panel>

          <Panel title="Escalation">
            <Pill
              tone={
                e.escalation.level === "executive"
                  ? "critical"
                  : e.escalation.level === "incident_commander"
                    ? "high"
                    : e.escalation.level === "tier2"
                      ? "warning"
                      : "success"
              }
            >
              {e.escalation.level.replace(/_/g, " ")}
            </Pill>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {e.escalation.reasons.length === 0 && <li>· No escalation triggers met.</li>}
              {e.escalation.reasons.map((r) => (
                <li key={r}>· {r}</li>
              ))}
            </ul>
            {e.escalation.notify.length > 0 && (
              <>
                <p className="mt-3 label-caps">Notify (simulated)</p>
                <ul className="mt-1 space-y-1 text-xs text-foreground">
                  {e.escalation.notify.map((n) => (
                    <li key={n}>· {n}</li>
                  ))}
                </ul>
              </>
            )}
          </Panel>

          <Panel title="Closure control">
            {e.autoClose.allowed ? (
              <ControlNote>{e.autoClose.reason}</ControlNote>
            ) : (
              <HumanGate reason={e.autoClose.reason} />
            )}
          </Panel>

          <Panel title="Context">
            <KeyValue label="Opened" value={incident.openedAt} />
            <KeyValue label="Age" value={formatMinutes(incident.ageMinutes)} />
            <KeyValue label="Asset" value={`${asset.hostname} (${asset.tier})`} />
            <KeyValue label="Environment" value={asset.environment} />
            <KeyValue label="Business service" value={`${service.name} · C${service.criticality}`} />
            <KeyValue label="Service owner" value={service.owner} />
            <KeyValue label="Identity" value={identity.displayName} />
            <KeyValue label="Identity risk" value={identity.risk} />
            <KeyValue label="Department" value={identity.department} />
            <KeyValue label="Aggregate confidence" value={`${e.confidence}%`} />
            <KeyValue
              label="Containment approved"
              value={incident.containmentApproved ? "Yes (human)" : "No"}
            />
          </Panel>

          <Link to="/incidents" className="block text-sm text-primary hover:underline">
            ← Back to queue
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
