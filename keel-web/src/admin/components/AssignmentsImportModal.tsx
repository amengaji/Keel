import { useState, useRef, useEffect } from "react";
import { X, UploadCloud, Download, AlertCircle, CheckCircle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

type AssignmentsImportModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

// Simplified Preview Types for UI
type PreviewRow = {
  row_number: number;
  status: "READY" | "FAIL";
  normalized: { email: string; vessel_imo: string; date_joined: string };
  issues: string[];
};

type PreviewData = {
  summary: { total: number; ready: number; fail: number };
  rows: PreviewRow[];
};

export function AssignmentsImportModal({ open, onClose, onSuccess }: AssignmentsImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"UPLOAD" | "PREVIEW" | "COMMITTING">("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  useEffect(() => {
    if (!open) { setStep("UPLOAD"); setFile(null); setPreview(null); }
  }, [open]);

  if (!open) return null;

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch(`/api/v1/admin/imports/assignments/template`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "keel_assignments_template.xlsx"; a.click();
    } catch { toast.error("Download failed"); }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    
    const fd = new FormData(); fd.append("file", f);
    try {
      setStep("PREVIEW");
      const res = await fetch(`/api/v1/admin/imports/assignments/preview`, {
        method: "POST", credentials: "include", body: fd
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setPreview(json.data);
    } catch (err: any) {
      toast.error(err.message); setStep("UPLOAD");
    }
  };

  const handleCommit = async () => {
    if (!file) return;
    setStep("COMMITTING");
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await fetch(`/api/v1/admin/imports/assignments/commit`, {
        method: "POST", credentials: "include", body: fd
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(json.data.message);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message); setStep("PREVIEW");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UploadCloud className="text-[hsl(var(--primary))]" size={20} /> Import Assignments
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === "UPLOAD" && (
            <div className="space-y-8">
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg flex justify-between">
                 <div>
                   <div className="font-medium text-blue-600">Step 1: Get Template</div>
                   <div className="text-sm text-[hsl(var(--muted-foreground))]">Requires valid Cadet Email and Vessel IMO.</div>
                 </div>
                 <button onClick={handleDownloadTemplate} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded flex items-center gap-2"><Download size={14}/> Download</button>
              </div>
              <div className="border-2 border-dashed border-[hsl(var(--border))] rounded-xl p-10 flex flex-col items-center justify-center gap-4">
                 <button onClick={() => fileRef.current?.click()} className="px-6 py-2 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] rounded-md font-medium">Select Excel File</button>
                 <input type="file" ref={fileRef} accept=".xlsx" className="hidden" onChange={handleFileSelect} />
              </div>
            </div>
          )}

          {(step === "PREVIEW" || step === "COMMITTING") && preview && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-[hsl(var(--muted))] rounded text-center"><div className="text-2xl font-bold">{preview.summary.total}</div><div className="text-xs uppercase">Total</div></div>
                <div className="p-3 bg-green-500/10 text-green-700 rounded text-center"><div className="text-2xl font-bold">{preview.summary.ready}</div><div className="text-xs uppercase">Ready</div></div>
                <div className="p-3 bg-red-500/10 text-red-700 rounded text-center"><div className="text-2xl font-bold">{preview.summary.fail}</div><div className="text-xs uppercase">Failed</div></div>
              </div>

              {preview.summary.fail > 0 && (
                <div className="bg-red-50 p-4 rounded text-sm text-red-700 max-h-32 overflow-y-auto">
                   <div className="font-bold mb-2 flex items-center gap-2"><AlertCircle size={16}/> Errors</div>
                   {preview.rows.filter(r => r.status === "FAIL").map(r => (
                     <div key={r.row_number}>Row {r.row_number}: {r.issues.join(", ")}</div>
                   ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[hsl(var(--border))] flex justify-end gap-3">
          <button onClick={onClose} disabled={step === "COMMITTING"} className="px-4 py-2 text-sm">Cancel</button>
          {(step === "PREVIEW" || step === "COMMITTING") && (
            <button onClick={handleCommit} disabled={preview?.summary.fail !== 0 || step === "COMMITTING"} className="px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-sm flex items-center gap-2">
              {step === "COMMITTING" ? "Importing..." : "Commit"} <CheckCircle size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}