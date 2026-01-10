// keel-web/src/admin/pages/AdminCadetDetailPage.tsx
//
// Keel — Cadet Detail (Identity + Training + Assignment History)
// --------------------------------------------------------------
// PURPOSE:
// - Cadet drill-down that ALWAYS works for identity registry cadets
// - Identity source: /api/v1/admin/cadets
// - Training/TRB snapshot: /api/v1/admin/trainees (OPTIONAL)
// - Assignment History: /api/v1/admin/vessel-assignments (READ-ONLY)
//
// AUDIT SAFETY:
// - No mutations
// - No silent writes
// - Assignment history is immutable evidence
//

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  BookCheck,
  ShieldCheck,
  IdCard,
  Anchor,
} from "lucide-react";

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

/**
 * Assignment history row (Phase 4B)
 * Source: /api/v1/admin/vessel-assignments
 */
interface ApiAssignmentRow {
  assignment_id: number;
  cadet_id: number;
  cadet_name: string;
  vessel_id: number;
  vessel_name: string;
  start_date: string;
  end_date: string | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  created_at: string;
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

function StatusPill({ value }: { value: string }) {
  const color =
    value === "ACTIVE"
      ? "bg-green-500/10 text-green-600"
      : value === "COMPLETED"
      ? "bg-blue-500/10 text-blue-600"
      : "bg-red-500/10 text-red-600";

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      {value}
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
  const [assignments, setAssignments] = useState<ApiAssignmentRow[]>([]);

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

        /* ------------------ IDENTITY (MUST EXIST) ------------------ */
        const identityRes = await fetch("/api/v1/admin/cadets", {
          credentials: "include",
        });

        if (!identityRes.ok) {
          throw new Error("Unable to load cadet registry");
        }

        const identityJson = await identityRes.json();
        const identityList: ApiCadetIdentityRow[] = Array.isArray(identityJson?.data)
          ? identityJson.data
          : [];

        const foundIdentity = identityList.find(
          (c) => String(c.cadet_id) === String(cadetIdNum)
        );

        if (!foundIdentity) {
          throw new Error("Cadet not found in identity registry");
        }

        /* ------------------ TRAINING (OPTIONAL) ------------------ */
        let foundTraining: ApiCadetTrainingRow | null = null;

        try {
          const trainingRes = await fetch("/api/v1/admin/trainees", {
            credentials: "include",
          });

          if (trainingRes.ok) {
            const trainingJson = await trainingRes.json();
            const trainingList: ApiCadetTrainingRow[] = Array.isArray(
              trainingJson?.data
            )
              ? trainingJson.data
              : [];

            foundTraining =
              trainingList.find(
                (t) => String(t.cadet_id) === String(cadetIdNum)
              ) ?? null;
          }
        } catch {
          foundTraining = null;
        }

        /* ------------------ ASSIGNMENT HISTORY (READ-ONLY) ------------------ */
        let assignmentRows: ApiAssignmentRow[] = [];

        try {
          const assignRes = await fetch(
            `/api/v1/admin/vessel-assignments?cadet_id=${cadetIdNum}`,
            { credentials: "include" }
          );

          if (assignRes.ok) {
            const assignJson = await assignRes.json();
            assignmentRows = Array.isArray(assignJson?.data)
              ? assignJson.data
              : [];
          }
        } catch {
          assignmentRows = [];
        }

        if (!cancelled) {
          setIdentity(foundIdentity);
          setTraining(foundTraining);
          setAssignments(assignmentRows);
        }
      } catch (err: any) {
        console.error("❌ Failed to load cadet detail:", err);
        toast.error(err?.message || "Unable to load cadet");
        if (!cancelled) {
          setIdentity(null);
          setTraining(null);
          setAssignments([]);
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
        className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border hover:bg-[hsl(var(--muted))]"
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
          onClick={() =>
            navigate(`/admin/cadets/${identity.cadet_id}/profile`)
          }
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))] text-sm"
        >
          <IdCard size={16} />
          Open Identity Profile
        </button>
      </div>

      {/* ============================ IDENTITY SNAPSHOT ============================ */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4 space-y-2">
        <InfoRow label="Cadet ID" value={identity.cadet_id} />
        <InfoRow label="Role" value={identity.role_name} />
        <InfoRow
          label="Created"
          value={new Date(identity.created_at).toLocaleString()}
        />
        <InfoRow
          label="Last Updated"
          value={new Date(identity.updated_at).toLocaleString()}
        />
      </div>

      {/* ============================ TRAINING SNAPSHOT ============================ */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4 space-y-3">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <BookCheck size={16} />
          Training / TRB Snapshot
        </h2>

        {!training ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            No assignment or training activity recorded yet for this cadet.
          </p>
        ) : (
          <>
            <InfoRow label="Assigned Vessel" value={training.vessel_name} />
            <InfoRow label="Ship Type" value={training.ship_type_name} />
            <InfoRow
              label="Assignment Period"
              value={
                training.assignment_start_date
                  ? `${training.assignment_start_date} → ${
                      training.assignment_end_date || "Present"
                    }`
                  : null
              }
            />
          </>
        )}
      </div>

      {/* ============================ ASSIGNMENT HISTORY ============================ */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4 space-y-3">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Anchor size={16} />
          Assignment History
        </h2>

        {assignments.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            No vessel assignment history recorded for this cadet yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--muted))]">
              <tr>
                <th className="px-3 py-2 text-left">Vessel</th>
                <th className="px-3 py-2 text-left">Period</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr
                  key={a.assignment_id}
                  className="border-t hover:bg-[hsl(var(--muted))] cursor-pointer"
                  onClick={() => navigate(`/admin/vessels/${a.vessel_id}`)}
                  title="Open vessel details"
                >
                  <td className="px-3 py-2 font-medium">
                    {a.vessel_name}
                  </td>

                  <td className="px-3 py-2">
                    {new Date(a.start_date).toLocaleDateString()} →{" "}
                    {a.end_date
                      ? new Date(a.end_date).toLocaleDateString()
                      : "Present"}
                  </td>

                  <td className="px-3 py-2 text-center">
                    <StatusPill value={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>


      {/* ============================ AUDIT ============================ */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4">
        <h2 className="text-sm font-medium flex items-center gap-2 mb-2">
          <ShieldCheck size={16} />
          Audit Posture
        </h2>

        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Assignment history is immutable and serves as audit evidence for
          sea-time verification.
        </p>
      </div>
    </div>
  );
}
