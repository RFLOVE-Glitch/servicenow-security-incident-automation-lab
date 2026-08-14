# Implementation status

## Implemented (demo functionality)

- Typed domain model for incidents, assets, identities, business services, playbooks, response
  tasks, evidence and audit entries.
- Deterministic priority scoring with a rendered factor-by-factor trace.
- First-match-wins routing with a full rule evaluation trace.
- Severity-based acknowledge / contain / resolve SLA budgets with at-risk and breach states.
- Escalation ladder derived from SLA pressure, priority and business-service criticality.
- Playbook automation pre-flight with category, severity and confidence gates.
- Human-approval gating for high-impact actions and tier0/tier1 production assets.
- Hard auto-close prohibition for high and critical incidents.
- Labelled, advisory-only simulated AI triage summaries and suggestions.
- Evidence register with simulated integrity digests and an attributed audit trail.
- Program metrics recomputed from fixtures on every render.
- Unit tests over priority, SLA, routing, automation eligibility, auto-close and escalation.
- Eleven dashboard routes with per-route metadata and persistent synthetic-data disclosure.

## Simulated (looks like an integration, is not one)

- Detection sources (`SIM-SIEM`, `SIM-EDR`, `SIM-CloudTrail`, `SIM-MailGateway`,
  `SIM-IdentityProvider`, `SIM-VulnScanner`, `SIM-UserReport`).
- Playbook action integrations (containment, identity actions, mail purge, ticketing).
- Evidence integrity digests.
- AI triage summaries and suggested actions.

## Production-only (deliberately NOT implemented)

| Capability | Status |
| --- | --- |
| Authentication & SSO | Not implemented. Every route is public and read-only. |
| RBAC / least privilege | Not implemented. Assignment groups are display data, not authorization. |
| Real ServiceNow / SIEM / EDR / IdP integrations | Not implemented. No client, endpoint or credential exists. |
| Secret vaulting & rotation | Not implemented. No secrets exist to store. |
| Persistent immutable audit storage | Not implemented. The audit trail is an in-memory fixture. |
| Inbound webhooks | Not implemented. Real intake needs signature verification and replay protection. |
| Change-management controls | Not implemented. Playbook changes are code changes here. |
| Data retention & privacy (DSAR, minimisation) | Not implemented. No personal or customer data is present. |
| Rate limiting & abuse protection | Not implemented. |
| Observability, logging and alerting | Not implemented. |

## Verification

Run `npm run test`, `npm run lint` and `npm run build`. The decision logic suite covers priority
calculation, the SLA model, routing, automation eligibility, auto-close safety and escalation.
