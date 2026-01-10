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

  // Assign Vessel modal state
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedCadet, setSelectedCadet] = useState<{
    id: number;
    name: string;
    email: string;
  } | null>(null);



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


  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!cancelled) {
        await loadCadets();
        await loadTraineeAssignments(); // read-only vessel visibility

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

                  <td className="px-4 py-3 text-sm">
                    {traineeVesselMap[row.cadet_id] ? (
                      <span className="font-medium">
                        {traineeVesselMap[row.cadet_id]}
                      </span>
                    ) : (
                      <span className="text-[hsl(var(--muted-foreground))]">
                        — Not Assigned —
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {traineeVesselMap[row.cadet_id] ? (
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        Assigned
                      </span>
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
          await loadTraineeAssignments();
        }}
      />
    </div>
  );
}
