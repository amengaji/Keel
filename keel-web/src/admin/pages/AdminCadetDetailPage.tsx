// keel-web/src/admin/pages/AdminCadetDetailPage.tsx
//
// Keel — Cadet Detail (Identity + Optional Training Overview)
// ----------------------------------------------------
// PURPOSE:
// - Cadet drill-down that ALWAYS works for identity registry cadets
// - Identity source: /api/v1/admin/cadets (users-based registry)
// - Training/TRB snapshot: /api/v1/admin/trainees (admin_trb_cadets_v) OPTIONAL
//
// WHY THIS MATTERS:
// - A new cadet may NOT exist in admin_trb_cadets_v until assignment/training starts.
// - So we must NOT fail the page if the trainee view has no row.
//
// SAFETY:
// - Read-only view page (no mutations here)
// - Profile edits happen on /admin/cadets/:cadetId/profile (Phase 3A)

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, User, BookCheck, ShieldCheck, IdCard } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ApiCadetIdentityRow {
  cadet_id: number;
  cadet_email: string;
  cadet_name: string;
  created_at: string;
  updated_at: string;
  role_name: string;
}

interface ApiCadetTrainingRow {
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

  const cadetIdNum = useMemo(() => Number(cadetId), [cadetId]);

  const [identity, setIdentity] = useState<ApiCadetIdentityRow | null>(null);
  const [training, setTraining] = useState<ApiCadetTrainingRow | null>(null);

  const [loading, setLoading] = useState(true);

  /* ------------------------------ Load Data ------------------------------ */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        if (!cadetIdNum || Number.isNaN(cadetIdNum)) {
          throw new Error("Invalid cadet ID");
        }

        // STEP 1: Load identity registry (MUST exist)
        const identityRes = await fetch("/api/v1/admin/cadets", {
          credentials: "include",
        });

        if (!identityRes.ok) {
          throw new Error(`Failed to load cadets (${identityRes.status})`);
        }

        const identityJson = await identityRes.json().catch(() => null);
        const identityList: ApiCadetIdentityRow[] = Array.isArray(identityJson?.data)
          ? identityJson.data
          : [];

        const foundIdentity = identityList.find(
          (c) => String(c.cadet_id) === String(cadetIdNum)
        );

        if (!foundIdentity) {
          // This means user record is missing (actual error)
          throw new Error("Cadet not found in identity registry");
        }

        // STEP 2: Load training/TRB overview (OPTIONAL)
        // If cadet has no assignment/training yet, they may not exist in this view.
        let foundTraining: ApiCadetTrainingRow | null = null;

        try {
          const trainingRes = await fetch("/api/v1/admin/trainees", {
            credentials: "include",
          });

          if (trainingRes.ok) {
            const trainingJson = await trainingRes.json().catch(() => null);
            const trainingList: ApiCadetTrainingRow[] = Array.isArray(trainingJson?.data)
              ? trainingJson.data
              : [];

            foundTraining =
              trainingList.find((t) => String(t.cadet_id) === String(cadetIdNum)) ?? null;
          }
        } catch {
          // silently ignore (we still show identity view)
          foundTraining = null;
        }

        if (!cancelled) {
          setIdentity(foundIdentity);
          setTraining(foundTraining);
        }
      } catch (err: any) {
        console.error("❌ Failed to load cadet detail:", err);
        toast.error(err?.message || "Unable to load cadet");
        if (!cancelled) {
          setIdentity(null);
          setTraining(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [cadetIdNum]);

  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="text-sm text-[hsl(var(--muted-foreground))]">
        Loading cadet…
      </div>
    );
  }

  if (!identity) {
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <User size={20} />
            {identity.cadet_name}
          </h1>

          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {identity.cadet_email}
          </p>
        </div>

        <button
          onClick={() => navigate(`/admin/cadets/${identity.cadet_id}/profile`)}
          className="
            inline-flex items-center gap-2
            px-4 py-2
            rounded-md
            border border-[hsl(var(--border))]
            bg-[hsl(var(--card))]
            hover:bg-[hsl(var(--muted))]
            text-sm
            whitespace-nowrap
          "
          title="Open Identity Profile (Phase 3A)"
        >
          <IdCard size={16} />
          Open Identity Profile
        </button>
      </div>

      {/* ============================ IDENTITY SNAPSHOT ============================ */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4 space-y-2">
        <InfoRow label="Cadet ID" value={identity.cadet_id} />
        <InfoRow label="Role" value={identity.role_name} />
        <InfoRow label="Created" value={new Date(identity.created_at).toLocaleString()} />
        <InfoRow label="Last Updated" value={new Date(identity.updated_at).toLocaleString()} />
      </div>

      {/* ============================ TRAINING / TRB SNAPSHOT ============================ */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4 space-y-3">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <BookCheck size={16} />
          Training / TRB Snapshot
        </h2>

        {!training ? (
          <div className="text-sm text-[hsl(var(--muted-foreground))]">
            No assignment / training record found yet for this cadet. This is normal for newly created cadets.
          </div>
        ) : (
          <>
            <InfoRow label="Assigned Vessel" value={training.vessel_name} />
            <InfoRow label="Ship Type" value={training.ship_type_name} />
            <InfoRow
              label="Assignment Period"
              value={
                training.assignment_start_date
                  ? `${training.assignment_start_date} → ${training.assignment_end_date || "Present"}`
                  : null
              }
            />
            <InfoRow
              label="Completion"
              value={
                training.completion_percentage !== null
                  ? `${training.completion_percentage}%`
                  : null
              }
            />
            <InfoRow label="Tasks Approved" value={training.tasks_master_approved} />
            <InfoRow label="Total Tasks" value={training.total_tasks} />

            <div className="flex justify-between items-center">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                Overall Status
              </span>
              <StatusPill value={training.overall_status} />
            </div>
          </>
        )}
      </div>

      {/* ============================ AUDIT ============================ */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4">
        <h2 className="text-sm font-medium flex items-center gap-2 mb-2">
          <ShieldCheck size={16} />
          Audit Posture
        </h2>

        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Identity and documents are managed in “Cadet Identity Profile” (Phase 3A).
          Training progress is read-only here and comes from the audit-safe TRB view.
        </p>
      </div>
    </div>
  );
}
