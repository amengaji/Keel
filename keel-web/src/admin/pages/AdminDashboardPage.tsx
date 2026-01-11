import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  StatCard,
} from "../components/ui/Card";
import {
  Ship,
  Users,
  FileCheck,
  LayoutList,
  RefreshCw,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */
type DashboardStats = {
  vessels: { active: number };
  cadets: { total: number; onboard: number; shore: number };
  tasks: { total_templates: number };
  signatures: { pending: number; ready_to_lock: number };
};

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/dashboard", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load stats");
      setStats(json.data);
    } catch (err) {
      console.error(err);
      toast.error("Could not load Command Center stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-10">
      {/* ============================ HEADER ============================ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Shore Command Center</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Fleet-wide training status, operational health, and live statistics.
          </p>
        </div>
        <button 
          onClick={fetchStats}
          disabled={loading}
          className="p-2 rounded-md hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ============================ LIVE METRICS ============================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          label="Active Vessels"
          value={loading ? "-" : stats?.vessels.active ?? 0}
          icon={<Ship size={20} />}
          onClick={() => {}}
        />

        <StatCard
          label="Cadets Onboard"
          value={loading ? "-" : stats?.cadets.onboard ?? 0}
          icon={<Users size={20} />}
          tone={stats?.cadets.onboard ? "success" : "neutral"}
          onClick={() => {}}
        />

        <StatCard
          label="Total Trainees"
          value={loading ? "-" : stats?.cadets.total ?? 0}
          icon={<Users size={20} />}
          onClick={() => {}}
        />

        <StatCard
          label="TRB Tasks Defined"
          value={loading ? "-" : stats?.tasks.total_templates ?? 0}
          icon={<LayoutList size={20} />}
          onClick={() => {}}
        />
      </div>

      {/* ============================ PHASE 4 PLACEHOLDERS ============================ */}
      {/* These sections will be wired up in Phase 4 (Sign-offs) */}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
        <Card>
          <CardHeader 
            title="Signature Status (Phase 4)" 
            subtitle="Pending implementation of Officer Sign-off logic"
          />
          <div className="p-4 flex items-center justify-center h-32 text-sm text-[hsl(var(--muted-foreground))] italic border border-dashed rounded m-4 bg-[hsl(var(--muted))]/30">
            No live signature data available yet.
          </div>
        </Card>

        <Card>
           <CardHeader 
            title="Audit Readiness (Phase 4)" 
            subtitle="Pending implementation of Evidence Verification"
          />
          <div className="p-4 flex items-center justify-center h-32 text-sm text-[hsl(var(--muted-foreground))] italic border border-dashed rounded m-4 bg-[hsl(var(--muted))]/30">
             Compliance metrics will appear here.
          </div>
        </Card>
      </div>
    </div>
  );
}
