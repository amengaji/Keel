import { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  ClipboardList, Upload, Filter, Trash2, Loader2, Info, AlertTriangle, FileCheck, Eye, Users 
} from "lucide-react";
import { TaskImportModal } from "../components/TaskImportModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/Dialog"; 

type Task = {
  id: number;
  task_code: string;
  task_description: string;
  cadet_category: string; 
  trainee_type?: string; 
  is_mandatory: boolean;
  instructions?: string;
  safety_requirements?: string;
  evidence_type?: string;
  verification_method?: string;
  frequency?: string;
  section?: {
    name: string;
    shipType?: { name: string; };
  };
};

export function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // FILTERS
  const [filterDept, setFilterDept] = useState("");
  const [filterTraineeType, setFilterTraineeType] = useState("");
  
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  async function loadTasks() {
    try {
      setLoading(true);
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

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    if (!confirm("Delete this task?")) return;
    try {
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
    const matchType = filterTraineeType ? t.trainee_type === filterTraineeType : true;
    
    return matchSearch && matchDept && matchType;
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
            Master list of training tasks, instructions, and safety requirements.
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
      <div className="flex flex-wrap gap-4 p-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg items-center">
        {/* Search */}
        <div className="flex-1 relative min-w-[200px]">
          <input 
            placeholder="Search tasks..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-transparent border border-[hsl(var(--border))] rounded-md text-sm"
          />
          <Filter className="absolute left-3 top-2.5 text-[hsl(var(--muted-foreground))]" size={16} />
        </div>

        {/* Filter: Department */}
        <select 
          className="px-3 py-2 bg-transparent border border-[hsl(var(--border))] rounded-md text-sm"
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
        >
          <option value="">All Departments</option>
          <option value="Deck">Deck</option>
          <option value="Engine">Engine</option>
          <option value="Electrical">Electrical</option>
          <option value="Catering">Catering</option>
          <option value="General">General</option>
        </select>

        {/* Filter: Trainee Type (UPDATED) */}
        <select 
          className="px-3 py-2 bg-transparent border border-[hsl(var(--border))] rounded-md text-sm font-mono"
          value={filterTraineeType}
          onChange={e => setFilterTraineeType(e.target.value)}
        >
          <option value="">All Trainee Types</option>
          <option value="DECK_CADET">DECK_CADET</option>
          <option value="ENGINE_CADET">ENGINE_CADET</option>
          <option value="ETO_CADET">ETO_CADET</option>
          <option value="DECK_RATING">DECK_RATING</option>
          <option value="ENGINE_RATING">ENGINE_RATING</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--muted))] text-left font-medium">
            <tr>
              <th className="px-4 py-3 w-20">Code</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 w-32">Ship Type</th>
              <th className="px-4 py-3 w-28">Section</th>
              <th className="px-4 py-3 w-32">Trainee Type</th>
              <th className="px-4 py-3 w-24">Dept</th>
              <th className="px-4 py-3 w-16 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center"><Loader2 className="animate-spin inline" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-[hsl(var(--muted-foreground))]">No tasks found.</td></tr>
            ) : (
              filtered.map(t => (
                <tr 
                  key={t.id} 
                  onClick={() => setSelectedTask(t)}
                  className="border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs">{t.task_code}</td>
                  
                  {/* DESCRIPTION + ICONS */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-sm">{t.task_description}</span>
                      {t.instructions && (
                        <div className="text-blue-500" title="Has Instructions">
                          <Info size={14} />
                        </div>
                      )}
                      {t.safety_requirements && t.safety_requirements !== "None" && (
                        <div className="text-amber-500" title="Safety Warning">
                          <AlertTriangle size={14} />
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{t.section?.shipType?.name || "—"}</td>
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{t.section?.name}</td>

                  {/* TRAINEE TYPE */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono font-medium text-[hsl(var(--foreground))] bg-[hsl(var(--muted))] px-2 py-1 rounded">
                      {t.trainee_type || "ALL"}
                    </span>
                  </td>

                  {/* DEPARTMENT */}
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {t.cadet_category}
                    </span>
                  </td>
                  
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={(e) => handleDelete(e, t.id)} 
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono border">
                {selectedTask?.task_code}
              </span>
              <span>Task Details</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">{selectedTask.task_description}</h3>
                <div className="flex gap-4 mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  <div className="flex items-center gap-1"><Eye size={14}/> Verifier: {selectedTask.verification_method || "Observation"}</div>
                  <div className="flex items-center gap-1"><FileCheck size={14}/> Evidence: {selectedTask.evidence_type || "None"}</div>
                  <div className="flex items-center gap-1"><Users size={14}/> Type: <span className="font-mono bg-muted px-1 rounded">{selectedTask.trainee_type || "ALL"}</span></div>
                </div>
              </div>

              {selectedTask.instructions && (
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                  <h4 className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-400 mb-2">
                    <Info size={18} /> Instructions
                  </h4>
                  <p className="text-sm whitespace-pre-line text-blue-900 dark:text-blue-100">
                    {selectedTask.instructions}
                  </p>
                </div>
              )}

              {selectedTask.safety_requirements && (
                <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-100 dark:border-amber-900">
                  <h4 className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400 mb-2">
                    <AlertTriangle size={18} /> Safety Requirements
                  </h4>
                  <p className="text-sm whitespace-pre-line text-amber-900 dark:text-amber-100">
                    {selectedTask.safety_requirements}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                <div><span className="font-semibold block">Department</span>{selectedTask.cadet_category}</div>
                <div><span className="font-semibold block">Frequency</span>{selectedTask.frequency || "One-off"}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <TaskImportModal 
        open={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onSuccess={() => { loadTasks(); setIsImportOpen(false); }} 
      />
    </div>
  );
}