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
              </tr>
            </thead>
            <tbody>
              {sortedAssignments.map((a) => (
                <tr
                  key={a.assignment_id}
                  className={[
                    "border-t cursor-pointer",
                    getRowTone(a.status),
                  ].join(" ")}
                  onClick={() => navigate(`/admin/cadets/${a.cadet_id}`)}
                >
                  <td className="px-3 py-2 font-medium">{a.cadet_name}</td>
                  <td className="px-3 py-2">
                    {formatIsoDate(a.start_date)} →{" "}
                    {a.end_date ? formatIsoDate(a.end_date) : "Present"}
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
    </div>
  );
}
