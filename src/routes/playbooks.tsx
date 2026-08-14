import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/soc/AppShell";
import { HumanGate, PageHeader, Panel, Pill } from "@/components/soc/primitives";
import { playbooks } from "@/lib/soc/derive";

export const Route = createFileRoute("/playbooks")({
  head: () => ({
    meta: [
      { title: "Automation Playbooks — Security Incident Automation Lab" },
      {
        name: "description",
        content:
          "Simulated response playbooks with explicit guardrails: low-impact steps may run automatically, consequential actions always require documented human approval.",
      },
      { property: "og:title", content: "Automation Playbooks" },
      {
        property: "og:description",
        content: "Guardrailed, human-in-the-loop response automation over synthetic incidents.",
      },
    ],
  }),
  component: Playbooks,
});

function Playbooks() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Automation Playbooks"
        title="Simulated response automation"
        description="Each playbook declares the categories it covers, a minimum severity and confidence threshold, and per-action impact. Nothing here calls a real system."
      />

      <HumanGate reason="Every high-impact action is gated behind explicit human approval, and approval is recorded in the audit trail before the simulated action is marked executed." />

      <div className="grid gap-6 lg:grid-cols-2">
        {playbooks.map((p) => (
          <Panel key={p.id} title={p.name} description={p.description}>
            <div className="flex flex-wrap gap-2">
              {p.appliesToCategories.map((c) => (
                <Pill key={c} tone="outline">
                  {c.replace(/_/g, " ")}
                </Pill>
              ))}
              <Pill tone="primary">min severity: {p.minSeverity}</Pill>
              <Pill tone="primary">min confidence: {p.minConfidence}%</Pill>
            </div>

            <p className="mt-4 label-caps">Actions</p>
            <ul className="mt-2 space-y-2">
              {p.actions.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-2 border-b border-border/50 pb-2 text-sm last:border-0"
                >
                  <span className="min-w-0 flex-1 text-foreground">{a.label}</span>
                  <Pill
                    tone={a.impact === "high" ? "critical" : a.impact === "medium" ? "warning" : "low"}
                  >
                    {a.impact} impact
                  </Pill>
                  {a.requiresHumanApproval ? (
                    <Pill tone="critical">approval required</Pill>
                  ) : (
                    <Pill tone="success">may auto-run</Pill>
                  )}
                  <span className="w-full text-[11px] text-muted-foreground">
                    Simulated integration: {a.simulatedIntegration}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-4 label-caps">Guardrails</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {p.guardrails.map((g) => (
                <li key={g}>· {g}</li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
