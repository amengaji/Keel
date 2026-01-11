import { useState, useRef, useEffect } from "react";
import { X, UploadCloud, Download, AlertCircle, CheckCircle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

// REMOVED: API_BASE_URL and useAuth imports (not needed/available)

type TaskImportModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

// Types matching backend preview
type PreviewRow = {
  row_number: number;
  status: "READY" | "FAIL" | "SKIP";
  normalized: {
    part_number: number;
    title: string;
    ship_type_name?: string;
  };
  issues: string[];
};

type PreviewData = {
  summary: { total: number; ready: number; fail: number; skip: number };
  rows: PreviewRow[];
  notes: string[];
};

export function TaskImportModal({ open, onClose, onSuccess }: TaskImportModalProps) {
  // REMOVED: const { token } = useAuth(); (Cookie auth doesn't use tokens)
  
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"UPLOAD" | "PREVIEW" | "COMMITTING">("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  // Reset state on close/open
  useEffect(() => {
    if (!open) {
      setStep("UPLOAD");
      setFile(null);
      setPreview(null);
    }
  }, [open]);

  if (!open) return null;

  // 1. Download Template
  const handleDownloadTemplate = async () => {
    try {
      // FIX: Use relative path + credentials: include
      const res = await fetch(`/api/v1/admin/imports/tasks/template`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to download template");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "keel_task_import_template.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Could not download template");
    }
  };

  // 2. Upload & Preview
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    const formData = new FormData();
    formData.append("file", selected);

    try {
      setStep("PREVIEW");
      // FIX: Use relative path + credentials: include
      const res = await fetch(`/api/v1/admin/imports/tasks/preview`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setPreview(json.data);
    } catch (err: any) {
      toast.error(err.message || "Preview failed");
      setStep("UPLOAD");
      setFile(null);
    }
  };

  // 3. Commit
  const handleCommit = async () => {
    if (!file) return;
    try {
      setStep("COMMITTING");
      const formData = new FormData();
      formData.append("file", file);

      // FIX: Use relative path + credentials: include
      const res = await fetch(`/api/v1/admin/imports/tasks/commit`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      
      toast.success(json.data.notes?.[0] || "Import successful");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Commit failed");
      setStep("PREVIEW");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-xl flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UploadCloud className="text-[hsl(var(--primary))]" size={20} />
            Import TRB Tasks
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[hsl(var(--muted))] rounded">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "UPLOAD" && (
            <div className="space-y-8">
              {/* Step 1: Template */}
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium text-blue-600 flex items-center gap-2">
                    <FileSpreadsheet size={16} />
                    Step 1: Get the Template
                  </div>
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">
                    Download the Excel template with Ship Type validation.
                  </div>
                </div>
                <button 
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download size={14} /> Download
                </button>
              </div>

              {/* Step 2: Upload */}
              <div className="border-2 border-dashed border-[hsl(var(--border))] rounded-xl p-10 flex flex-col items-center justify-center text-center gap-4 hover:bg-[hsl(var(--muted))]/30 transition-colors">
                <div className="h-12 w-12 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
                  <UploadCloud size={24} className="text-[hsl(var(--muted-foreground))]" />
                </div>
                <div>
                  <div className="font-medium">Click to upload filled Excel</div>
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">.xlsx files only</div>
                </div>
                <input 
                  type="file" 
                  ref={fileRef}
                  accept=".xlsx"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button 
                  onClick={() => fileRef.current?.click()}
                  className="px-6 py-2 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] rounded-md font-medium"
                >
                  Select File
                </button>
              </div>
            </div>
          )}

          {(step === "PREVIEW" || step === "COMMITTING") && preview && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 bg-[hsl(var(--muted))] rounded-lg text-center">
                  <div className="text-2xl font-bold">{preview.summary.total}</div>
                  <div className="text-xs uppercase tracking-wide opacity-70">Total Rows</div>
                </div>
                <div className="p-3 bg-green-500/10 text-green-700 rounded-lg text-center border border-green-500/20">
                  <div className="text-2xl font-bold">{preview.summary.ready}</div>
                  <div className="text-xs uppercase tracking-wide opacity-70">Ready</div>
                </div>
                <div className="p-3 bg-red-500/10 text-red-700 rounded-lg text-center border border-red-500/20">
                  <div className="text-2xl font-bold">{preview.summary.fail}</div>
                  <div className="text-xs uppercase tracking-wide opacity-70">Failed</div>
                </div>
                <div className="p-3 bg-yellow-500/10 text-yellow-700 rounded-lg text-center border border-yellow-500/20">
                  <div className="text-2xl font-bold">{preview.summary.skip}</div>
                  <div className="text-xs uppercase tracking-wide opacity-70">Skipped</div>
                </div>
              </div>

              {/* Issues List */}
              {preview.summary.fail > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-red-800">
                    <AlertCircle size={16} />
                    Validation Errors ({preview.summary.fail})
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {preview.rows.filter(r => r.status === "FAIL").map(r => (
                      <div key={r.row_number} className="text-sm text-red-700">
                        Row {r.row_number}: {r.issues.join(", ")}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Table Preview */}
              <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[hsl(var(--muted))] text-left text-xs uppercase font-medium">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Part</th>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Ship Type</th>
                      <th className="px-3 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--border))]">
                    {preview.rows.slice(0, 50).map((row) => (
                      <tr key={row.row_number} className={row.status === "FAIL" ? "bg-red-50/50" : ""}>
                        <td className="px-3 py-2">{row.row_number}</td>
                        <td className="px-3 py-2">{row.normalized.part_number}</td>
                        <td className="px-3 py-2 font-medium truncate max-w-[200px]">{row.normalized.title}</td>
                        <td className="px-3 py-2">{row.normalized.ship_type_name || "Universal"}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={`
                            inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase
                            ${row.status === "READY" ? "bg-green-100 text-green-700" : 
                              row.status === "FAIL" ? "bg-red-100 text-red-700" : 
                              "bg-yellow-100 text-yellow-700"}
                          `}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {preview.rows.length > 50 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-2 text-center text-[hsl(var(--muted-foreground))] italic">
                          ... and {preview.rows.length - 50} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-[hsl(var(--border))] flex justify-end gap-3 bg-[hsl(var(--muted))]/10">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium hover:underline"
            disabled={step === "COMMITTING"}
          >
            Cancel
          </button>
          
          {/* FIX: Check both PREVIEW and COMMITTING so button stays visible during async call */}
          {(step === "PREVIEW" || step === "COMMITTING") && (
            <button
              onClick={handleCommit}
              disabled={preview?.summary.fail !== 0 || step === "COMMITTING"}
              className="
                px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] 
                text-sm font-medium
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2
              "
            >
              {step === "COMMITTING" ? "Importing..." : "Commit Import"}
              <CheckCircle size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}