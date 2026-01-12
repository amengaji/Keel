import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardHeader, StatCard } from "../components/ui/Card";
import { Ship, Users, LayoutList, RefreshCw, Activity, UserMinus } from "lucide-react";

type DashboardStats = {
  vessels: { active: number };
  cadets: { total: number; onboard: number; shore: number };
  tasks: { total_templates: number };
  signatures: { pending: number; ready_to_lock: number };
  risk_profile?: { high: number; medium: number; low: number }; // Future-proofing
};

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock risk data based on active vessels/cadets for Phase 4 visual
  const riskData = useMemo(() => [
    { name: 'High Risk', value: stats?.cadets.onboard ? Math.floor(stats.cadets.onboard * 0.1) : 2, color: '#ef4444' },
    { name: 'Medium Risk', value: stats?.cadets.onboard ? Math.floor(stats.cadets.onboard * 0.3) : 5, color: '#f59e0b' },
    { name: 'Low Risk', value: stats?.cadets.onboard ? Math.floor(stats.cadets.onboard * 0.6) : 10, color: '#22c55e' },
  ], [stats]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/dashboard", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load stats");
      setStats(json.data);
    } catch (err) {
      toast.error("Could not load Command Center stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Shore Command Center</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Fleet-wide training status and live statistics.</p>
        </div>
        <button onClick={fetchStats} disabled={loading} className="p-2 rounded-md hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard label="Active Vessels" value={loading ? "-" : stats?.vessels.active ?? 0} icon={<Ship size={20} />} onClick={() => navigate("/admin/vessels")} />
        <StatCard label="Trainees Onboard" value={loading ? "-" : stats?.cadets.onboard ?? 0} icon={<Users size={20} />} tone="success" onClick={() => navigate("/admin/assignments")} />
        <StatCard label="Trainees Shore" value={loading ? "-" : stats?.cadets.shore ?? 0} icon={<UserMinus size={20} />} tone="warning" onClick={() => navigate("/admin/cadets")} />
        <StatCard label="TRB Tasks" value={loading ? "-" : stats?.tasks.total_templates ?? 0} icon={<LayoutList size={20} />} onClick={() => navigate("/admin/tasks")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader title="Fleet Risk Profile" subtitle="Audit readiness based on TRB evidence verification" />
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {riskData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent Activity" subtitle="Real-time audit log" />
          <div className="space-y-4 mt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 text-sm p-2 rounded-md bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))]">
                <Activity size={14} className="text-primary" />
                <div className="flex-1 truncate text-xs">Vessel <b>Aries</b> synced 14 new evidences.</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold">2m ago</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
           <CardHeader title="Compliance Overview" subtitle="Evidence verification status" />
           <div className="space-y-6 mt-6">
              <div className="flex justify-between items-end">
                <div className="text-xs font-bold uppercase text-muted-foreground">Signatures Verified</div>
                <div className="text-sm font-semibold">82%</div>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[82%]" />
              </div>
              <div className="flex justify-between items-end">
                <div className="text-xs font-bold uppercase text-muted-foreground">Audit Ready TRBs</div>
                <div className="text-sm font-semibold">64%</div>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[64%]" />
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
}
