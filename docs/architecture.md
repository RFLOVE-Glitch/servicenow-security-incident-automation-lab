# Architecture

Synthetic data only. No live ServiceNow, SIEM, EDR or identity-provider connection. Not affiliated
with or endorsed by ServiceNow.

## Layers

```text
src/lib/soc/types.ts      domain model (synthetic naming enforced in the type system)
src/lib/soc/logic.ts      pure decision functions (no I/O, no randomness, no clock)
src/lib/soc/fixtures.ts   the synthetic incident set and supporting records
src/lib/soc/derive.ts     enrichment (EnrichedIncident) and program metrics
src/components/soc/*      AppShell + presentation primitives incl. disclosure components
src/routes/*              one route per dashboard section
```

## Flow

```text
Fabricated sources (SIM-SIEM / SIM-EDR / SIM-CloudTrail / SIM-MailGateway /
SIM-IdentityProvider / SIM-VulnScanner / SIM-UserReport)
   -> intake normalization -> dedupe key -> aggregate confidence
   -> computePriority / routeIncident / computeSla
   -> evaluateAutomation (human-approval gating) / evaluateEscalation / canAutoClose
   -> derived views -> React routes
   -> simulated actions produce response tasks, evidence and audit entries (in memory)
```

## Determinism

Incident age is stored as `ageMinutes` rather than read from the system clock, and no function
uses randomness. Consequently the dashboard, the metrics page and the unit tests always agree.

## Rendering

TanStack Start with file-based routing. Every page is server-rendered from the same fixture
module the client uses, so there is no hydration divergence and no data fetching layer.
