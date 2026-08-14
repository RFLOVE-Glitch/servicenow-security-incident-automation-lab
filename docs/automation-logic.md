# Automation logic

All automation is simulated. No action reaches a real system.

## Playbook definition

A playbook declares the incident categories it covers, a minimum severity, a minimum aggregate
detection confidence, an ordered action list (each with an impact of low / medium / high and a
named simulated integration), and human-readable guardrails.

## Pre-flight (`evaluateAutomation`)

The playbook is **blocked** unless all three hold:

1. the incident category is covered by the playbook;
2. the incident severity rank is at least the playbook minimum;
3. aggregate confidence meets or exceeds the playbook minimum.

Each failure is returned as a readable reason and rendered on the incident page.

## Approval gating

When pre-flight passes, actions are partitioned:

- An action is **gated** if it declares `requiresHumanApproval`, or its impact is `high`, or the
  incident is high-impact and the action impact is not `low`.
- An incident is **high-impact** when severity is `high`/`critical`, the asset is `tier0`, or the
  asset is `tier1` in `production`.
- Remaining actions are **auto-executable** in the simulation.

The overall decision is `eligible` only when nothing is gated; otherwise it is
`requires_approval`.

## Hard safety rule

`canAutoClose` refuses closure for any high or critical incident, regardless of state or the
containment-approved flag. For low/medium incidents it additionally requires human-validated
containment and the `review` state. This rule is covered by unit tests.

## AI assistance

Simulated AI summaries and suggestions are stored as fixture strings, labelled in the UI with an
explicit "simulated AI assist — advisory only" badge, and are never an input to any of the
decision functions.
