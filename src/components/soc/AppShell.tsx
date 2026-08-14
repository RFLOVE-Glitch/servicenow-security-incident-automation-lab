import { Link } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  BookOpen,
  ClipboardList,
  FileSearch,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Network,
  Radar,
  Workflow,
} from "lucide-react";
import type { ReactNode } from "react";

import { SyntheticDataNotice } from "./primitives";

const nav = [
  { to: "/", label: "Executive Overview", icon: LayoutDashboard },
  { to: "/incidents", label: "Incident Queue", icon: ListChecks },
  { to: "/playbooks", label: "Automation Playbooks", icon: Workflow },
  { to: "/detection", label: "Detection & Intake", icon: Radar },
  { to: "/sla", label: "SLA & Escalation", icon: Gauge },
  { to: "/tasks", label: "Response Tasks", icon: ClipboardList },
  { to: "/evidence", label: "Evidence & Audit", icon: FileSearch },
  { to: "/metrics", label: "Metrics & Reporting", icon: BarChart3 },
  { to: "/architecture", label: "Architecture & Security", icon: Network },
  { to: "/docs", label: "Docs & Tests", icon: BookOpen },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
          <div className="border-b border-sidebar-border px-5 py-5">
            <div className="flex items-center gap-2 text-primary">
              <Activity className="size-5" aria-hidden />
              <span className="text-xs font-semibold tracking-[0.14em] uppercase">SecOps Lab</span>
            </div>
            <p className="mt-2 text-sm leading-snug font-semibold text-sidebar-foreground">
              Security Incident Automation Lab
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              ServiceNow-inspired workflow demo · synthetic data
            </p>
          </div>
          <nav className="flex-1 overflow-y-auto p-3">
            <ul className="space-y-0.5">
              {nav.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    activeOptions={{ exact: to === "/" }}
                    activeProps={{
                      className:
                        "bg-sidebar-accent text-sidebar-accent-foreground border-primary/60",
                    }}
                    inactiveProps={{ className: "text-muted-foreground border-transparent" }}
                    className="flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-sidebar-border px-4 py-3">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Demonstration only. No production incidents, credentials or customer data.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="border-b border-border bg-surface/60 px-5 py-2 lg:hidden">
            <nav className="flex gap-3 overflow-x-auto text-xs">
              {nav.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  activeOptions={{ exact: to === "/" }}
                  activeProps={{ className: "text-primary" }}
                  className="whitespace-nowrap text-muted-foreground"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <main className="ops-grid min-h-screen px-5 py-7 sm:px-8">
            <div className="mx-auto max-w-6xl space-y-6">
              <SyntheticDataNotice />
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
