# SLA and escalation model

## Budgets

Budgets are fixed per severity, in minutes, for three stages: acknowledge, contain, resolve. They
are defined in `SLA_POLICIES` in `src/lib/soc/logic.ts` and rendered on the SLA page, so the
documentation cannot drift from the code.

## States

`computeSla` returns elapsed, remaining and percent-consumed against the stage budget:

- **on track** — under the at-risk threshold;
- **at risk** — consumption has passed the warning threshold but the budget is not yet exhausted;
- **breached** — consumption is at or above 100% of the budget.

Elapsed time comes from the incident's precomputed `ageMinutes`, never from the system clock.

## SLA pressure feeds priority

`slaAgePoints` contributes to the priority score, so an ageing incident naturally rises in the
queue without anyone editing it.

## Escalation ladder

`evaluateEscalation` raises the level monotonically — the highest triggered level wins — and
returns the reason for every trigger plus the (simulated) notification list:

| Level | Trigger |
| --- | --- |
| none | no trigger met |
| tier2 | containment SLA at risk |
| incident_commander | containment SLA breached, or P1 priority |
| executive | critical incident on a mission-critical (C1) business service |
