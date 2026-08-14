# Incident workflow

Synthetic data only; all integrations simulated.

## States

`new → triage → analysis → containment → eradication → recovery → review → closed`

## Lifecycle

1. **Intake.** Signals arrive from fabricated sources, are normalized and given a dedupe key.
   Aggregate confidence is derived from the signal set.
2. **Triage.** `computePriority` scores severity, confidence, asset tier, business-service
   criticality, identity risk and SLA age into a P1–P4 band. Every contributing factor is rendered
   on the incident detail page.
3. **Assignment.** `routeIncident` applies first-match-wins rules and records which rules matched
   and which did not, so the assignment is always explainable.
4. **Analysis.** A clearly labelled simulated AI summary and suggested-action list are shown. They
   are advisory: nothing executes from them.
5. **Containment.** Playbook actions are evaluated by `evaluateAutomation`. Low-impact steps may
   run automatically in the simulation; consequential steps are held for documented human
   approval.
6. **Eradication and recovery.** Response tasks track the work per assignment group; approval-gated
   tasks never advance on their own.
7. **Review and closure.** `canAutoClose` permits automatic closure only for low/medium incidents
   in the `review` state with human-validated containment. **High and critical incidents can never
   be auto-closed.**

## Evidence and audit

Each artifact records collector, timestamp and a simulated integrity digest. Each consequential
step writes an audit entry naming the actor (`analyst`, `automation`, `system`) and whether a
human approved it.
