# ServiceNow Security Incident Automation Lab

A recruiter-facing portfolio MVP that demonstrates a **defensive** enterprise security
incident-response workflow: deterministic triage, explainable routing, SLA and escalation
modelling, and guardrailed response automation with a human in the loop.

## Non-affiliation and data disclosure

This project is **inspired by publicly documented ServiceNow-style security operations
workflows**. It is **not affiliated with, sponsored by, or endorsed by ServiceNow**.

- No live ServiceNow instance, SIEM, EDR, identity provider, mail gateway or ticketing system is
  connected. Every integration is **simulated**.
- Every incident, host, identity, indicator, detection source, evidence artifact and audit entry
  is **synthetic** and fabricated for demonstration.
- There are **no credentials, secrets, customer data, personal data or production incidents** in
  this repository.
- Simulated AI triage output is **advisory only**, clearly labelled, and never authorises an
  action on its own.

This is a portfolio artifact and must not be deployed as an operational security tool.

## What it demonstrates

| Section | What it shows |
| --- | --- |
| Executive Overview | Program posture, top-priority queue, safety controls in force |
| Incident Queue | All incidents ranked by computed priority score |
| Incident Detail | Full scoring / routing / SLA / automation / evidence / audit trace |
| Automation Playbooks | Playbook gates, per-action impact and approval requirements |
| Detection & Intake | Fabricated sources, normalization, dedupe keys, aggregate confidence |
| SLA & Escalation | Severity budgets, at-risk and breach states, escalation ladder |
| Response Tasks | Automated vs human-gated work by assignment group |
| Evidence & Audit | Chain of custody with simulated digests and actor-attributed audit |
| Metrics & Reporting | Priority mix, category mix, SLA attainment, automation coverage |
| Architecture & Security | Layering, implemented controls, production-only gaps |
| Docs & Tests | Implementation status and decision-logic test coverage |

## Decision logic

All decisions are pure functions in `src/lib/soc/logic.ts` — no I/O, no randomness, no clock
reads (incident ages are precomputed in minutes), so every rendered value is reproducible in a
unit test.

- `computePriority` — severity, aggregate detection confidence, asset tier, business-service
  criticality, identity risk and SLA age, producing a score and a P1–P4 band plus the factor list.
- `routeIncident` — first-match-wins assignment rules with the full evaluation trace.
- `computeSla` — acknowledge / contain / resolve budgets per severity with on-track, at-risk and
  breached states.
- `evaluateAutomation` — playbook pre-flight (category, severity, confidence) and partitioning of
  actions into auto-executable vs human-approval-required.
- `canAutoClose` — **hard rule: high and critical incidents can never be auto-closed.**
- `evaluateEscalation` — tier 2 → incident commander → executive, with the reasons that triggered
  each level.

## Stack

TypeScript · React 19 · TanStack Start / Router · Tailwind CSS v4 · shadcn-style primitives ·
Vitest.

## Commands

```sh
npm install
npm run dev     # local dev server
npm run test    # unit tests (vitest)
npm run lint    # eslint
npm run build   # production build
```

## Documentation

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/incident-workflow.md`](docs/incident-workflow.md)
- [`docs/automation-logic.md`](docs/automation-logic.md)
- [`docs/sla-escalation.md`](docs/sla-escalation.md)
- [`docs/security-controls.md`](docs/security-controls.md)
- [`docs/implementation-status.md`](docs/implementation-status.md)
