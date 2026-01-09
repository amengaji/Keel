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
/* Main Page                                                                  */
/* -------------------------------------------------------------------------- */

export function AdminCadetsPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<ApiCadetRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Import modal state
  const [importOpen, setImportOpen] = useState(false);

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

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!cancelled) {
        await loadCadets();
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
    </div>
  );
}
