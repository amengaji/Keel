// src/admin/components/ui/Card.tsx
//
// Keel Shore Admin — Card Primitives
// ----------------------------------------------------
// PURPOSE:
// - Single source of truth for surfaces
// - Audit-grade elevation & contrast
// - Used across Dashboard, Audit, Fleet, HR views
//
// IMPORTANT:
// - NO business logic here
// - NO data fetching
// - Pure UI primitives only

import type { ReactNode } from "react";

/* ==========================================================================
   Base Card — generic surface container
   ========================================================================== */
export function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        rounded-xl
        bg-[hsl(var(--card))]
        text-[hsl(var(--card-foreground))]
        p-6

        /* Elevation — subtle but visible */
        shadow-[0_1px_2px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.35)]
        ring-1 ring-black/5 dark:ring-white/10
      "
    >
      {children}
    </div>
  );
}

/* ==========================================================================
   CardHeader — title + optional subtitle
   ========================================================================== */
export function CardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle && (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ==========================================================================
   CardContent — spacing wrapper
   ========================================================================== */
export function CardContent({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

/* ==========================================================================
   StatCard — KPI / metric cards (Dashboard)
   ========================================================================== */
export function StatCard({
  label,
  value,
  icon,
  tone = "neutral",
  onClick,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
  onClick?: () => void;
}) {
  const toneClass =
    tone === "success"
      ? "text-green-500"
      : tone === "warning"
      ? "text-yellow-400"
      : tone === "danger"
      ? "text-red-500"
      : "";

  return (
    <div
      className={onClick ? "cursor-pointer" : undefined}
      onClick={onClick}
    >
      <Card>
        <div className="flex items-center justify-between">
          <div className="text-sm text-[hsl(var(--muted-foreground))]">
            {label}
          </div>

          {icon && (
            <div className="text-[hsl(var(--muted-foreground))]">
              {icon}
            </div>
          )}
        </div>

        <div className={`text-3xl font-semibold mt-3 ${toneClass}`}>
          {value}
        </div>

        {onClick && (
          <div className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
            View details →
          </div>
        )}
      </Card>
    </div>
  );
}

