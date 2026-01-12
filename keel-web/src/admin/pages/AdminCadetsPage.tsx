import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  User, Plus, Upload, Users, Ship, UserMinus, 
  ChevronUp, ChevronDown, Edit2, Trash2, AlertTriangle,
  UserPlus, XCircle, Globe, VenusAndMars, Eye
} from "lucide-react";

import { CadetImportModal } from "../components/CadetImportModal";
import { AssignCadetToVesselModal } from "../components/AssignCadetToVesselModal";
import { StatCard } from "../components/ui/Card";

interface ApiCadetRow {
  cadet_id: number;
  cadet_email: string;
  cadet_name: string;
  nationality?: string;
  gender?: string; 
  created_at: string;
  updated_at: string;
  role_name: string;
}

// Allowed sorting keys - Expanded to include progress and gender
type SortableKeys = keyof ApiCadetRow | 'vessel' | 'status' | 'progress';
type SortConfig = { key: SortableKeys; direction: 'asc' | 'desc' } | null;

export function AdminCadetsPage() {
  const navigate = useNavigate();

  // Data & UI State
  const [rows, setRows] = useState<ApiCadetRow[]>([]);
  const [, setLoading] = useState(true);
  const [activeAssignmentMap, setActiveAssignmentMap] = useState<Record<number, any>>({});
  const [trainingMap, setTrainingMap] = useState<Record<number, any>>({}); // For progress bars
  const [importOpen, setImportOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedCadet, setSelectedCadet] = useState<any>(null);

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id?: number; bulk?: boolean } | null>(null);

  // Sorting & Pagination
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'cadet_name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Close Assignment State
  const [, setPendingClose] = useState<any>(null);

  async function loadData() {
    try {
      setLoading(true);
      const [cadetsRes, assignmentsRes, trainingRes] = await Promise.all([
        fetch("/api/v1/admin/cadets", { credentials: "include" }),
        fetch("/api/v1/admin/vessel-assignments", { credentials: "include" }),
        fetch("/api/v1/admin/trainees", { credentials: "include" })
      ]);
      
      const cadetsJson = await cadetsRes.json();
      const assignmentsJson = await assignmentsRes.json();
      const trainingJson = await trainingRes.json();

      setRows(Array.isArray(cadetsJson?.data) ? cadetsJson.data : []);
      
      const map: Record<number, any> = {};
      (assignmentsJson?.data || []).forEach((r: any) => { if (r.status === "ACTIVE") map[r.cadet_id] = r; });
      setActiveAssignmentMap(map);

      const tMap: Record<number, any> = {};
      (trainingJson?.data || []).forEach((t: any) => { tMap[t.cadet_id] = t; });
      setTrainingMap(tMap);

    } catch (err: any) {
      toast.error("Unable to load page data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  /** Helper for progress bar colour logic: Red (0), Orange (1-99), Green (100) */
  const getProgressColor = (percent: number) => {
    if (percent === 0) return "bg-red-500";
    if (percent >= 100) return "bg-green-500";
    return "bg-orange-500";
  };

  // Sorting Logic for ALL columns
  const sortedRows = useMemo(() => {
    let items = [...rows];
    if (sortConfig) {
      items.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        if (sortConfig.key === 'vessel') {
          aVal = activeAssignmentMap[a.cadet_id]?.vessel_name || '';
          bVal = activeAssignmentMap[b.cadet_id]?.vessel_name || '';
        } else if (sortConfig.key === 'status') {
          aVal = activeAssignmentMap[a.cadet_id] ? 'Assigned' : 'Unassigned';
          bVal = activeAssignmentMap[b.cadet_id] ? 'Assigned' : 'Unassigned';
        } else if (sortConfig.key === 'progress') {
          aVal = trainingMap[a.cadet_id]?.completion_percentage || 0;
          bVal = trainingMap[b.cadet_id]?.completion_percentage || 0;
        } else {
          aVal = (a as any)[sortConfig.key] || '';
          bVal = (b as any)[sortConfig.key] || '';
        }

        if (aVal.toString().toLowerCase() < bVal.toString().toLowerCase()) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal.toString().toLowerCase() > bVal.toString().toLowerCase()) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [rows, sortConfig, activeAssignmentMap, trainingMap]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedRows.length / pageSize);

  const requestSort = (key: SortableKeys) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIndicator = ({ column }: { column: SortableKeys }) => {
    if (sortConfig?.key !== column) return <div className="w-4" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedRows.length) setSelectedIds([]);
    else setSelectedIds(paginatedRows.map(r => r.cadet_id));
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDelete = async () => {
    toast.error("Deletion is disabled in Phase 2 to protect training records.");
    setShowDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><User size={20}/>Trainees</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage identity and assignments</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button onClick={() => setShowDeleteConfirm({ bulk: true })} className="bg-red-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2">
              <Trash2 size={16}/> Delete ({selectedIds.length})
            </button>
          )}
          <button onClick={() => setImportOpen(true)} className="border px-4 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-[hsl(var(--muted))]"><Upload size={16}/> Import</button>
          <button onClick={() => navigate("/admin/cadets/create")} className="bg-[hsl(var(--primary))] text-white px-4 py-2 rounded-md text-sm flex items-center gap-2"><Plus size={16}/> Create</button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Trainees" value={rows.length} icon={<Users size={20}/>} />
        <StatCard label="Assigned" value={Object.keys(activeAssignmentMap).length} tone="success" icon={<Ship size={20}/>} />
        <StatCard label="Unassigned" value={rows.length - Object.keys(activeAssignmentMap).length} tone="warning" icon={<UserMinus size={20}/>} />
      </div>

      {/* TABLE */}
      <div className="rounded-lg border bg-[hsl(var(--card))] overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-[hsl(var(--muted))]">
            <tr className="select-none">
              <th className="px-4 py-2 w-10">
                <input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === paginatedRows.length} onChange={toggleSelectAll} className="rounded" />
              </th>
              <th className="px-4 py-2 cursor-pointer hover:bg-[hsl(var(--border))]" onClick={() => requestSort('cadet_name')}>
                <div className="flex items-center gap-1">Identity <SortIndicator column="cadet_name" /></div>
              </th>
              <th className="px-4 py-2 cursor-pointer hover:bg-[hsl(var(--border))]" onClick={() => requestSort('gender')}>
                <div className="flex items-center gap-1">Gender <SortIndicator column="gender" /></div>
              </th>
              <th className="px-4 py-2 cursor-pointer hover:bg-[hsl(var(--border))]" onClick={() => requestSort('nationality')}>
                <div className="flex items-center gap-1">Nationality <SortIndicator column="nationality" /></div>
              </th>
              <th className="px-4 py-2 cursor-pointer hover:bg-[hsl(var(--border))]" onClick={() => requestSort('vessel')}>
                <div className="flex items-center gap-1">Vessel <SortIndicator column="vessel" /></div>
              </th>
              <th className="px-4 py-2 cursor-pointer hover:bg-[hsl(var(--border))]" onClick={() => requestSort('progress')}>
                <div className="flex items-center gap-1">TRB Progress <SortIndicator column="progress" /></div>
              </th>
              <th className="px-4 py-2 text-center cursor-pointer hover:bg-[hsl(var(--border))]" onClick={() => requestSort('status')}>
                <div className="flex items-center justify-center gap-1">Status <SortIndicator column="status" /></div>
              </th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => {
              const progress = trainingMap[row.cadet_id]?.completion_percentage || 0;
              return (
                <tr key={row.cadet_id} className="border-t hover:bg-[hsl(var(--muted)/50)]">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.includes(row.cadet_id)} onChange={() => toggleSelectOne(row.cadet_id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => navigate(`/admin/cadets/${row.cadet_id}`)}>
                    <div className="font-medium text-blue-600 hover:underline">{row.cadet_name}</div>
                    <div className="text-[11px] text-[hsl(var(--muted-foreground))]">{row.cadet_email}</div>
                  </td>
                  <td className="px-4 py-3 capitalize">
                    <div className="flex items-center gap-2">
                      <VenusAndMars size={14} className="text-[hsl(var(--muted-foreground))]"/>
                      {row.gender || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium">
                      <Globe size={14} className="text-[hsl(var(--muted-foreground))]"/>
                      {row.nationality || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">
                    {activeAssignmentMap[row.cadet_id]?.vessel_name || "—"}
                  </td>
                  <td className="px-4 py-3 w-40">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-700 ${getProgressColor(progress)}`} 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeAssignmentMap[row.cadet_id] ? 'bg-green-500/10 text-green-600' : 'bg-slate-500/10 text-slate-500'}`}>
                      {activeAssignmentMap[row.cadet_id] ? 'Assigned' : 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button title="View" onClick={(e) => { e.stopPropagation(); navigate(`/admin/cadets/${row.cadet_id}`); }} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600"><Eye size={16}/></button>
                      {activeAssignmentMap[row.cadet_id] ? (
                        <button title="Close Assignment" onClick={(e) => { e.stopPropagation(); setPendingClose({ ...activeAssignmentMap[row.cadet_id], cadet_name: row.cadet_name }); }} className="p-1.5 hover:bg-orange-100 rounded-md text-orange-600"><XCircle size={16}/></button>
                      ) : (
                        <button title="Assign Vessel" onClick={(e) => { e.stopPropagation(); setSelectedCadet({ id: row.cadet_id, name: row.cadet_name, email: row.cadet_email }); setAssignOpen(true); }} className="p-1.5 hover:bg-green-100 rounded-md text-green-600"><UserPlus size={16}/></button>
                      )}
                      <div className="w-px h-4 bg-[hsl(var(--border))]"/>
                      <button title="Edit" onClick={(e) => { e.stopPropagation(); navigate(`/admin/cadets/${row.cadet_id}`); }} className="p-1.5 hover:bg-blue-100 rounded-md text-blue-600"><Edit2 size={16}/></button>
                      <button title="Delete" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm({ id: row.cadet_id }); }} className="p-1.5 hover:bg-red-100 rounded-md text-red-600"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="p-4 border-t flex items-center justify-between bg-[hsl(var(--muted)/20)]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[hsl(var(--muted-foreground))]">Rows:</span>
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="text-xs border rounded p-1 bg-transparent font-bold">
              {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-2 py-1 border rounded disabled:opacity-30">Prev</button>
            <span>Page {currentPage} of {totalPages || 1}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-2 py-1 border rounded disabled:opacity-30">Next</button>
          </div>
        </div>
      </div>

      <CadetImportModal open={importOpen} onCancel={() => setImportOpen(false)} onCommitted={() => loadData()} />
      <AssignCadetToVesselModal open={assignOpen} cadet={selectedCadet} onClose={() => { setAssignOpen(false); setSelectedCadet(null); }} onSuccess={() => loadData()} />

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[hsl(var(--card))] border p-6 rounded-lg max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle size={24}/>
              <h3 className="font-bold">Confirm Deletion</h3>
            </div>
            <p className="text-sm mb-6 text-[hsl(var(--muted-foreground))]">
              {showDeleteConfirm.bulk ? `Are you sure you want to delete ${selectedIds.length} trainees?` : "Are you sure you want to delete this trainee?"} 
              This action is permanent.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm border rounded-md font-bold">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-md font-bold">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}