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
  ShieldAlert,
  Bell,
  Database,
  AlertOctagon,
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
    <div className="space-y-8 max-w-4xl pb-12">
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

      {/* ============================ 1. SECURITY & SESSION (NEW) ============================ */}
      <Section
        title="Security & Session Policy"
        icon={<ShieldAlert size={18} />}
        description="Enforce access controls and session strictness for administrators."
      >
        <ToggleRow label="Admin Session Timeout" value="30 Minutes" />
        <ToggleRow label="Enforce MFA for Admins" value="Enabled" />
        <ToggleRow label="Bind Session to IP Address" value="Disabled" />
        <ToggleRow label="Max Login Attempts" value="5 attempts" />
      </Section>

      {/* ============================ 2. AUDIT MODE (EXISTING) ============================ */}
      <Section
        title="Audit Mode Policy"
        icon={<ShieldCheck size={18} />}
        description="Controls how read-only audit sessions operate."
      >
        <ToggleRow label="Audit Mode is strictly read-only" value="Enabled" />
        <ToggleRow label="Audit banner always visible" value="Enabled" />
        <ToggleRow label="Audit sessions are time-bound" value="Disabled" />
      </Section>

      {/* ============================ 3. NOTIFICATION ROUTING (NEW) ============================ */}
      <Section
        title="Notification Routing"
        icon={<Bell size={18} />}
        description="Configure automated alerts for critical system events."
      >
        <ToggleRow label="Notify CTO on TRB Lock" value="Enabled" />
        <ToggleRow label="Alert on Failed Imports (Batch)" value="Enabled" />
        <ToggleRow label="Weekly Digest Emails" value="Disabled" />
      </Section>

      {/* ============================ 4. TRB FINALIZATION (EXISTING) ============================ */}
      <Section
        title="TRB Finalization Rules"
        icon={<Lock size={18} />}
        description="Defines who can lock Training Record Books and when."
      >
        <ToggleRow label="Finalization allowed by Master" value="Enabled" />
        <ToggleRow label="Finalization allowed by CTO" value="Enabled" />
        <ToggleRow label="Reopening finalized TRB" value="Not Permitted" />
      </Section>

      {/* ============================ 5. SIGNATURE AUTHORITY (EXISTING) ============================ */}
      <Section
        title="Signature Authority"
        icon={<PenTool size={18} />}
        description="Controls who may sign and approve records."
      >
        <ToggleRow label="Signature Vault required" value="Enabled" />
        <ToggleRow label="Unlock time limit" value="15 minutes" />
        <ToggleRow label="Dual-signature required" value="Disabled" />
      </Section>

      {/* ============================ 6. DATA RETENTION (NEW) ============================ */}
      <Section
        title="Data Retention & Archival"
        icon={<Database size={18} />}
        description="Governance rules for data lifecycle and compliance."
      >
        <ToggleRow label="Audit Log Retention" value="7 Years (Maritime)" />
        <ToggleRow label="Soft-Delete Grace Period" value="30 Days" />
        <ToggleRow label="Auto-archive Inactive Cadets" value="After 6 Months" />
      </Section>

      {/* ============================ 7. IMPORT CONTROLS (EXISTING) ============================ */}
      <Section
        title="Import Controls"
        icon={<Upload size={18} />}
        description="Rules governing bulk data intake."
      >
        <ToggleRow label="Import preview required" value="Enabled" />
        <ToggleRow label="Direct overwrite allowed" value="Disabled" />
        <ToggleRow label="Import actions logged" value="Enabled" />
      </Section>

      {/* ============================ 8. MAINTENANCE (NEW) ============================ */}
      <Section
        title="Maintenance & Operations"
        icon={<AlertOctagon size={18} />}
        description="Operational controls for system availability."
      >
        <ToggleRow label="Maintenance Mode" value="Disabled" />
        <ToggleRow label="Global System Banner" value="None" />
        <ToggleRow label="Block Mobile App Sync" value="Disabled" />
      </Section>

      {/* ============================ 9. SYSTEM BEHAVIOUR (EXISTING) ============================ */}
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