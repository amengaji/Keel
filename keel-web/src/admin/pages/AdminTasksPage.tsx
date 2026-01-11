import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { ClipboardList, Upload, Search, Info, Filter, UserCircle } from "lucide-react";
import { TaskImportModal } from "../components/TaskImportModal";
import { Dialog, DialogContent, DialogTitle } from "../../components/ui/Dialog"; 

// Mapping raw DB values to Human Readable Labels
const RANK_LABELS: Record<string, string> = {
  "DECK_CADET": "Deck Cadet",
  "ENGINE_CADET": "Engine Cadet",
  "ETO_CADET": "ETO Cadet",
  "DECK_RATING": "Deck Rating",
  "ENGINE_RATING": "Engine Rating"
};

export function AdminTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterMandatory, setFilterMandatory] = useState(""); 
  const [filterTrainee, setFilterTrainee] = useState(""); 
  const [activeTab, setActiveTab] = useState("Deck");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  async function loadTasks() {
    try {
      const res = await fetch("/api/v1/admin/tasks", { credentials: "include" });
      const json = await res.json();
      if (json.success) setTasks(json.data);
    } catch (err) {
      toast.error("Failed to load tasks");
    }
  }

  useEffect(() => { loadTasks(); }, []);

  // Robustly extract all unique trainee types from the tasks
  const traineeTypes = useMemo(() => {
    const types = new Set<string>();
    tasks.forEach(t => { if (t.trainee_type) types.add(t.trainee_type); });
    return Array.from(types).sort();
  }, [tasks]);

  const viewData = useMemo(() => {
    const filtered = tasks.filter(t => {
      const matchSearch = !search || t.task_description?.toLowerCase().includes(search.toLowerCase()) || t.task_code?.toLowerCase().includes(search.toLowerCase());
      const matchMandatory = !filterMandatory || (filterMandatory === "Mandatory" ? t.is_mandatory : true);
      const matchTrainee = !filterTrainee || t.trainee_type === filterTrainee;
      return matchSearch && matchMandatory && matchTrainee;
    });

    const deptTasks = filtered.filter(t => (t.cadet_category || "Deck") === activeTab);
    const sectionsMap: Record<string, any[]> = {};
    deptTasks.forEach(t => {
      const s = t.section?.name || "General Tasks";
      if (!sectionsMap[s]) sectionsMap[s] = [];
      sectionsMap[s].push(t);
    });
    return { sections: sectionsMap, names: Object.keys(sectionsMap).sort() };
  }, [tasks, activeTab, search, filterMandatory, filterTrainee]);

  useEffect(() => {
    if (viewData.names.length > 0 && (!activeSection || !viewData.names.includes(activeSection))) {
      setActiveSection(viewData.names[0]);
    }
  }, [viewData.names, activeTab]);

  const currentSectionTasks = activeSection ? viewData.sections[activeSection] || [] : [];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden space-y-4 text-foreground bg-background">
      {/* FILTER BAR - USES THEME VARIABLES */}
      <div className="flex-none flex flex-col lg:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary"><ClipboardList size={22} /></div>
          <h1 className="text-xl font-bold">Task Management</h1>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* TRAINEE DROPDOWN - FIXED */}
          <div className="relative min-w-[200px]">
            <UserCircle className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
            <select 
              value={filterTrainee}
              onChange={e => setFilterTrainee(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-muted border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
            >
              <option value="">All Ranks</option>
              {traineeTypes.map(t => <option key={t} value={t}>{RANK_LABELS[t] || t}</option>)}
            </select>
          </div>

          <div className="relative min-w-[150px]">
            <Filter className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
            <select 
              value={filterMandatory}
              onChange={e => setFilterMandatory(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-muted border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
            >
              <option value="">All Tasks</option>
              <option value="Mandatory">Mandatory Only</option>
            </select>
          </div>

          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
            <input 
              placeholder="Search..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <button onClick={() => setIsImportOpen(true)} className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow hover:opacity-90">
            <Upload size={16} /> Import
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex bg-muted/50 border-b border-border">
          {["Deck", "Engine"].map(dept => (
            <button
              key={dept}
              onClick={() => { setActiveTab(dept); setActiveSection(null); }}
              className={`px-10 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === dept ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {dept.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* SIDEBAR */}
          <div className="w-72 flex-none border-r border-border bg-muted/20 flex flex-col">
            <div className="p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border">Sections</div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {viewData.names.map(name => (
                <button
                  key={name}
                  onClick={() => setActiveSection(name)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${activeSection === name ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <span className="truncate">{name}</span>
                  <span className="text-[10px] opacity-70">{viewData.sections[name].length}</span>
                </button>
              ))}
            </div>
          </div>

          {/* TABLE AREA */}
          <div className="flex-1 overflow-y-auto bg-background">
              <table className="w-full text-sm text-left border-separate border-spacing-0">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-black text-muted-foreground uppercase border-b border-border w-24">Code</th>
                    <th className="px-6 py-3 text-[10px] font-black text-muted-foreground uppercase border-b border-border">Description</th>
                    <th className="px-6 py-3 text-[10px] font-black text-muted-foreground uppercase border-b border-border w-40">Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentSectionTasks.map(t => (
                    <tr key={t.id} onClick={() => setSelectedTask(t)} className="group hover:bg-muted/40 cursor-pointer">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-primary">{t.task_code}</td>
                      <td className="px-6 py-4 font-medium leading-relaxed">
                        {t.task_description}
                        {t.is_mandatory && <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-destructive/10 text-destructive rounded-full font-black border border-destructive/20">Required</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black bg-muted px-2 py-1 rounded text-muted-foreground">{RANK_LABELS[t.trainee_type!] || t.trainee_type || "Universal"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        </div>
      </div>

      <TaskImportModal open={isImportOpen} onClose={() => setIsImportOpen(false)} onSuccess={() => { loadTasks(); setIsImportOpen(false); }} />

      <Dialog open={!!selectedTask} onOpenChange={(o) => !o && setSelectedTask(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-border bg-card rounded-2xl shadow-lg">
          <div className="p-8 bg-muted/30 border-b border-border text-foreground">
            <DialogTitle className="space-y-2">
              <div className="text-[10px] font-black text-primary tracking-widest uppercase px-2 py-1 bg-primary/10 rounded w-fit">{selectedTask?.task_code}</div>
              <div className="text-2xl font-bold leading-tight">{selectedTask?.task_description}</div>
            </DialogTitle>
          </div>
          <div className="p-8 space-y-6 max-h-[50vh] overflow-y-auto">
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/20 rounded-xl border border-border">
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Rank</span>
                  <div className="mt-1 text-sm font-bold text-foreground">{selectedTask?.trainee_type ? (RANK_LABELS[selectedTask.trainee_type] || selectedTask.trainee_type) : "Universal"}</div>
                </div>
                <div className="p-4 bg-muted/20 rounded-xl border border-border">
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Type</span>
                  <div className="mt-1 text-sm font-bold text-foreground">{selectedTask?.is_mandatory ? "Mandatory Record" : "Standard Task"}</div>
                </div>
             </div>
             {selectedTask?.instructions && (
               <div className="p-5 bg-primary/5 rounded-xl border border-primary/20 flex gap-3 text-foreground">
                 <Info className="text-primary shrink-0" size={20} />
                 <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{selectedTask.instructions}</p>
               </div>
             )}
          </div>
          <div className="p-4 border-t border-border flex justify-end bg-muted/10">
            <button onClick={() => setSelectedTask(null)} className="px-8 py-2.5 bg-foreground text-background rounded-lg text-sm font-bold hover:opacity-90">CLOSE</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}