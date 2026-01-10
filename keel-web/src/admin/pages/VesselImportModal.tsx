// keel-web/src/admin/pages/VesselImportModal.tsx
//
// Keel — Vessel Import Modal (STEP 4: Post-Commit UX Hardening)
// -------------------------------------------------------------
// PURPOSE:
// - Preview-first, audit-safe Vessel import via Excel
// - STEP 4 focuses ONLY on UX correctness after commit
//
// KEY STEP 4 BEHAVIOUR:
// - Clear commit result message (incl. success no-op)
// - Reset file + preview after commit
// - Keep commit result visible
// - Disable re-commit until a new file is selected
// - Single, disciplined success toast
//
// IMPORTANT:
// - Backend logic is NOT changed
// - No redesign, only UX refinement
// - Light/Dark mode preserved

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  X,
  Upload,
  FileDown,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types (Defensive — mirrors backend)                                         */
/* -------------------------------------------------------------------------- */

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
  notes: string[];
};

/* -------------------------------------------------------------------------- */
/* Props                                                                       */
/* -------------------------------------------------------------------------- */

type VesselImportModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void; // parent refresh (MANDATORY)
};

/* -------------------------------------------------------------------------- */
/* Small UI helpers                                                            */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Main Component                                                              */
/* -------------------------------------------------------------------------- */

export function VesselImportModal({
  open,
  onClose,
  onSuccess,
}: VesselImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ============================== STATE ================================== */

  const [file, setFile] = useState<File | null>(null);

  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);

  /* ============================== RESET ================================== */
  // When modal closes, reset EVERYTHING (predictable UX)
  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview(null);
      setCommitResult(null);
      setPreviewLoading(false);
      setCommitLoading(false);
      setTemplateLoading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  /* ============================== DERIVED ================================= */

  const canCommit = useMemo(() => {
    if (!preview) return false;
    if ((preview.summary.fail ?? 0) > 0) return false;
    return true;
  }, [preview]);

  const commitWillBeNoop = useMemo(() => {
    if (!preview) return false;
    const importable =
      (preview.summary.ready ?? 0) +
      (preview.summary.ready_with_warnings ?? 0);
    return importable === 0 && (preview.summary.fail ?? 0) === 0;
  }, [preview]);

  /* ============================== HANDLERS ================================ */

  async function handleDownloadTemplate() {
    try {
      setTemplateLoading(true);

      const res = await fetch("/api/v1/admin/imports/vessels/template", {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Unable to download template");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "keel_vessel_import_template.xlsx";
      a.click();

      URL.revokeObjectURL(url);

      toast.success("Template downloaded");
    } catch (err: any) {
      toast.error(err?.message || "Template download failed");
    } finally {
      setTemplateLoading(false);
    }
  }

  async function handlePreview() {
    if (!file) {
      toast.error("Please select an Excel file first");
      return;
    }

    try {
      setPreviewLoading(true);
      setCommitResult(null); // important: discard old commit result

      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/v1/admin/imports/vessels/preview", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const json = await res.json();

      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || "Preview failed");
      }

      setPreview(json.data);
      toast.success("Preview generated");
    } catch (err: any) {
      setPreview(null);
      toast.error(err?.message || "Unable to preview import");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleCommit() {
    if (!file || !preview || !canCommit) return;

    try {
      setCommitLoading(true);

      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/v1/admin/imports/vessels/commit", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const json = await res.json();

      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || "Commit failed");
      }

      const data: CommitResult = json.data;

      /* ---------------- STEP 4: STATE DISCIPLINE ---------------- */
      setCommitResult(data); // keep result visible
      setPreview(null); // clear preview
      setFile(null); // clear file

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // SINGLE success toast only
      if ((data.summary.created ?? 0) > 0) {
        toast.success("Vessels imported successfully");
      } else {
        toast.success("No new vessels created — all rows already exist");
      }

      // Parent refresh (MANDATORY)
      await onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Unable to commit import");
    } finally {
      setCommitLoading(false);
    }
  }

  if (!open) return null;

  /* ============================== RENDER ================================ */

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            <h2 className="text-sm font-semibold">Import Vessels (Excel)</h2>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-[hsl(var(--muted))]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadTemplate}
              disabled={templateLoading}
              className="px-3 py-2 rounded-md border border-[hsl(var(--border))] text-sm hover:bg-[hsl(var(--muted))] disabled:opacity-60"
            >
              <FileDown size={16} className="inline mr-1" />
              {templateLoading ? "Downloading…" : "Download Template"}
            </button>

            <div className="flex-1" />

            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              Upload → Preview → Commit
            </span>
          </div>

          {/* File Picker */}
          <div className="rounded-lg border border-[hsl(var(--border))] p-4">
            <div className="flex items-center gap-3">
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
              />

              <button
                onClick={handlePreview}
                disabled={!file || previewLoading || commitLoading}
                className="px-3 py-2 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm disabled:opacity-60"
              >
                <Upload size={16} className="inline mr-1" />
                {previewLoading ? "Previewing…" : "Preview"}
              </button>

              <button
                onClick={handleCommit}
                disabled={!file || !preview || !canCommit || commitLoading}
                className="px-3 py-2 rounded-md bg-emerald-600 text-white text-sm disabled:opacity-60"
              >
                {commitLoading ? "Committing…" : "Commit"}
              </button>
            </div>
          </div>

          {/* Commit Result Banner */}
          {commitResult && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 flex items-start gap-2 text-sm text-green-700">
              <CheckCircle2 size={16} className="mt-0.5" />
              {(commitResult.summary.created ?? 0) > 0
                ? "Import completed successfully."
                : "No new vessels created — all rows already exist."}
            </div>
          )}

          {/* Commit Summary */}
          {commitResult && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <SummaryCard label="Total" value={commitResult.summary.total} />
              <SummaryCard
                label="Created"
                value={commitResult.summary.created}
                tone="ok"
              />
              <SummaryCard label="Skipped" value={commitResult.summary.skipped} />
              <SummaryCard
                label="Fail"
                value={commitResult.summary.fail}
                tone="danger"
              />
              <SummaryCard
                label="Ready+Warn"
                value={
                  commitResult.summary.ready +
                  commitResult.summary.ready_with_warnings
                }
                tone="warn"
              />
            </div>
          )}

          {/* Preview Summary */}
          {preview && (
            <div className="rounded-lg border border-[hsl(var(--border))] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Preview Summary</div>

                {commitWillBeNoop && (
                  <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border border-yellow-500/20 bg-yellow-500/5 text-yellow-800">
                    <AlertTriangle size={14} />
                    All rows will be skipped
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <SummaryCard label="Total" value={preview.summary.total} />
                <SummaryCard
                  label="Ready"
                  value={preview.summary.ready}
                  tone="ok"
                />
                <SummaryCard
                  label="Ready (Warn)"
                  value={preview.summary.ready_with_warnings}
                  tone="warn"
                />
                <SummaryCard
                  label="Skip"
                  value={preview.summary.skip}
                />
                <SummaryCard
                  label="Fail"
                  value={preview.summary.fail}
                  tone="danger"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))] flex justify-between">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            Audit-safe: no writes until Commit
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm hover:bg-[hsl(var(--muted))]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
