// keel-web/src/admin/pages/VesselImportModal.tsx
//
// Keel — Vessel Import Modal (UI Only, Preview-first)
// ----------------------------------------------------
// PURPOSE (STEP 1):
// - Modal UI to import Vessels via Excel
// - Upload -> Preview -> Commit (same workflow pattern as Cadet Import)
// - Defensive + toast-friendly
//
// IMPORTANT:
// - This UI assumes backend routes will exist later.
// - If backend is not ready, modal will show meaningful toasts (404/405 etc.)
//
// EXPECTED BACKEND ROUTES (Phase 3 Track):
// - GET  /api/v1/admin/imports/vessels/template
// - POST /api/v1/admin/imports/vessels/preview   (multipart/form-data, field name: file)
// - POST /api/v1/admin/imports/vessels/commit    (multipart/form-data, field name: file)
//
// EXCEL COLUMNS (strict, backend-enforced):
// - imo_number*     (required)
// - vessel_name*    (required)
// - vessel_type*    (required - should map to ship types taxonomy)
// - flag_state      (optional)
// - class_society   (optional)
//
// NOTE:
// - We do not parse Excel in the browser (audit-safe pattern; backend is authority).

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { X, Upload, FileDown, ShieldCheck, AlertTriangle } from "lucide-react";

type ImportRowStatus = "READY" | "READY_WITH_WARNINGS" | "SKIP" | "FAIL";

type PreviewRow = {
  row_number: number;
  status: ImportRowStatus;
  input?: Record<string, any>;
  normalized?: Record<string, any>;
  derived?: Record<string, any>;
  issues: string[];
};

type PreviewResult = {
  import_batch_id?: string;
  summary: {
    total: number;
    ready: number;
    ready_with_warnings: number;
    skip: number;
    fail: number;
  };
  rows: PreviewRow[];
  notes: string[];
};

type CommitResultRow = {
  row_number: number;
  preview_status: ImportRowStatus;
  commit_outcome: "CREATED" | "SKIPPED" | "FAILED";
  created_vessel_id?: number | null;
  imo_number?: string | null;
  vessel_name?: string | null;
  issues: string[];
};

type CommitResult = {
  import_batch_id?: string;
  summary: {
    total: number;
    created: number;
    skipped: number;
    fail: number;
    ready: number;
    ready_with_warnings: number;
  };
  results: CommitResultRow[];
  notes: string[];
};

type VesselImportModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void; // parent should refresh vessel list
};

function StatusPill({ status }: { status: ImportRowStatus }) {
  const base = "px-2.5 py-1 rounded-full text-xs font-medium inline-block";

  if (status === "READY") {
    return <span className={`${base} bg-green-500/10 text-green-600`}>READY</span>;
  }
  if (status === "READY_WITH_WARNINGS") {
    return (
      <span className={`${base} bg-yellow-500/10 text-yellow-700`}>
        READY • WARN
      </span>
    );
  }
  if (status === "SKIP") {
    return <span className={`${base} bg-slate-500/10 text-slate-600`}>SKIP</span>;
  }
  return <span className={`${base} bg-red-500/10 text-red-600`}>FAIL</span>;
}

function SummaryCard(props: {
  label: string;
  value: number;
  tone?: "neutral" | "ok" | "warn" | "danger";
}) {
  const tone = props.tone ?? "neutral";

  const toneClass =
    tone === "ok"
      ? "border-green-500/20 bg-green-500/5 text-green-700"
      : tone === "warn"
      ? "border-yellow-500/20 bg-yellow-500/5 text-yellow-800"
      : tone === "danger"
      ? "border-red-500/20 bg-red-500/5 text-red-700"
      : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))]";

  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <div className="text-xs opacity-80">{props.label}</div>
      <div className="text-lg font-semibold mt-1">{props.value}</div>
    </div>
  );
}

function downloadBlob(filename: string, blob: Blob) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function VesselImportModal({ open, onClose, onSuccess }: VesselImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);

  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);

  // Reset modal state when opened/closed (keeps UX predictable)
  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview(null);
      setCommitResult(null);
      setPreviewLoading(false);
      setCommitLoading(false);
      setTemplateLoading(false);
    }
  }, [open]);

  const hasPreview = !!preview;
  const hasCommit = !!commitResult;

  const canCommit = useMemo(() => {
    if (!preview) return false;
    const importable = (preview.summary.ready ?? 0) + (preview.summary.ready_with_warnings ?? 0);
    const hasFail = (preview.summary.fail ?? 0) > 0;
    // Policy B: allow commit even if importable === 0 (success no-op),
    // BUT if there are FAIL rows, we should block commit until fixed.
    if (hasFail) return false;
    return true;
  }, [preview]);

  const commitWillBeNoop = useMemo(() => {
    if (!preview) return false;
    const importable = (preview.summary.ready ?? 0) + (preview.summary.ready_with_warnings ?? 0);
    return importable === 0 && (preview.summary.fail ?? 0) === 0;
  }, [preview]);

  async function handleDownloadTemplate() {
    try {
      setTemplateLoading(true);

      const res = await fetch("/api/v1/admin/imports/vessels/template", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Template download failed (HTTP ${res.status})`);
      }

      const blob = await res.blob();
      downloadBlob("keel_vessel_import_template.xlsx", blob);

      toast.success("Template downloaded");
    } catch (err: any) {
      console.error("❌ Vessel template download failed:", err);
      toast.error(err?.message || "Unable to download template");
    } finally {
      setTemplateLoading(false);
    }
  }

  async function handlePreview() {
    if (!file) {
      toast.error("Please select an Excel file (.xlsx) first");
      return;
    }

    try {
      setPreviewLoading(true);
      setCommitResult(null);

      const form = new FormData();
      form.append("file", file);

      console.log("Uploading file:", file?.name, file?.size);


      const res = await fetch("/api/v1/admin/imports/vessels/preview", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || json?.success === false) {
        const message =
          json?.message ||
          `Preview failed (HTTP ${res.status}). If this is 404, backend route is not ready yet.`;
        throw new Error(message);
      }

      const data: PreviewResult = json?.data;

      setPreview(data);
      toast.success("Preview generated");
    } catch (err: any) {
      console.error("❌ Vessel import preview failed:", err);
      setPreview(null);
      toast.error(err?.message || "Unable to preview import");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleCommit() {
    if (!file) {
      toast.error("Please select an Excel file first");
      return;
    }

    if (!preview) {
      toast.error("Preview is required before commit");
      return;
    }

    if (!canCommit) {
      toast.error("Commit is blocked because some rows failed validation");
      return;
    }

    try {
      setCommitLoading(true);

      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/v1/admin/imports/vessels/commit", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || json?.success === false) {
        const message =
          json?.message ||
          `Commit failed (HTTP ${res.status}). If this is 404, backend route is not ready yet.`;
        throw new Error(message);
      }

      const data: CommitResult = json?.data;

      setCommitResult(data);

      // Policy B: success even if no-op
      const created = data?.summary?.created ?? 0;
      const skipped = data?.summary?.skipped ?? 0;

      if (created > 0) {
        toast.success(`Import committed: ${created} created (${skipped} skipped)`);
      } else {
        toast.success("Import committed: no new vessels created (all rows skipped)");
      }

      // Refresh parent list
      await onSuccess();
    } catch (err: any) {
      console.error("❌ Vessel import commit failed:", err);
      toast.error(err?.message || "Unable to commit import");
    } finally {
      setCommitLoading(false);
    }
  }

  function handleClose() {
    if (previewLoading || commitLoading || templateLoading) return;
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="
          w-full max-w-4xl
          rounded-lg
          bg-[hsl(var(--card))]
          border border-[hsl(var(--border))]
          shadow-lg
          overflow-hidden
        "
      >
        {/* ============================ HEADER ============================ */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            <h2 className="text-sm font-semibold">Import Vessels (Excel)</h2>
          </div>

          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-[hsl(var(--muted))]"
            aria-label="Close"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ============================ BODY ============================ */}
        <div className="p-4 space-y-4">
          {/* Top actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={templateLoading}
              className="
                inline-flex items-center gap-2
                px-3 py-2 rounded-md text-sm
                border border-[hsl(var(--border))]
                hover:bg-[hsl(var(--muted))]
                disabled:opacity-60
              "
              title="Download Excel template"
            >
              <FileDown size={16} />
              {templateLoading ? "Downloading…" : "Download Template"}
            </button>

            <div className="flex-1" />

            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              Upload → Preview → Commit (audit-safe)
            </div>
          </div>

          {/* File picker */}
          <div
            className="
              rounded-lg border border-[hsl(var(--border))]
              bg-[hsl(var(--card))]
              p-4
            "
          >
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  setPreview(null);
                  setCommitResult(null);
                }}
                className="text-sm"
                aria-label="Select Excel file"
              />

              <button
                type="button"
                onClick={handlePreview}
                disabled={!file || previewLoading || commitLoading}
                className="
                  inline-flex items-center gap-2
                  px-3 py-2 rounded-md text-sm
                  bg-[hsl(var(--primary))]
                  text-[hsl(var(--primary-foreground))]
                  hover:opacity-90
                  disabled:opacity-60
                "
                title="Preview import"
              >
                <Upload size={16} />
                {previewLoading ? "Previewing…" : "Preview"}
              </button>

              <button
                type="button"
                onClick={handleCommit}
                disabled={!file || !hasPreview || !canCommit || commitLoading || previewLoading}
                className="
                  inline-flex items-center gap-2
                  px-3 py-2 rounded-md text-sm
                  bg-emerald-600
                  text-white
                  hover:bg-emerald-500
                  disabled:opacity-60
                "
                title="Commit import"
              >
                {commitLoading ? "Committing…" : "Commit"}
              </button>
            </div>

            <div className="mt-3 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              Required columns: <span className="font-medium">imo_number</span>,{" "}
              <span className="font-medium">vessel_name</span>,{" "}
              <span className="font-medium">vessel_type</span>. Optional:{" "}
              <span className="font-medium">flag_state</span>,{" "}
              <span className="font-medium">class_society</span>.
            </div>
          </div>

          {/* Preview summary */}
          {preview && (
            <div className="rounded-lg border border-[hsl(var(--border))] p-4 bg-[hsl(var(--card))] space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">Preview Summary</div>
                  {preview.import_batch_id && (
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      Batch: <span className="font-mono">{preview.import_batch_id}</span>
                    </div>
                  )}
                </div>

                {commitWillBeNoop && (
                  <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-yellow-500/20 bg-yellow-500/5 text-yellow-800">
                    <AlertTriangle size={14} />
                    All rows will be skipped (commit = success no-op)
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <SummaryCard label="Total" value={preview.summary.total ?? 0} />
                <SummaryCard label="Ready" value={preview.summary.ready ?? 0} tone="ok" />
                <SummaryCard
                  label="Ready (Warn)"
                  value={preview.summary.ready_with_warnings ?? 0}
                  tone="warn"
                />
                <SummaryCard label="Skip" value={preview.summary.skip ?? 0} />
                <SummaryCard label="Fail" value={preview.summary.fail ?? 0} tone="danger" />
              </div>

              {Array.isArray(preview.notes) && preview.notes.length > 0 && (
                <div className="text-xs text-[hsl(var(--muted-foreground))] space-y-1">
                  {preview.notes.map((n, idx) => (
                    <div key={idx}>• {n}</div>
                  ))}
                </div>
              )}

              {/* Preview table */}
              <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))]">
                <table className="w-full text-sm">
                  <thead className="bg-[hsl(var(--muted))]">
                    <tr>
                      <th className="px-4 py-2 text-left">Row</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">IMO</th>
                      <th className="px-4 py-2 text-left">Vessel</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Issues</th>
                    </tr>
                  </thead>

                  <tbody>
                    {preview.rows.map((r) => {
                      const imo =
                        (r.normalized?.imo_number as string) ||
                        (r.input?.imo_number as string) ||
                        "—";
                      const vesselName =
                        (r.normalized?.vessel_name as string) ||
                        (r.input?.vessel_name as string) ||
                        "—";
                      const vesselType =
                        (r.normalized?.vessel_type as string) ||
                        (r.input?.vessel_type as string) ||
                        "—";

                      return (
                        <tr
                          key={r.row_number}
                          className="border-t border-[hsl(var(--border))]"
                        >
                          <td className="px-4 py-3 font-mono text-xs">{r.row_number}</td>
                          <td className="px-4 py-3">
                            <StatusPill status={r.status} />
                          </td>
                          <td className="px-4 py-3">{imo}</td>
                          <td className="px-4 py-3">{vesselName}</td>
                          <td className="px-4 py-3">{vesselType}</td>
                          <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">
                            {r.issues?.length ? r.issues.join(" • ") : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Commit result (if any) */}
              {hasCommit && commitResult && (
                <div className="pt-2 space-y-3">
                  <div className="text-sm font-semibold">Commit Result</div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <SummaryCard label="Total" value={commitResult.summary.total ?? 0} />
                    <SummaryCard
                      label="Created"
                      value={commitResult.summary.created ?? 0}
                      tone="ok"
                    />
                    <SummaryCard label="Skipped" value={commitResult.summary.skipped ?? 0} />
                    <SummaryCard
                      label="Fail"
                      value={commitResult.summary.fail ?? 0}
                      tone="danger"
                    />
                    <SummaryCard
                      label="Ready+Warn"
                      value={(commitResult.summary.ready ?? 0) + (commitResult.summary.ready_with_warnings ?? 0)}
                      tone="warn"
                    />
                  </div>

                  {Array.isArray(commitResult.notes) && commitResult.notes.length > 0 && (
                    <div className="text-xs text-[hsl(var(--muted-foreground))] space-y-1">
                      {commitResult.notes.map((n, idx) => (
                        <div key={idx}>• {n}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!preview && (
            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              Upload an Excel file and click <span className="font-medium">Preview</span>.
              You will see READY / SKIP / FAIL statuses per row before committing.
            </div>
          )}
        </div>

        {/* ============================ FOOTER ============================ */}
        <div className="px-4 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))] flex items-center justify-between">
          <div className="text-xs text-[hsl(var(--muted-foreground))]">
            Audit-safe: no writes happen until <span className="font-medium">Commit</span>.
          </div>

          <button
            onClick={handleClose}
            disabled={previewLoading || commitLoading || templateLoading}
            className="
              px-4 py-2 rounded-md text-sm
              border border-[hsl(var(--border))]
              bg-[hsl(var(--card))]
              hover:bg-[hsl(var(--muted))]
              disabled:opacity-60
            "
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
