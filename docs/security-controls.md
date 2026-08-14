# Security controls

## Implemented in this demo

- **Auto-close prohibition.** High and critical incidents can never be closed automatically;
  enforced in `canAutoClose` and unit tested.
- **Human-in-the-loop gating.** High-impact actions, and any non-trivial action against a tier0 or
  tier1 production asset, require documented human approval before the simulated execution.
- **Explainability.** Priority factors, routing rule traces, automation reasons and escalation
  triggers are rendered in full rather than summarised, so a reviewer can audit every decision.
- **Labelled AI.** Simulated AI output is badged as advisory everywhere it appears and is not an
  input to any decision function.
- **Attributed audit trail.** Every consequential entry names the actor and records whether a
  human approved it.
- **Evidence integrity model.** Artifacts carry collector, timestamp and a simulated digest.
- **No sensitive material.** No credentials, tokens, secrets, personal data or customer data exist
  in the repository, and the app makes no outbound network calls.
- **Deterministic surface.** No user input is accepted, so there is no injection, upload or
  server-side mutation surface in the demo.

## Threat notes for a real deployment

Because the demo has no auth, no persistence and no integrations, its own attack surface is
limited to static content. A production version would inherit a substantially larger surface:
webhook forgery at intake, privilege escalation through playbook editing, over-broad automation
credentials in EDR/IdP integrations, audit tampering, and data exposure through incident content.
Those are addressed in `implementation-status.md` as production-only requirements.

## Not affiliated

Inspired by ServiceNow-style security operations workflows; not affiliated with or endorsed by
ServiceNow, and connected to no live ServiceNow, SIEM, EDR or identity-provider system.
