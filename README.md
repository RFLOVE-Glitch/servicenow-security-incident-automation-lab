# ServiceNow Security Incident Automation Lab

**Security Operations • Incident Response • Workflow Automation • Human-in-the-Loop Security**

A recruiter-facing portfolio MVP demonstrating how enterprise security incidents can move from detection and triage through prioritization, routing, SLA management, response automation, escalation, evidence collection, and audit review.

The project emphasizes **deterministic and explainable security automation**, with explicit human approval required for consequential actions.

> **Portfolio demonstration only.** All incidents, identities, hosts, detections, integrations, evidence, timestamps, metrics, and operational data are synthetic or simulated.

## At a glance

| Area | Demonstrated capability |
| --- | --- |
| Security Operations | Incident intake, triage, prioritization and assignment |
| Incident Response | Investigation, containment, response tasks and escalation |
| Automation | Deterministic playbook eligibility and action gating |
| SLA Management | Acknowledge, contain and resolve timelines |
| Responsible AI | Advisory-only simulated AI triage with human review |
| Governance | Human approvals, audit history and evidence tracking |
| Architecture | Explicit implemented-vs-production control boundaries |
| Engineering | TypeScript, React, automated tests, linting and production build |

## Core workflow

The lab models a defensive enterprise incident-response lifecycle:

**Detection → Normalization → Priority Scoring → Routing → SLA Evaluation → Playbook Evaluation → Human Approval → Simulated Response → Evidence → Audit**

Every major decision is designed to be inspectable rather than hidden behind an opaque automation layer.

## What it demonstrates

| Section | What it shows |
| --- | --- |
| Executive Overview | Security posture, priority queue, SLA risk and automation coverage |
| Incident Queue | Incidents ordered by deterministic priority score |
| Incident Detail | Scoring, routing, SLA, automation, evidence and escalation trace |
| Automation Playbooks | Action eligibility, impact classification and approval gates |
| Detection & Intake | Synthetic detections, normalization, deduplication and confidence |
| SLA & Escalation | Severity-based budgets, at-risk states, breaches and escalation |
| Response Tasks | Automated versus analyst-approved work |
| Evidence & Audit | Chain-of-custody concepts, actors, approvals and simulated digests |
| Metrics & Reporting | Incident mix, SLA attainment and automation coverage |
| Architecture & Security | Security boundaries and production-control requirements |
| Docs & Tests | Engineering documentation and decision-logic validation |

## Explainable priority scoring

Priority is calculated from multiple deterministic factors rather than manually assigned for presentation.

Examples include:

- Incident severity
- Detection confidence
- Asset criticality
- Business-service criticality
- Identity risk
- SLA age pressure

The incident-detail page exposes the scoring trace so the resulting priority can be reviewed and explained.

## Guardrailed response automation

Automation is intentionally constrained.

Playbooks evaluate:

- Incident category
- Minimum severity
- Detection-confidence threshold
- Action impact
- Approval requirements

Low-risk simulated actions may be eligible for automatic execution.

**High-impact actions require explicit human approval before they can be marked as executed.**

A hard safety rule also prevents **high and critical incidents from ever being automatically closed**.

## Responsible AI design

The lab contains simulated AI-assisted triage to demonstrate how AI might support an analyst without replacing accountable human decision-making.

AI output is:

- Clearly identified as simulated
- Advisory only
- Unable to authorize actions
- Subject to analyst review
- Kept separate from deterministic scoring and enforcement logic

## SLA and escalation model

The application models separate:

- Acknowledge SLA
- Containment SLA
- Resolution SLA

Incidents may move through **on-track**, **at-risk**, and **breached** states.

Escalation logic can route significant incidents through higher operational tiers such as senior responders, an incident commander, and executive stakeholders based on deterministic conditions.

## Evidence and audit

The Evidence & Audit view demonstrates security-governance concepts including:

- Evidence artifacts
- Collector identity
- Timestamps
- Simulated integrity digests
- Human approvals
- Automated actions
- Actor-attributed audit entries
- Incident references

Synthetic digest values demonstrate the evidence-integrity model only; they do not attest to real evidence.

## Decision logic

Core decisions are implemented as deterministic functions so results remain reproducible and testable.

Examples include:

- `computePriority`
- `routeIncident`
- `computeSla`
- `evaluateAutomation`
- `evaluateEscalation`
- `canAutoClose`

The implementation avoids hidden model-generated decisions for security enforcement.

## Engineering quality

Current verification results:

- **44 / 44 unit tests passing**
- **Typecheck: 0 errors**
- **Lint: 0 errors**
- Production build successful
- All **11 application routes** verified
- Zero route-rendering console/page errors during verification

The remaining lint notices are pre-existing Fast Refresh warnings associated with UI primitives rather than application logic failures.

## Technology

- TypeScript
- React 19
- TanStack Start / Router
- Tailwind CSS
- shadcn-style UI primitives
- Vitest
- ESLint

## Architecture and production boundary

This repository is a portfolio MVP, not a production Security Operations platform.

### Implemented in the demonstration

- Synthetic incident and detection fixtures
- Deterministic priority scoring
- Explainable routing
- SLA calculations
- Escalation logic
- Playbook eligibility
- Human-approval gating
- Simulated response actions
- Evidence and audit presentation
- Advisory simulated AI triage
- Automated decision-logic tests

### Production capabilities intentionally not claimed

A production implementation would require additional controls such as:

- Authentication and enterprise identity integration
- Enforced RBAC
- Persistent transactional storage
- Immutable audit storage
- Secrets management
- Encryption/key-management integration
- Real SIEM, EDR, IAM and ticketing integrations
- Webhook/API security
- Change-management controls
- Monitoring and alerting
- Backup and recovery
- Production authorization boundaries

## Non-affiliation and data disclosure

This project is **inspired by publicly documented ServiceNow-style security operations workflows**.

It is **not affiliated with, sponsored by, or endorsed by ServiceNow**.

There is:

- No live ServiceNow instance
- No live SIEM or EDR
- No identity-provider connection
- No production credentials or secrets
- No customer information
- No real incident data

Every integration displayed in the application is simulated.

## Documentation

Additional engineering documentation is included in:

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/incident-workflow.md`](docs/incident-workflow.md)
- [`docs/automation-logic.md`](docs/automation-logic.md)
- [`docs/sla-escalation.md`](docs/sla-escalation.md)
- [`docs/security-controls.md`](docs/security-controls.md)
- [`docs/implementation-status.md`](docs/implementation-status.md)

## Run locally

```sh
npm install
npm run dev
npm run test
npm run lint
npm run build
