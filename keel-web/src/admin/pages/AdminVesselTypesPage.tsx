// keel-web/src/admin/pages/AdminVesselTypesPage.tsx

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Anchor,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
} from "lucide-react";
import { ConfirmDeleteModal } from "../../components/common/ConfirmDeleteModal";

type ShipType = {
  id: number;
  name: string;
  type_code: string;
  description: string | null;
  createdAt: string;
};

export function AdminVesselTypesPage() {
  const [data, setData] = useState<ShipType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShipType | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);

  /* -------------------------------------------------------------------------- */
  /* LOAD DATA                                                                  */
  /* -------------------------------------------------------------------------- */
  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/ship-types");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      toast.error("Failed to load ship types");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* -------------------------------------------------------------------------- */
  /* HANDLERS                                                                   */
  /* -------------------------------------------------------------------------- */
  
  function openCreate() {
    setEditingItem(null);
    setFormName("");
    setFormCode("");
    setFormDesc("");
    setIsModalOpen(true);
  }

  function openEdit(item: ShipType) {
    setEditingItem(item);
    setFormName(item.name);
    setFormCode(item.type_code);
    setFormDesc(item.description || "");
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formName || !formCode) {
      toast.error("Name and Code are required");
      return;
    }

    try {
      setSubmitting(true);
      const url = editingItem
        ? `/api/v1/admin/ship-types/${editingItem.id}`
        : "/api/v1/admin/ship-types";
      
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          type_code: formCode,
          description: formDesc,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Operation failed");

      toast.success(editingItem ? "Updated successfully" : "Created successfully");
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/v1/admin/ship-types/${deleteId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Delete failed");

      toast.success("Deleted successfully");
      setDeleteId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* RENDER                                                                     */
  /* -------------------------------------------------------------------------- */
  
  const filtered = data.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.type_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Anchor size={20} />
            Vessel Types
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Manage the taxonomy of vessels (e.g., Bulk Carrier, Tanker).
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium flex items-center gap-2 hover:opacity-90"
        >
          <Plus size={16} /> Add Type
        </button>
      </div>

      {/* FILTER */}
      <div className="flex items-center gap-2 max-w-sm rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2">
        <Search size={16} className="text-[hsl(var(--muted-foreground))]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search types..."
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      {/* TABLE */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--muted))]">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Type Name</th>
              <th className="px-4 py-3 text-left font-medium">Code</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[hsl(var(--muted-foreground))]">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="animate-spin" size={16} /> Loading...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[hsl(var(--muted-foreground))]">
                  No vessel types found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.type_code}</td>
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{item.description || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="p-1.5 rounded-md hover:bg-red-100 text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
              <h3 className="font-semibold">
                {editingItem ? "Edit Vessel Type" : "New Vessel Type"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:opacity-70">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium uppercase text-[hsl(var(--muted-foreground))]">Name</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-transparent text-sm"
                  placeholder="e.g. Bulk Carrier"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-[hsl(var(--muted-foreground))]">Code</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-transparent text-sm"
                  placeholder="e.g. BULK_CARRIER"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-[hsl(var(--muted-foreground))]">Description</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-transparent text-sm"
                  placeholder="Optional description"
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm rounded-md border border-[hsl(var(--border))]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      <ConfirmDeleteModal
        open={!!deleteId}
        title="Delete Vessel Type"
        description="Are you sure? This cannot be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
