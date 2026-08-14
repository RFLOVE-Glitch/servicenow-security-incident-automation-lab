/** Reusable presentation primitives for the security operations dashboard. */

import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, FlaskConical, Sparkles, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Severity, SlaState, SlaStatus } from "@/lib/soc/types";

/* ------------------------------- Pill -------------------------------- */

const pillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-border bg-muted text-muted-foreground",
        outline: "border-border bg-transparent text-foreground",
        primary: "border-primary/40 bg-primary/12 text-primary",
        critical: "border-critical/45 bg-critical/15 text-critical",
        high: "border-high/45 bg-high/15 text-high",
        medium: "border-medium/45 bg-medium/15 text-medium",
        low: "border-low/45 bg-low/15 text-low",
        success: "border-success/45 bg-success/15 text-success",
        warning: "border-warning/45 bg-warning/15 text-warning",
        info: "border-info/45 bg-info/15 text-info",
        ai: "border-ai/45 bg-ai/15 text-ai",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type PillTone = NonNullable<VariantProps<typeof pillVariants>["tone"]>;

export function Pill({
  tone,
  className,
  children,
}: VariantProps<typeof pillVariants> & { className?: string; children: ReactNode }) {
  return <span className={cn(pillVariants({ tone }), className)}>{children}</span>;
}

/* ---------------------------- Severity/SLA --------------------------- */

const severityTone: Record<Severity, PillTone> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Pill tone={severityTone[severity]}>{severity.toUpperCase()}</Pill>;
}

export function PriorityBadge({ priority }: { priority: "P1" | "P2" | "P3" | "P4" }) {
  const tone: PillTone =
    priority === "P1"
      ? "critical"
      : priority === "P2"
        ? "high"
        : priority === "P3"
          ? "medium"
          : "low";
  return <Pill tone={tone}>{priority}</Pill>;
}

const slaTone: Record<SlaState, PillTone> = {
  on_track: "success",
  at_risk: "warning",
  breached: "critical",
};

export const slaLabel: Record<SlaState, string> = {
  on_track: "On track",
  at_risk: "At risk",
  breached: "Breached",
};

export function SlaBar({ sla, label }: { sla: SlaStatus; label?: string }) {
  const width = Math.min(100, Math.max(2, sla.percentConsumed));
  const barTone =
    sla.state === "breached"
      ? "bg-critical"
      : sla.state === "at_risk"
        ? "bg-warning"
        : "bg-success";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground capitalize">{label ?? sla.target}</span>
        <span className="font-mono text-foreground">
          {sla.remainingMinutes >= 0
            ? `${formatMinutes(sla.remainingMinutes)} left`
            : `${formatMinutes(Math.abs(sla.remainingMinutes))} over`}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", barTone)}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {sla.elapsedMinutes}m / {sla.budgetMinutes}m budget
        </span>
        <Pill tone={slaTone[sla.state]}>{slaLabel[sla.state]}</Pill>
      </div>
    </div>
  );
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/* ------------------------------ Layout ------------------------------- */

export function Panel({
  title,
  description,
  actions,
  className,
  children,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("panel p-5", className)}>
      {(title || actions) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div className="max-w-3xl">
        <p className="label-caps">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      {actions}
    </header>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: PillTone;
}) {
  const accent =
    tone === "critical"
      ? "text-critical"
      : tone === "warning"
        ? "text-warning"
        : tone === "success"
          ? "text-success"
          : tone === "primary"
            ? "text-primary"
            : "text-foreground";
  return (
    <div className="panel p-4">
      <p className="label-caps">{label}</p>
      <p className={cn("mt-2 font-mono text-3xl font-semibold tabular-nums", accent)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm text-foreground">{value}</span>
    </div>
  );
}

/* --------------------------- Disclosures ----------------------------- */

export function SyntheticDataNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3",
        className,
      )}
    >
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <p className="text-xs leading-relaxed text-warning">
        <strong className="font-semibold">Synthetic data &amp; simulated integrations.</strong>{" "}
        Every incident, host, identity, indicator and detection source on this page is fabricated
        for portfolio demonstration. There is no live ServiceNow instance, SIEM, EDR or identity
        provider connected, and this project is not affiliated with or endorsed by ServiceNow.
      </p>
    </div>
  );
}

export function AiLabel({ children }: { children?: ReactNode }) {
  return (
    <Pill tone="ai">
      <Sparkles className="size-3" aria-hidden />
      {children ?? "Simulated AI assist — advisory only"}
    </Pill>
  );
}

export function HumanGate({ reason }: { reason: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-critical/35 bg-critical/10 px-3 py-2">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-critical" aria-hidden />
      <p className="text-xs text-critical">{reason}</p>
    </div>
  );
}

export function ControlNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-success/30 bg-success/10 px-3 py-2">
      <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
      <p className="text-xs text-success">{children}</p>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone: PillTone =
    status === "complete"
      ? "success"
      : status === "blocked"
        ? "critical"
        : status === "in_progress"
          ? "info"
          : "neutral";
  return <Pill tone={tone}>{status.replace("_", " ")}</Pill>;
}
