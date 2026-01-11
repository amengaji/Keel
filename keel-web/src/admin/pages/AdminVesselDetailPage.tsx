// keel-web/src/admin/pages/AdminVesselDetailPage.tsx
//
// Keel — Vessel Detail Page (Phase 4B-UI)
// --------------------------------------------------------------
// PURPOSE:
// - Authoritative, read-only vessel profile
// - Audit-safe list-derived data (NO direct GET by ID)
// - Assignment Timeline added (Phase 4B)
//
// DATA SOURCES:
// - Vessel register: /api/v1/admin/vessels
// - Assignment history: /api/v1/admin/vessel-assignments
//
// SAFETY:
// - Read-only
// - No mutations
// - No silent writes
//

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Ship,
  ArrowLeft,
  Anchor,
  ClipboardList,
  ShieldCheck,
  AlertTriangle,
  Users,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type VesselUiRow = {
  id: string;
  imo: string;
  name: string;
  type: string;
  flag: string;
  classSociety: string;
  status: "Active" | "Laid-up" | "Unknown" | "Archived";
  isActive: boolean;
  cadetsOnboard: number;
  activeTRBs: number;
};

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
  value: string | number;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function formatIsoDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  // Audit-safe, locale-independent
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function safeTime(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  const t = new Date(dateStr).getTime();
  return Number.isFinite(t) ? t : 0;
}

function StatusPill({ value }: { value: ApiAssignmentRow["status"] }) {
  const color =
    value === "ACTIVE"
      ? "bg-green-500/10 text-green-600"
      : value === "COMPLETED"
      ? "bg-blue-500/10 text-blue-600"
      : "bg-slate-500/10 text-slate-600";

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      {value}
    </span>
  );
}

function getRowTone(status: ApiAssignmentRow["status"]) {
  // ACTIVE should stand out; CANCELLED should look muted.
  if (status === "ACTIVE") {
    return "bg-green-500/5 hover:bg-green-500/10";
  }
  if (status === "CANCELLED") {
    return "opacity-70 hover:bg-[hsl(var(--muted))]";
  }
  return "hover:bg-[hsl(var(--muted))]";
}


/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export function AdminVesselDetailPage() {
  const navigate = useNavigate();
  const { vesselId } = useParams<{ vesselId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vessel, setVessel] = useState<VesselUiRow | null>(null);
  const [assignments, setAssignments] = useState<ApiAssignmentRow[]>([]);

  /* ---------------- Close Assignment (Phase 4E) ---------------- */

  // Holds assignment selected for closing
  const [pendingClose, setPendingClose] =
    useState<ApiAssignmentRow | null>(null);

  // Selected end date for closing assignment (YYYY-MM-DD)
  const [closeEndDate, setCloseEndDate] = useState<string>("");

  // Prevent double-submit
  const [closing, setClosing] = useState(false);

  /* ------------------------------ Load Data ------------------------------ */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        if (!vesselId) {
          throw new Error("Invalid vessel identifier");
        }

        /* ------------------ LOAD VESSEL REGISTER ------------------ */
        const vesselRes = await fetch("/api/v1/admin/vessels", {
          credentials: "include",
        });

        if (!vesselRes.ok) {
          throw new Error("Unable to load vessel register");
        }

        const vesselJson = await vesselRes.json();
        const rows = Array.isArray(vesselJson?.data) ? vesselJson.data : [];

        const match = rows.find(
          (r: any) => String(r.vessel_id ?? r.id) === String(vesselId)
        );

        if (!match) {
          throw new Error("Vessel not found or archived");
        }

        const normalized: VesselUiRow = {
          id: String(match.vessel_id ?? match.id),
          imo: match.imo_number ?? match.imo ?? "—",
          name: match.vessel_name ?? match.name ?? "Unnamed Vessel",
          type: match.ship_type_name ?? "—",
          flag: match.flag ?? "—",
          classSociety:
            match.classification_society ?? match.class_society ?? "—",
          status:
            match.vessel_status === "Archived"
              ? "Archived"
              : match.vessel_status === "Active"
              ? "Active"
              : match.vessel_status === "Laid-up"
              ? "Laid-up"
              : "Unknown",
          isActive: match.is_active !== false,
          cadetsOnboard: match.cadets_onboard ?? 0,
          activeTRBs: match.active_trbs ?? 0,
        };

        /* ------------------ LOAD ASSIGNMENT HISTORY ------------------ */
        let assignmentRows: ApiAssignmentRow[] = [];

        try {
          const assignRes = await fetch(
            `/api/v1/admin/vessel-assignments?vessel_id=${vesselId}`,
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
          setVessel(normalized);
          setAssignments(assignmentRows);
        }
      } catch (err: any) {
        console.error("❌ Vessel detail load failed:", err);
        toast.error(err?.message || "Unable to load vessel");
        if (!cancelled) {
          setError(err?.message || "Unable to load vessel");
          setVessel(null);
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
  }, [vesselId]);

  /* ------------------------------ Derived ------------------------------ */
    const sortedAssignments = useMemo(() => {
    // Deterministic ordering:
    // 1) ACTIVE first (so current assignment is always top)
    // 2) Newest start_date first
    // 3) Newest created_at first (tie breaker)
    const statusRank = (s: ApiAssignmentRow["status"]) =>
      s === "ACTIVE" ? 0 : s === "COMPLETED" ? 1 : 2;

    return [...assignments].sort((a, b) => {
      const sr = statusRank(a.status) - statusRank(b.status);
      if (sr !== 0) return sr;

      const sd = safeTime(b.start_date) - safeTime(a.start_date);
      if (sd !== 0) return sd;

      return safeTime(b.created_at) - safeTime(a.created_at);
    });
  }, [assignments]);

  const isArchived = useMemo(() => {
    if (!vessel) return false;
    return vessel.isActive === false || vessel.status === "Archived";
  }, [vessel]);

  /* ------------------------------ States ------------------------------ */
  if (loading) {
    return (
      <div className="text-sm text-[hsl(var(--muted-foreground))]">
        Loading vessel…
      </div>
    );
  }

  if (error || !vessel) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/admin/vessels")}
          className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border hover:bg-[hsl(var(--muted))]"
        >
          <ArrowLeft size={16} />
          Back to Vessels
        </button>

        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600">
          {error || "Vessel not found"}
        </div>
      </div>
    );
  }

  /* ------------------------------ Render ------------------------------ */
  return (
    <div className="space-y-6">
      {/* BACK */}
      <button
        onClick={() => navigate("/admin/vessels")}
        className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border hover:bg-[hsl(var(--muted))]"
      >
        <ArrowLeft size={16} />
        Back to Vessels
      </button>

      {/* ARCHIVED */}
      {isArchived && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 flex gap-3 text-sm">
          <AlertTriangle size={18} />
          <div>
            <div className="font-medium">Archived Vessel</div>
            <div className="text-xs mt-1">
              This vessel is archived and shown for audit traceability only.
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Ship size={20} />
            {vessel.name}
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {vessel.imo} · {vessel.type}
          </p>
        </div>

        <button
          onClick={() =>
            toast.message("Vessel editing will be available in a later phase")
          }
          className="h-9 w-9 flex items-center justify-center rounded-md border hover:bg-[hsl(var(--muted))]"
        >
          <Anchor size={18} />
        </button>
      </div>

      {/* IDENTITY */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4 space-y-2">
        <InfoRow label="IMO Number" value={vessel.imo} />
        <InfoRow label="Flag State" value={vessel.flag} />
        <InfoRow label="Class Society" value={vessel.classSociety} />
        <InfoRow label="Operational Status" value={vessel.status} />
      </div>

      {/* TRAINING SNAPSHOT */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4">
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
          <ClipboardList size={16} />
          Training Snapshot
        </h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label="Cadets Onboard" value={vessel.cadetsOnboard} />
          <InfoRow label="Active TRBs" value={vessel.activeTRBs} />
        </div>
      </div>

      {/* ASSIGNMENT TIMELINE */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4 space-y-3">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Users size={16} />
          Cadet Assignment Timeline
        </h2>

        {sortedAssignments.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            No cadet assignment history recorded for this vessel.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--muted))]">
              <tr>
                <th className="px-3 py-2 text-left">Cadet</th>
                <th className="px-3 py-2 text-left">Period</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedAssignments.map((a) => {
                const canClose =
                  a.status === "ACTIVE" && isArchived === false;

                return (
                  <tr
                    key={a.assignment_id}
                    className={[
                      "border-t",
                      canClose ? "cursor-pointer" : "",
                      getRowTone(a.status),
                    ].join(" ")}
                    onClick={() => {
                      // Only allow navigation when clicking the row itself
                      // Action button will explicitly stop propagation
                      navigate(`/admin/cadets/${a.cadet_id}`);
                    }}
                  >
                    {/* Cadet */}
                    <td className="px-3 py-2 font-medium">
                      {a.cadet_name}
                    </td>

                    {/* Period */}
                    <td className="px-3 py-2">
                      {formatIsoDate(a.start_date)} →{" "}
                      {a.end_date ? formatIsoDate(a.end_date) : "Present"}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2 text-center">
                      <StatusPill value={a.status} />
                    </td>

                    {/* Action */}
                    <td className="px-3 py-2 text-right">
                      {canClose ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            // Prevent row navigation
                            e.stopPropagation();

                            // Default end date = today (explicit but editable)
                            const today = new Date().toISOString().slice(0, 10);

                            setCloseEndDate(today);
                            setPendingClose(a);
                          }}
                          className="
                            inline-flex items-center
                            rounded-md border
                            px-3 py-1.5 text-xs
                            font-medium
                            text-[hsl(var(--foreground))]
                            hover:bg-[hsl(var(--muted))]
                          "
                        >
                          Close Assignment
                        </button>
                      ) : (
                        // Maintain table alignment for non-active rows
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

          </table>
        )}

      </div>

      {/* AUDIT */}
      <div className="rounded-lg border bg-[hsl(var(--card))] p-4">
        <h2 className="text-sm font-medium flex items-center gap-2 mb-2">
          <ShieldCheck size={16} />
          Audit Posture
        </h2>

        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Assignment timeline is immutable audit evidence used for vessel
          staffing and sea-time verification.
        </p>
      </div>
      {/* ------------------------------------------------------------------ */}
      {/* CLOSE ASSIGNMENT CONFIRMATION (Phase 4E)                            */}
      {/* ------------------------------------------------------------------ */}

      {pendingClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-lg border bg-[hsl(var(--card))] p-6 space-y-4">
            <h3 className="text-sm font-semibold">
              Close Cadet Assignment
            </h3>

            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              This will close the cadet’s assignment to this vessel and
              lock further TRB activity.
              <br />
              <strong>This action cannot be undone.</strong>
            </p>

            <div className="rounded-md border bg-[hsl(var(--muted))] p-3 text-sm space-y-2">
              <div>
                <span className="font-medium">Cadet:</span>{" "}
                {pendingClose.cadet_name}
              </div>

              <div>
                <span className="font-medium">Start Date:</span>{" "}
                {formatIsoDate(pendingClose.start_date)}
              </div>

              {/* End Date Selection — REQUIRED */}
              <div className="pt-2">
                <label className="block text-xs font-medium mb-1">
                  Assignment End Date
                </label>

                <input
                  type="date"
                  required
                  value={closeEndDate}
                  min={formatIsoDate(pendingClose.start_date)}
                  onChange={(e) => setCloseEndDate(e.target.value)}
                  className="
                    w-full rounded-md border px-2 py-1.5 text-sm
                    bg-[hsl(var(--background))]
                  "
                />

                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  End date cannot be earlier than the start date.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              {/* Cancel */}
              <button
                type="button"
                disabled={closing}
                onClick={() => setPendingClose(null)}
                className="px-4 py-2 text-sm rounded-md border hover:bg-[hsl(var(--muted))]"
              >
                Cancel
              </button>

              {/* Confirm */}
              <button
                type="button"
                disabled={closing  || !closeEndDate}
                onClick={async () => {
                  if (!pendingClose) return;

                  try {
                    setClosing(true);

                    if (!closeEndDate) {
                      toast.error("End date is required to close assignment");
                      return;
                    }

                    const res = await fetch(
                      `/api/v1/admin/vessel-assignments/${pendingClose.assignment_id}/close`,
                      {
                        method: "POST",
                        credentials: "include",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          end_date: closeEndDate,
                        }),
                      }
                    );


                    if (!res.ok) {
                      const err = await res.json().catch(() => null);
                      throw new Error(
                        err?.message || "Failed to close assignment"
                      );
                    }

                    toast.success("Assignment closed successfully");

                    // Explicit refresh (single, safe reload)
                    const assignRes = await fetch(
                      `/api/v1/admin/vessel-assignments?vessel_id=${vesselId}`,
                      { credentials: "include" }
                    );

                    if (assignRes.ok) {
                      const json = await assignRes.json();
                      setAssignments(
                        Array.isArray(json?.data) ? json.data : []
                      );
                    }

                    setPendingClose(null);
                  } catch (err: any) {
                    console.error("❌ Close assignment failed:", err);
                    toast.error(
                      err?.message || "Unable to close assignment"
                    );
                  } finally {
                    setClosing(false);
                  }
                }}
                className="
                  px-4 py-2 text-sm rounded-md
                  bg-red-600 text-white
                  hover:bg-red-700
                  disabled:opacity-60
                "
              >
                Confirm Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
