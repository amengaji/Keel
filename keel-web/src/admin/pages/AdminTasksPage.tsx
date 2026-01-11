import { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  ClipboardList, Upload, Filter, Trash2, Loader2 
} from "lucide-react";
import { TaskImportModal } from "../components/TaskImportModal"; 

type Task = {
  id: number;
  task_code: string;
  task_description: string;
  cadet_category: string;
  is_mandatory: boolean;
  section?: {
    name: string;
    shipType?: {
      name: string;
    };
  };
};

export function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);

  async function loadTasks() {
    try {
      setLoading(true);
      // FIX: Use the new Admin API endpoint
      const res = await fetch("/api/v1/admin/tasks", { credentials: "include" }); 
      const json = await res.json();
      if (json.success) setTasks(json.data);
      else throw new Error(json.message);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTasks(); }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this task?")) return;
    try {
      // FIX: Use the new Admin API endpoint for delete
      const res = await fetch(`/api/v1/admin/tasks/${id}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Task deleted");
        loadTasks();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    }
  }

  const filtered = tasks.filter(t => {
    const matchSearch = t.task_description.toLowerCase().includes(search.toLowerCase()) || 
                        t.task_code.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept ? t.cadet_category === filterDept : true;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ClipboardList size={20} /> Task Management
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Master list of training tasks assigned to cadets.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-md text-sm font-medium hover:opacity-90"
          >
            <Upload size={16} /> Import Excel
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-4 p-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg">
        <div className="flex-1 relative">
          <input 
            placeholder="Search tasks..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-transparent border border-[hsl(var(--border))] rounded-md text-sm"
          />
          <Filter className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" size={16} />
        </div>
        <select 
          className="px-3 py-2 bg-transparent border border-[hsl(var(--border))] rounded-md text-sm"
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
        >
          <option value="">All Departments</option>
          <option value="DECK">Deck</option>
          <option value="ENGINE">Engine</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--muted))] text-left font-medium">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Ship Type</th>
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Dept</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="animate-spin inline" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-[hsl(var(--muted-foreground))]">No tasks found.</td></tr>
            ) : (
              filtered.map(t => (
                <tr key={t.id} className="border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]">
                  <td className="px-4 py-3 font-mono text-xs">{t.task_code}</td>
                  <td className="px-4 py-3 max-w-md truncate" title={t.task_description}>{t.task_description}</td>
                  <td className="px-4 py-3">{t.section?.shipType?.name || "—"}</td>
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{t.section?.name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-bold">{t.cadet_category}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TaskImportModal 
        open={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onSuccess={() => { loadTasks(); setIsImportOpen(false); }} 
      />
    </div>
  );
}