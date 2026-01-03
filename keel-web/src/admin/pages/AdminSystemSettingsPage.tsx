// keel-web/src/admin/pages/AdminSystemSettingsPage.tsx
//
// Keel — System Settings (Governance Layer)
// ----------------------------------------------------
// PURPOSE:
// - Define system-wide rules and policies
// - Control audit, finalization, and authority behaviour
// - Make implicit rules explicit
//
// IMPORTANT:
// - Phase 2.5: UI only
// - No backend calls
// - No mutations
// - All settings are declarative, not functional yet

import {
  Settings,
  ShieldCheck,
  Lock,
  PenTool,
  Upload,
  Monitor,
} from "lucide-react";

function Section({
  title,
  icon,
  description,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        {icon}
        <div>
          <h2 className="font-medium">{title}</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {description}
          </p>
        </div>
      </div>

      <div
        className="
          rounded-lg
          border border-[hsl(var(--border))]
          bg-[hsl(var(--card))]
          p-4
          space-y-3
        "
      >
        {children}
      </div>
    </div>
  );
}

function ToggleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span>{label}</span>
      <span className="text-[hsl(var(--muted-foreground))]">{value}</span>
    </div>
  );
}

export function AdminSystemSettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* ============================ HEADER ============================ */}
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Settings size={20} />
          System Settings
        </h1>

        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Governing rules that define how Keel behaves under audit and control.
        </p>
      </div>

      {/* ============================ AUDIT MODE ============================ */}
      <Section
        title="Audit Mode Policy"
        icon={<ShieldCheck size={18} />}
        description="Controls how read-only audit sessions operate."
      >
        <ToggleRow label="Audit Mode is strictly read-only" value="Enabled" />
        <ToggleRow label="Audit banner always visible" value="Enabled" />
        <ToggleRow label="Audit sessions are time-bound" value="Disabled" />
      </Section>

      {/* ============================ TRB FINALIZATION ============================ */}
      <Section
        title="TRB Finalization Rules"
        icon={<Lock size={18} />}
        description="Defines who can lock Training Record Books and when."
      >
        <ToggleRow label="Finalization allowed by Master" value="Enabled" />
        <ToggleRow label="Finalization allowed by CTO" value="Enabled" />
        <ToggleRow
          label="Reopening finalized TRB"
          value="Not Permitted"
        />
      </Section>

      {/* ============================ SIGNATURE AUTHORITY ============================ */}
      <Section
        title="Signature Authority"
        icon={<PenTool size={18} />}
        description="Controls who may sign and approve records."
      >
        <ToggleRow label="Signature Vault required" value="Enabled" />
        <ToggleRow label="Unlock time limit" value="15 minutes" />
        <ToggleRow label="Dual-signature required" value="Disabled" />
      </Section>

      {/* ============================ IMPORT CONTROLS ============================ */}
      <Section
        title="Import Controls"
        icon={<Upload size={18} />}
        description="Rules governing bulk data intake."
      >
        <ToggleRow label="Import preview required" value="Enabled" />
        <ToggleRow label="Direct overwrite allowed" value="Disabled" />
        <ToggleRow label="Import actions logged" value="Enabled" />
      </Section>

      {/* ============================ SYSTEM BEHAVIOUR ============================ */}
      <Section
        title="System Behaviour"
        icon={<Monitor size={18} />}
        description="Global behavioural flags."
      >
        <ToggleRow label="Default theme" value="System" />
        <ToggleRow label="Locked TRBs dimmed" value="Enabled" />
        <ToggleRow label="Audit warnings enforced" value="Enabled" />
      </Section>
    </div>
  );
}
