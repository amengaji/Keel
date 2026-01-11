// keel-web/src/admin/pages/AdminTrainingProgressPage.tsx
//
// Keel — Training Progress (Fleet × Cadet × TRB Coverage)
// ----------------------------------------------------
// PURPOSE:
// - Fleet-wide visibility of cadet training compliance
// - Audit-first, read-only coverage dashboard
// - Live data aggregation from Admin TRB View AND Vessel Registry
//

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  Ship,
  BookCheck,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */
type TraineeProgress = {
  assignment_id: number | null;
  cadet_id: number;
  cadet_email: string;
  cadet_name: string | null;
  vessel_id: number | null;
  vessel_name: string | null;
  ship_type_name: string | null;
  assignment_start_date: string | null;
  assignment_end_date: string | null;
  total_tasks: number;
  tasks_master_approved: number;
  completion_percentage: number; 
  last_activity_at: string | null;
  overall_status: "Unassigned" | "Not Started" | "In Progress" | "Completed";
};

type VesselSummary = {
  id: number;
  name: string;
  is_active: boolean;
};

/* -------------------------------------------------------------------------- */
/* Helper — Completion Bar                                                     */
/* -------------------------------------------------------------------------- */
function CompletionBar({ value, status }: { value: number, status: string }) {
  if (status === "Unassigned") {
    return <div className="text-xs text-[hsl(var(--muted-foreground))] italic">N/A</div>;
  }

  const safeValue = isNaN(value) ? 0 : Math.round(value);
  
  return (
    <div className="w-full min-w-[120px]">
      <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
        <div
          className="h-2 bg-[hsl(var(--primary))]"
          style={{ width: `${safeValue}%` }}
        />
      </div>
      <div className="text-xs mt-1 text-right">{safeValue}%</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helper — Audit Status Badge                                                 */
/* -------------------------------------------------------------------------- */
function AuditStatus({ percentage, status }: { percentage: number, status: string }) {
  if (status === "Unassigned") return <span className="text-xs opacity-50">—</span>;

  const ready = percentage === 100;
  return ready ? (
    <span className="text-xs px-2 py-1 rounded-md bg-green-500/10 text-green-600 border border-green-500/20">
      Audit Ready
    </span>
  ) : (
    <span className="text-xs px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-700 border border-yellow-500/20">
      In Progress
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                         */
/* -------------------------------------------------------------------------- */
export function AdminTrainingProgressPage() {
  const [trainees, setTrainees] = useState<TraineeProgress[]>([]);
  const [vesselCount, setVesselCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FETCH DATA
  useEffect(() => {
    const abortController = new AbortController();

    async function loadData() {
      try {
        setLoading(true);
        
        // 1. Fetch Trainees (Training Progress)
        const resTrainees = await fetch("/api/v1/admin/trainees", {
          signal: abortController.signal,
          credentials: "include",
        });

        // 2. Fetch Vessels (Fleet Count) - NEW
        const resVessels = await fetch("/api/v1/admin/vessels", {
          signal: abortController.signal,
          credentials: "include",
        });

        if (!resTrainees.ok || !resVessels.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const jsonTrainees = await resTrainees.json();
        const jsonVessels = await resVessels.json();

        // Update State
        if (jsonTrainees.success && Array.isArray(jsonTrainees.data)) {
          setTrainees(jsonTrainees.data);
        }
        
        if (jsonVessels.success && Array.isArray(jsonVessels.data)) {
          // Count active vessels in fleet
          const active = jsonVessels.data.filter((v: any) => v.is_active !== false).length;
          setVesselCount(active);
        }

      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(err);
          setError("Unable to load dashboard data");
          toast.error("Unable to load dashboard data");
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
    return () => abortController.abort();
  }, []);

  // CALCULATE SUMMARY STATS
  const totalCadets = trainees.length;
  
  // Completed TRBs (100% progress)
  const completedTRBs = trainees.filter((t) => Number(t.completion_percentage) === 100).length;
  const auditReadyCount = completedTRBs;
  
  // "Not Started" includes explicitly not started AND unassigned
  const notStarted = trainees.filter((t) => 
    t.overall_status === "Not Started" || t.overall_status === "Unassigned"
  ).length;

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-[hsl(var(--muted-foreground))]">
        <Loader2 className="animate-spin mr-2" /> Loading fleet analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg border border-red-200 bg-red-50 text-red-700">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ============================ PAGE HEADER ============================ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Users size={20} />
            Training Progress
          </h1>

          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Fleet-wide cadet training coverage and audit readiness.
          </p>
        </div>

        <button
          onClick={() =>
            toast.message("Data is live from Admin TRB View")
          }
          className="
            h-9 w-9
            flex items-center justify-center
            rounded-md
            border border-[hsl(var(--border))]
            hover:bg-[hsl(var(--muted))]
          "
          title="System Info"
        >
          <ShieldCheck size={18} />
        </button>
      </div>

      {/* ============================ SUMMARY STRIP ============================ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard icon={<Users size={18} />} label="Total Cadets" value={String(totalCadets)} />
        {/* Now shows Actual Fleet Size */}
        <SummaryCard icon={<Ship size={18} />} label="Active Vessels" value={String(vesselCount)} />
        <SummaryCard icon={<BookCheck size={18} />} label="TRBs Completed" value={String(completedTRBs)} />
        <SummaryCard
          icon={<AlertTriangle size={18} />}
          label="Not Started"
          value={String(notStarted)}
        />
        <SummaryCard
          icon={<ShieldCheck size={18} />}
          label="Audit Ready"
          value={String(auditReadyCount)}
        />
      </div>

      {/* ============================ MAIN TABLE ============================ */}
      <div
        className="
          overflow-hidden
          rounded-lg
          border border-[hsl(var(--border))]
          bg-[hsl(var(--card))]
        "
      >
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--muted))]">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Cadet</th>
              <th className="px-4 py-3 text-left font-medium">Vessel</th>
              <th className="px-4 py-3 text-left font-medium">TRB Type</th>
              <th className="px-4 py-3 text-left font-medium">Completion</th>
              <th className="px-4 py-3 text-center font-medium">Task Progress</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-center font-medium">Audit</th>
            </tr>
          </thead>

          <tbody>
            {trainees.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
                  No cadets found.
                </td>
              </tr>
            ) : (
              trainees.map((row) => (
                <tr
                  key={row.cadet_id} 
                  className="
                    border-t border-[hsl(var(--border))]
                    hover:bg-[hsl(var(--muted))]
                  "
                >
                  {/* CADET */}
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.cadet_name || row.cadet_email}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                      {row.cadet_email}
                    </div>
                  </td>

                  {/* VESSEL */}
                  <td className="px-4 py-3">
                    {row.vessel_name ? (
                      <div className="font-medium">{row.vessel_name}</div>
                    ) : (
                      <span className="text-[hsl(var(--muted-foreground))] opacity-50">—</span>
                    )}
                  </td>

                  {/* TRB TYPE */}
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                    {row.ship_type_name || "—"}
                  </td>

                  {/* COMPLETION */}
                  <td className="px-4 py-3">
                    <CompletionBar value={Number(row.completion_percentage)} status={row.overall_status} />
                  </td>

                  {/* TASK PROGRESS */}
                  <td className="px-4 py-3 text-center font-mono text-xs">
                    {row.overall_status === 'Unassigned' ? "—" : `${row.tasks_master_approved} / ${row.total_tasks}`}
                  </td>

                  {/* OVERALL STATUS */}
                  <td className="px-4 py-3 text-center">
                    <StatusPill status={row.overall_status} />
                  </td>

                  {/* AUDIT STATUS */}
                  <td className="px-4 py-3 text-center">
                    <AuditStatus percentage={Number(row.completion_percentage)} status={row.overall_status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ============================ FOOTNOTE ============================ */}
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        This view shows all registered cadets. 'Unassigned' cadets have no active vessel assignment and therefore no active TRB progress.
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Unassigned": "bg-slate-100 text-slate-500 border-slate-200",
    "Not Started": "bg-orange-50 text-orange-600 border-orange-100",
    "In Progress": "bg-blue-50 text-blue-600 border-blue-100",
    "Completed": "bg-green-50 text-green-600 border-green-100",
  };

  const defaultStyle = "bg-slate-100 text-slate-500 border-slate-200";

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${styles[status] || defaultStyle}`}>
      {status}
    </span>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-lg
        border border-[hsl(var(--border))]
        bg-[hsl(var(--card))]
        p-4
        space-y-2
      "
    >
      <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))]">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}