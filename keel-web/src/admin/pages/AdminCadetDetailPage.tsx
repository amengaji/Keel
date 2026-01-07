// keel-web/src/admin/pages/AdminCadetDetailPage.tsx
//
// Keel — Cadet Detail (Read-Only)
// ----------------------------------------------------
// PURPOSE:
// - Read-only cadet drill-down
// - Source: /api/v1/admin/trainees (admin_trb_cadets_v)
// - Audit safe, no mutations
//

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  BookCheck,
  ShieldCheck,
  Ship,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ApiCadetRow {
  assignment_id: number;
  cadet_id: number;
  cadet_email: string;
  vessel_id: number | null;
  vessel_name: string | null;
  ship_type_name: string | null;
  assignment_start_date: string | null;
  assignment_end_date: string | null;
  total_tasks: number | null;
  tasks_master_approved: number | null;
  completion_percentage: number | null;
  last_activity_at: string | null;
  overall_status: string | null;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}

function StatusPill({ value }: { value: string | null }) {
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600">
      {value || "Unknown"}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export function AdminCadetDetailPage() {
  const navigate = useNavigate();
  const { cadetId } = useParams();

  const [row, setRow] = useState<ApiCadetRow | null>(null);
  const [loading, setLoading] = useState(true);

  /* ------------------------------ Load Data ------------------------------ */

  useEffect(() => {
    let cancelled = false;

    async function loadCadet() {
      try {
        setLoading(true);

        const res = await fetch("/api/v1/admin/trainees", {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Failed to load cadets (${res.status})`);
        }

        const json = await res.json();
        const list: ApiCadetRow[] = Array.isArray(json?.data)
          ? json.data
          : [];

        const found = list.find(
          (c) => String(c.cadet_id) === String(cadetId)
        );

        if (!found) {
          throw new Error("Cadet not found");
        }

        if (!cancelled) {
          setRow(found);
        }
      } catch (err: any) {
        console.error("❌ Failed to load cadet:", err);
        toast.error(err?.message || "Unable to load cadet");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCadet();
    return () => {
      cancelled = true;
    };
  }, [cadetId]);

  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="text-sm text-[hsl(var(--muted-foreground))]">
        Loading cadet…
      </div>
    );
  }

  if (!row) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* ============================ BACK ============================ */}
      <button
        onClick={() => navigate("/admin/cadets")}
        className="
          inline-flex items-center gap-2
          text-sm
          px-3 py-1.5
          rounded-md
          border border-[hsl(var(--border))]
          hover:bg-[hsl(var(--muted))]
        "
      >
        <ArrowLeft size={16} />
        Back to Cadets
      </button>

      {/* ============================ HEADER ============================ */}
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <User size={20} />
          {row.cadet_email}
        </h1>

        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Cadet · Training Record Overview
        </p>
      </div>

      {/* ============================ ASSIGNMENT ============================ */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4 space-y-2">
        <InfoRow label="Cadet Email" value={row.cadet_email} />
        <InfoRow
          label="Assigned Vessel"
          value={row.vessel_name}
        />
        <InfoRow
          label="Ship Type"
          value={row.ship_type_name}
        />
        <InfoRow
          label="Assignment Period"
          value={
            row.assignment_start_date
              ? `${row.assignment_start_date} → ${
                  row.assignment_end_date || "Present"
                }`
              : null
          }
        />
      </div>

      {/* ============================ TRB SNAPSHOT ============================ */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4 space-y-3">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <BookCheck size={16} />
          Training Progress
        </h2>

        <InfoRow
          label="Completion"
          value={
            row.completion_percentage !== null
              ? `${row.completion_percentage}%`
              : null
          }
        />
        <InfoRow
          label="Tasks Approved"
          value={row.tasks_master_approved}
        />
        <InfoRow
          label="Total Tasks"
          value={row.total_tasks}
        />
        <div className="flex justify-between items-center">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            Overall Status
          </span>
          <StatusPill value={row.overall_status} />
        </div>
      </div>

      {/* ============================ AUDIT ============================ */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4">
        <h2 className="text-sm font-medium flex items-center gap-2 mb-2">
          <ShieldCheck size={16} />
          Audit Posture
        </h2>

        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          This profile is read-only. Detailed inspection and
          verification is performed through Audit Mode.
        </p>
      </div>
    </div>
  );
}
