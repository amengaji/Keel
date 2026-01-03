// keel-web/src/admin/pages/AdminImportsPage.tsx
//
// Keel — Imports (Controlled Intake Gateway)
// ----------------------------------------------------
// PURPOSE:
// - Single entry point for all bulk data imports
// - Explicit scope definition (what can be imported)
// - Preview-first, audit-safe UX
//
// IMPORTANT:
// - No silent imports
// - No background mutations
// - Every import is intentional, visible, and reversible
//
// PHASE 2.5 STATUS:
// - UI only
// - No backend calls
// - No actual file processing

import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

/* -------------------------------------------------------------------------- */
/* Import Registry — WHAT IS ALLOWED                                           */
/* -------------------------------------------------------------------------- */
const importTypes = [
  {
    id: "vessels",
    title: "Vessels",
    description:
      "Bulk import of vessel master data (IMO, name, type, flag, class).",
    restrictions: "System validates IMO and vessel type mapping.",
  },
  {
    id: "cadets",
    title: "Cadets / Trainees",
    description:
      "Bulk onboarding of cadets and ratings with stream classification.",
    restrictions: "No personal identity documents allowed.",
  },
  {
    id: "assignments",
    title: "Cadet–Vessel Assignments",
    description:
      "Assignment history linking cadets to vessels with joining periods.",
    restrictions: "Overlapping assignments are rejected.",
  },
];

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */
export function AdminImportsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* ============================ HEADER ============================ */}
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Upload size={20} />
          Imports
        </h1>

        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Controlled bulk data intake with validation and audit visibility.
        </p>
      </div>

      {/* ============================ WARNING BANNER ============================ */}
      <div
        className="
          flex items-start gap-3
          rounded-lg
          border border-yellow-500/30
          bg-yellow-500/10
          px-4 py-3
          text-sm
        "
      >
        <AlertTriangle size={18} className="text-yellow-600 mt-0.5" />
        <div>
          <div className="font-medium text-yellow-700">
            Imports are regulated actions
          </div>
          <div className="text-yellow-700/90">
            All imports are logged, previewed, and subject to validation rules.
            Direct database uploads are not permitted.
          </div>
        </div>
      </div>

      {/* ============================ IMPORT OPTIONS ============================ */}
      <div className="space-y-4">
        {importTypes.map((imp) => (
          <div
            key={imp.id}
            className="
              rounded-lg
              border border-[hsl(var(--border))] 
              bg-[hsl(var(--card))]
              p-4
              flex items-start justify-between gap-4
            "
          >
            {/* Left — Description */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium">
                <FileSpreadsheet size={16} />
                {imp.title}
              </div>

              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {imp.description}
              </p>

              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                <strong>Restrictions:</strong> {imp.restrictions}
              </p>
            </div>

            {/* Right — Action */}
            <button
              onClick={() =>
                toast.message(
                  "Import preview and templates will be enabled in Phase 3"
                )
              }
              className="
                px-4 py-2
                rounded-md
                border border-[hsl(var(--border))]
                hover:bg-[hsl(var(--muted))]
                text-sm
                flex items-center gap-2
              "
            >
              <ShieldCheck size={14} />
              Preview Import
            </button>
          </div>
        ))}
      </div>

      {/* ============================ FOOTNOTE ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Keel enforces preview-first imports. No data enters the system without
        human confirmation, validation, and traceability.
      </p>
    </div>
  );
}
