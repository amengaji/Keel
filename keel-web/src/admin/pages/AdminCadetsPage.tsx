// keel-web/src/admin/pages/AdminCadetsPage.tsx
//
// Keel — Admin Cadets (Identity Registry)
// ----------------------------------------------------
// PURPOSE:
// - Cadet identity registry (NO training context)
// - Data source: /api/v1/admin/cadets
// - Create / Edit cadets
// - Import cadets via Excel (preview-first, audit-safe)
//
// IMPORTANT:
// - NO vessel assignment
// - NO TRB / progress
// - Assignment & training live elsewhere
//
// PHASE:
// - Phase 3 — STEP A + Import UI
//

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, Plus, Upload } from "lucide-react";

import { CadetImportModal } from "../components/CadetImportModal";
import {
  AssignCadetToVesselModal,
} from "../components/AssignCadetToVesselModal";
import { DatePickerInput } from "../../components/common/DatePickerInput";


/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ApiCadetRow {
  cadet_id: number;
  cadet_email: string;
  cadet_name: string;
  created_at: string;
  updated_at: string;
  role_name: string;
}

  /* -------------------------------------------------------------------------- */
  /* Trainee Assignment View (READ-ONLY)                                        */
  /* -------------------------------------------------------------------------- */
  /**
   * This mirrors admin_trb_cadets_v.
   * Used ONLY to display vessel assignment (read-only).
   */
  interface ApiTraineeRow {
    cadet_id: number;
    vessel_id: number;
    vessel_name: string;
  }


/* -------------------------------------------------------------------------- */
/* Main Page                                                                  */
/* -------------------------------------------------------------------------- */

export function AdminCadetsPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<ApiCadetRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Import modal state
  const [importOpen, setImportOpen] = useState(false);

  // Read-only assignment lookup: cadet_id → vessel_name
  const [traineeVesselMap, setTraineeVesselMap] = useState<
    Record<number, string>
  >({});

  // Authoritative ACTIVE assignment lookup: cadet_id → ACTIVE assignment details
  const [activeAssignmentMap, setActiveAssignmentMap] = useState<
    Record<
      number,
      {
        assignment_id: number;
        vessel_id: number;
        vessel_name: string;
        start_date: string;
      }
    >
  >({});



  // Assign Vessel modal state
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedCadet, setSelectedCadet] = useState<{
    id: number;
    name: string;
    email: string;
  } | null>(null);

  // Close Assignment (reuse Phase 4E behavior)
  const [pendingClose, setPendingClose] = useState<{
    assignment_id: number;
    cadet_name: string;
    vessel_name: string;
    start_date: string;
  } | null>(null);

  const [closeEndDate, setCloseEndDate] = useState<string>("");
  const [closing, setClosing] = useState(false);




  /* ------------------------------ Load Data ------------------------------ */

  async function loadCadets() {
    try {
      setLoading(true);

      const res = await fetch("/api/v1/admin/cadets", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to load cadets (${res.status})`);
      }

      const json = await res.json();
      setRows(Array.isArray(json?.data) ? json.data : []);
    } catch (err: any) {
      console.error("❌ Failed to load cadets:", err);
      toast.error(err?.message || "Unable to load cadets");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  /* -------------------- Load Trainee Assignments (Read-Only) -------------------- */
/**
 * Fetches trainee assignment view.
 * IMPORTANT:
 * - Read-only
 * - View-based (admin_trb_cadets_v)
 * - No mutation, no assignment logic
 */
async function loadTraineeAssignments() {
  try {
    const res = await fetch("/api/v1/admin/trainees", {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Failed to load trainee assignments (${res.status})`);
    }

    const json = await res.json();
    const rows: ApiTraineeRow[] = Array.isArray(json?.data)
      ? json.data
      : [];

    const map: Record<number, string> = {};

    for (const r of rows) {
      if (r.cadet_id && r.vessel_name) {
        map[r.cadet_id] = r.vessel_name;
      }
    }

    setTraineeVesselMap(map);
  } catch (err: any) {
    console.error("❌ Failed to load trainee assignments:", err);
    toast.error(
      err?.message || "Unable to load cadet vessel assignments"
    );
    setTraineeVesselMap({});
  }
}

  /**
   * Loads ACTIVE cadet-vessel assignments.
   * This is the ONLY authoritative source for assignment eligibility.
   */
  async function loadActiveAssignments() {
    try {
      const res = await fetch("/api/v1/admin/vessel-assignments", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to load assignments (${res.status})`);
      }

      const json = await res.json();
      const rows = Array.isArray(json?.data) ? json.data : [];

      const map: Record<
        number,
        {
          assignment_id: number;
          vessel_id: number;
          vessel_name: string;
          start_date: string;
        }
      > = {};

      for (const r of rows) {
        if (r.status === "ACTIVE") {
          map[r.cadet_id] = {
            assignment_id: r.assignment_id,
            vessel_id: r.vessel_id,
            vessel_name: r.vessel_name,
            start_date: r.start_date,
          };
        }
      }

      setActiveAssignmentMap(map);
    } catch (err: any) {
      console.error("❌ Failed to load active assignments:", err);
      toast.error(
        err?.message || "Unable to determine assignment status"
      );
      setActiveAssignmentMap({});
    }
  }



  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!cancelled) {
        await loadCadets();
        await loadTraineeAssignments(); // read-only vessel visibility
        await loadActiveAssignments();  // authoritative
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* ============================ HEADER ============================ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <User size={20} />
            Cadets
          </h1>

          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Cadet identity registry. Assignment and training are managed
            separately.
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2">
          {/* Import Cadets */}
          <button
            onClick={() => setImportOpen(true)}
            className="
              inline-flex items-center gap-2
              px-4 py-2
              rounded-md
              border border-[hsl(var(--border))]
              bg-[hsl(var(--card))]
              text-[hsl(var(--foreground))]
              hover:bg-[hsl(var(--muted))]
            "
          >
            <Upload size={16} />
            Import Cadets
          </button>

          {/* Create Cadet */}
          <button
            onClick={() => navigate("/admin/cadets/create")}
            className="
              inline-flex items-center gap-2
              px-4 py-2
              rounded-md
              bg-[hsl(var(--primary))]
              text-[hsl(var(--primary-foreground))]
              hover:opacity-90
            "
          >
            <Plus size={16} />
            Create Cadet
          </button>
        </div>
      </div>

      {/* ============================ TABLE ============================ */}
      <div
        className="
          rounded-lg
          border border-[hsl(var(--border))]
          bg-[hsl(var(--card))]
          overflow-hidden
        "
      >
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--muted))]">
            <tr className="text-left">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Assigned Vessel</th>

              {/* NEW: Assignment Status */}
              <th className="px-4 py-2 text-center">Status</th>

              {/* Actions (Assign / Close) */}
              <th className="px-4 py-2 text-center">Action</th>

              <th className="px-4 py-2">Created</th>
            </tr>
          </thead>


          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-[hsl(var(--muted-foreground))]"
                >
                  Loading cadets…
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-[hsl(var(--muted-foreground))]"
                >
                  No cadets created yet
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((row) => (
                <tr
                  key={row.cadet_id}
                  className="
                    border-t border-[hsl(var(--border))]
                    hover:bg-[hsl(var(--muted))]
                    cursor-pointer
                  "
                  onClick={() =>
                    navigate(`/admin/cadets/${row.cadet_id}`)
                  }
                >
                  <td className="px-4 py-3 font-medium">
                    {row.cadet_name}
                  </td>

                  <td className="px-4 py-3">
                    {row.cadet_email}
                  </td>

                  {/* Assigned Vessel */}
                  <td className="px-4 py-3 text-sm">
                    {activeAssignmentMap[row.cadet_id] ? (
                      <span className="font-medium">
                        {activeAssignmentMap[row.cadet_id].vessel_name}
                      </span>
                    ) : (
                      <span className="text-[hsl(var(--muted-foreground))]">
                        —
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    {activeAssignmentMap[row.cadet_id] ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-700">
                        Assigned
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-600">
                        Not Assigned
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-center">
                    {activeAssignmentMap[row.cadet_id] ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();

                          const active = activeAssignmentMap[row.cadet_id];
                          if (!active) return;

                          // Default end date = today (explicit, editable)
                          const today = new Date().toISOString().slice(0, 10);

                          setCloseEndDate(today);
                          setPendingClose({
                            assignment_id: active.assignment_id,
                            cadet_name: row.cadet_name,
                            vessel_name: active.vessel_name,
                            start_date: active.start_date,
                          });
                        }}
                        className="
                          px-3 py-1.5
                          rounded-md
                          text-xs
                          border border-[hsl(var(--border))]
                          hover:bg-[hsl(var(--muted))]
                        "
                      >
                        Close Assignment
                      </button>

                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCadet({
                            id: row.cadet_id,
                            name: row.cadet_name,
                            email: row.cadet_email,
                          });
                          setAssignOpen(true);
                        }}
                        className="
                          px-3 py-1.5
                          rounded-md
                          text-xs
                          border border-[hsl(var(--border))]
                          hover:bg-[hsl(var(--muted))]
                        "
                      >
                        Assign Vessel
                      </button>
                    )}
                  </td>



                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>

                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ============================ FOOTNOTE ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        This page manages cadet identities only. Vessel assignment,
        Training Record Book progress, and audit workflows are handled
        in their respective modules.
      </p>

      {/* ============================ IMPORT MODAL ============================ */}
      <CadetImportModal
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        onCommitted={async () => {
          // Refresh list after successful import or no-op success
          await loadCadets();
        }}
      />
      {/* ============================ ASSIGN VESSEL MODAL ============================ */}
      <AssignCadetToVesselModal
        open={assignOpen}
        cadet={selectedCadet}
        onClose={() => {
          setAssignOpen(false);
          setSelectedCadet(null);
        }}
        onSuccess={async () => {
          await loadTraineeAssignments(); // optional
          await loadActiveAssignments();  // REQUIRED
        }}

      />

      {/* ------------------------------------------------------------------ */}
      {/* CLOSE ASSIGNMENT — Cadets Page (Phase 5B)                           */}
      {/* ------------------------------------------------------------------ */}

      {pendingClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-lg border bg-[hsl(var(--card))] p-6 space-y-4">
            <h3 className="text-sm font-semibold">
              Close Cadet Assignment
            </h3>

            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              This will close the cadet’s assignment to the vessel and lock
              further TRB activity.
              <br />
              <strong>This action cannot be undone.</strong>
            </p>

            <div className="rounded-md border bg-[hsl(var(--muted))] p-3 text-sm space-y-1">
              <div>
                <span className="font-medium">Cadet:</span>{" "}
                {pendingClose.cadet_name}
              </div>
              <div>
                <span className="font-medium">Vessel:</span>{" "}
                {pendingClose.vessel_name}
              </div>
              <div>
                <span className="font-medium">Start Date:</span>{" "}
                {pendingClose.start_date}
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Assignment End Date
              </label>

              {/* Custom calendar icon overlay — native icon hidden */}
              <DatePickerInput
                value={closeEndDate}
                min={pendingClose.start_date}
                onChange={setCloseEndDate}
              />

            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={closing}
                onClick={() => setPendingClose(null)}
                className="px-4 py-2 text-sm rounded-md border hover:bg-[hsl(var(--muted))]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={closing || !closeEndDate}
                onClick={async () => {
                  try {
                    setClosing(true);

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

                    // Refresh authoritative state
                    await loadActiveAssignments();
                    await loadTraineeAssignments();

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
