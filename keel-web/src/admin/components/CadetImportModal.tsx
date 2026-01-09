// keel-web/src/admin/components/CadetImportModal.tsx
//
// Keel — Cadet Import Modal (Excel)
// ----------------------------------------------------
// PURPOSE:
// - Admin-only import of Cadets/Ratings from Excel (.xlsx)
// - Preview-first (no writes) → then Commit (transactional)
// - Matches backend contract:
//   - GET  /api/v1/admin/imports/cadets/template
//   - POST /api/v1/admin/imports/cadets/preview
//   - POST /api/v1/admin/imports/cadets/commit
//
// UX RULES:
// - Preview is mandatory before commit
// - Commit disabled if FAIL > 0
// - Commit disabled if (READY + READY_WITH_WARNINGS) == 0
// - No-op commits (all SKIP) are treated as success (Policy B)
//
// THEMING:
// - Uses hsl(var(--...)) tokens so it respects light/dark mode automatically
//
// TOASTS:
// - Uses sonner toast (consistent with existing AdminCadetsPage)
//
// SAFETY:
// - Does NOT edit rows in UI (audit-safe)
// - No partial commits, no forced imports

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Upload,
  Download,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Info,
  BadgeCheck,
  BadgeAlert,
  Ban,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types (match backend responses)                                            */
/* -------------------------------------------------------------------------- */

type PreviewRowStatus = "READY" | "READY_WITH_WARNINGS" | "SKIP" | "FAIL";

type PreviewRow = {
  row_number: number;
  status: PreviewRowStatus;
  normalized: {
    full_name: string | null;
    email: string | null;
    trainee_type: string | null;
    nationality: string | null;
    notes: string | null;
    rank_label: string | null;
    category: string | null;
    trb_applicable: boolean | null;
  };
  derived: {
    rank_label: string | null;
    category: string | null;
    trb_applicable: boolean | null;
  };
  issues: string[];
};

type PreviewResult = {
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

type CommitRowResult = {
  row_number: number;
  preview_status: PreviewRowStatus;
  commit_outcome: "CREATED" | "SKIPPED";
  created_user_id: number | null;
  email: string | null;
  full_name: string | null;
  issues: string[];
};

type CommitResult = {
  import_batch_id: string;
  summary: {
    total: number;
    created: number;
    skipped: number;
    fail: number;
    ready: number;
    ready_with_warnings: number;
  };
  results: CommitRowResult[];
  notes: string[];
};

/* -------------------------------------------------------------------------- */
/* Props                                                                      */
/* -------------------------------------------------------------------------- */

type CadetImportModalProps = {
  open: boolean;
  onCancel: () => void;

  /**
   * Called after a successful commit (including no-op success).
   * Parent can use this to refresh the cadets list.
   */
  onCommitted?: () => void;
};

/* -------------------------------------------------------------------------- */
/* Small UI helpers                                                           */
/* -------------------------------------------------------------------------- */

function statusPill(status: PreviewRowStatus) {
  // Color tokens chosen to work in light/dark without hardcoding theme styles
  switch (status) {
    case "READY":
      return {
        label: "READY",
        icon: <BadgeCheck className="h-4 w-4" />,
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/30",
      };
    case "READY_WITH_WARNINGS":
      return {
        label: "WARNINGS",
        icon: <BadgeAlert className="h-4 w-4" />,
        className:
          "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/15 dark:text-amber-200 dark:border-amber-900/30",
      };
    case "SKIP":
      return {
        label: "SKIP",
        icon: <Ban className="h-4 w-4" />,
        className:
          "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-200 dark:border-gray-700",
      };
    case "FAIL":
      return {
        label: "FAIL",
        icon: <AlertTriangle className="h-4 w-4" />,
        className:
          "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30",
      };
  }
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function CadetImportModal({ open, onCancel, onCommitted }: CadetImportModalProps) {
  const [file, setFile] = useState<File | null>(null);

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);

  const [isCommitting, setIsCommitting] = useState(false);
  const [commit, setCommit] = useState<CommitResult | null>(null);

  // UX: Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (open && e.key === "Escape" && !isPreviewing && !isCommitting) {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, isPreviewing, isCommitting, onCancel]);

  // Reset state when modal opens/closes (keeps UX predictable)
  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview(null);
      setCommit(null);
      setIsPreviewing(false);
      setIsCommitting(false);
    }
  }, [open]);

  const canPreview = useMemo(() => {
    if (!file) return false;
    if (isPreviewing || isCommitting) return false;
    return true;
  }, [file, isPreviewing, isCommitting]);

  const canCommit = useMemo(() => {
    if (!preview) return false;
    if (isPreviewing || isCommitting) return false;

    const { fail, ready, ready_with_warnings } = preview.summary;
    if (fail > 0) return false;
    if (ready + ready_with_warnings <= 0) return false;

    return true;
  }, [preview, isPreviewing, isCommitting]);

  if (!open) return null;

  /* ---------------------------------------------------------------------- */
  /* Handlers                                                               */
  /* ---------------------------------------------------------------------- */

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;

    if (!picked) return;

    // Simple client validation: allow only .xlsx (backend is authoritative anyway)
    const name = picked.name.toLowerCase();
    if (!name.endsWith(".xlsx")) {
      toast.error("Please select an Excel .xlsx file");
      e.target.value = "";
      return;
    }

    setFile(picked);
    setPreview(null);
    setCommit(null);
  }

  async function downloadTemplate() {
    try {
      // Download as a blob and force a browser download
      const res = await fetch("/api/v1/admin/imports/cadets/template", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Template download failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "keel_cadet_import_template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Template downloaded");
    } catch (err: any) {
      console.error("❌ Template download failed:", err);
      toast.error(err?.message || "Unable to download template");
    }
  }

  async function runPreview() {
    if (!file) {
      toast.error("Please select an Excel file first");
      return;
    }

    setIsPreviewing(true);
    setPreview(null);
    setCommit(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/v1/admin/imports/cadets/preview", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = json?.message || `Preview failed (${res.status})`;
        throw new Error(msg);
      }

      setPreview(json?.data as PreviewResult);

      const s = (json?.data as PreviewResult)?.summary;
      if (s?.fail > 0) {
        toast.error("Preview completed with validation errors. Fix Excel and re-upload.");
      } else if ((s?.ready ?? 0) + (s?.ready_with_warnings ?? 0) > 0) {
        toast.success("Preview ready. Review rows, then commit.");
      } else {
        // all SKIP (valid but no importable rows)
        toast.success("Preview completed. No new cadets to import (all rows are skipped).");
      }
    } catch (err: any) {
      console.error("❌ Preview failed:", err);
      toast.error(err?.message || "Unable to preview import");
      setPreview(null);
    } finally {
      setIsPreviewing(false);
    }
  }

  async function runCommit() {
    if (!file) {
      toast.error("Please select an Excel file first");
      return;
    }

    if (!preview) {
      toast.error("Preview is required before commit");
      return;
    }

    setIsCommitting(true);
    setCommit(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/v1/admin/imports/cadets/commit", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = json?.message || `Commit failed (${res.status})`;
        throw new Error(msg);
      }

      const data = json?.data as CommitResult;
      setCommit(data);

      // Toast outcomes (maritime-grade, admin-friendly)
      const created = data?.summary?.created ?? 0;
      const skipped = data?.summary?.skipped ?? 0;

      if (created > 0) {
        toast.success(`Import completed. ${created} created, ${skipped} skipped.`);
      } else {
        toast.success("Import completed. All cadets already exist (no changes made).");
      }

      // Notify parent so it can refresh list (if it wants)
      onCommitted?.();
    } catch (err: any) {
      console.error("❌ Commit failed:", err);
      toast.error(err?.message || "Unable to commit import");
      setCommit(null);
    } finally {
      setIsCommitting(false);
    }
  }

  /* ---------------------------------------------------------------------- */

  const summary = preview?.summary ?? null;

  return (
    <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* BACKDROP (click to close if not busy) */}
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={!isPreviewing && !isCommitting ? onCancel : undefined}
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          {/* MODAL PANEL */}
          <div
            className="
              relative transform overflow-hidden rounded-2xl
              bg-[hsl(var(--card,255,100%,100%))] text-left shadow-2xl
              transition-all
              animate-in zoom-in-95 slide-in-from-bottom-5 duration-200
              sm:my-8 sm:w-full sm:max-w-5xl
              border border-[hsl(var(--border,220,13%,91%))]
            "
          >
            {/* CLOSE BUTTON */}
            <div className="absolute right-4 top-4">
              <button
                type="button"
                disabled={isPreviewing || isCommitting}
                onClick={onCancel}
                className="
                  rounded-md bg-transparent text-[hsl(var(--muted-foreground))]
                  hover:text-[hsl(var(--foreground))]
                  focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]
                  focus:ring-offset-2
                  disabled:opacity-50
                  transition-colors
                "
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* HEADER */}
            <div className="px-6 pt-8 pb-4">
              <div className="flex items-start gap-3">
                <div
                  className="
                    mt-0.5 flex h-12 w-12 items-center justify-center rounded-full
                    bg-[hsl(var(--muted))]
                    border border-[hsl(var(--border))]
                  "
                >
                  <FileSpreadsheet className="h-6 w-6 text-[hsl(var(--primary))]" />
                </div>

                <div className="w-full">
                  <h3
                    className="text-lg font-semibold leading-6 text-[hsl(var(--foreground))]"
                    id="modal-title"
                  >
                    Import Cadets from Excel
                  </h3>

                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    Preview is mandatory. No records are written until you confirm the commit.
                  </p>
                </div>
              </div>

              {/* Notice */}
              <div className="mt-4 rounded-md bg-blue-50 dark:bg-blue-900/10 p-3 border border-blue-100 dark:border-blue-900/20">
                <div className="flex gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                    This import creates <span className="font-semibold">cadet identity</span> only
                    (users + role). It does not assign vessels and does not touch TRB progress.
                  </p>
                </div>
              </div>
            </div>

            {/* BODY */}
            <div className="px-6 pb-6 space-y-5">
              {/* TEMPLATE + FILE PICKER */}
              <div
                className="
                  rounded-xl border border-[hsl(var(--border))]
                  bg-[hsl(var(--card))]
                  p-4
                "
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                      Step 1: Download template and upload completed Excel
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Accepted format: .xlsx (single sheet)
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      disabled={isPreviewing || isCommitting}
                      className="
                        inline-flex items-center justify-center gap-2
                        px-3 py-2 rounded-lg
                        bg-[hsl(var(--muted))]
                        text-[hsl(var(--foreground))]
                        hover:opacity-90
                        border border-[hsl(var(--border))]
                        disabled:opacity-60 disabled:cursor-not-allowed
                      "
                    >
                      <Download className="h-4 w-4" />
                      Download Template
                    </button>

                    <label
                      className="
                        inline-flex items-center justify-center gap-2
                        px-3 py-2 rounded-lg
                        bg-[hsl(var(--primary))]
                        text-[hsl(var(--primary-foreground))]
                        hover:opacity-90
                        cursor-pointer
                        disabled:opacity-60
                      "
                    >
                      <Upload className="h-4 w-4" />
                      Choose Excel
                      <input
                        type="file"
                        accept=".xlsx"
                        className="hidden"
                        onChange={onPickFile}
                        disabled={isPreviewing || isCommitting}
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
                  Selected file:{" "}
                  <span className="font-medium text-[hsl(var(--foreground))]">
                    {file ? file.name : "None"}
                  </span>
                </div>
              </div>

              {/* PREVIEW ACTION */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={runPreview}
                  disabled={!canPreview}
                  className="
                    inline-flex items-center justify-center gap-2
                    px-4 py-2.5 rounded-lg
                    bg-[hsl(var(--primary))]
                    text-[hsl(var(--primary-foreground))]
                    hover:opacity-90
                    disabled:opacity-60 disabled:cursor-not-allowed
                    w-full sm:w-auto
                  "
                >
                  {isPreviewing ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Validating…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Preview Import
                    </>
                  )}
                </button>

                {/* Commit helper text */}
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Step 2: Review preview. Step 3: Commit when ready.
                </p>
              </div>

              {/* SUMMARY */}
              {summary && (
                <div
                  className="
                    rounded-xl border border-[hsl(var(--border))]
                    bg-[hsl(var(--card))]
                    p-4
                  "
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-medium text-[hsl(var(--foreground))]">
                      Preview Summary
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-2 py-1 rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/30">
                        READY: {summary.ready}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-md border bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/15 dark:text-amber-200 dark:border-amber-900/30">
                        WARNINGS: {summary.ready_with_warnings}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-md border bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-200 dark:border-gray-700">
                        SKIP: {summary.skip}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-md border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30">
                        FAIL: {summary.fail}
                      </span>
                    </div>
                  </div>

                  {/* Validation alert */}
                  {summary.fail > 0 && (
                    <div className="mt-3 rounded-md bg-red-50 dark:bg-red-900/10 p-3 border border-red-100 dark:border-red-900/20">
                      <div className="flex gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <p className="text-xs text-red-700 dark:text-red-300 font-medium leading-relaxed">
                          Some rows failed validation. Fix the Excel file and re-upload. Commit is disabled until FAIL is 0.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PREVIEW TABLE */}
              {preview && (
                <div
                  className="
                    rounded-xl border border-[hsl(var(--border))]
                    bg-[hsl(var(--card))]
                    overflow-hidden
                  "
                >
                  <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                      Preview Rows
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      Rows are read-only. Status and issues are computed by backend rules.
                    </p>
                  </div>

                  <div className="max-h-90 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[hsl(var(--muted))] sticky top-0 z-10">
                        <tr className="text-left">
                          <th className="px-4 py-2 w-17.5">Row</th>
                          <th className="px-4 py-2">Name</th>
                          <th className="px-4 py-2">Email</th>
                          <th className="px-4 py-2 w-40">Trainee Type</th>
                          <th className="px-4 py-2 w-35">Status</th>
                          <th className="px-4 py-2">Issues</th>
                        </tr>
                      </thead>

                      <tbody>
                        {preview.rows.map((r) => {
                          const pill = statusPill(r.status);
                          return (
                            <tr
                              key={r.row_number}
                              className="border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
                            >
                              <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                                {r.row_number}
                              </td>

                              <td className="px-4 py-3 font-medium">
                                {r.normalized.full_name ?? "—"}
                              </td>

                              <td className="px-4 py-3">
                                {r.normalized.email ?? "—"}
                              </td>

                              <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                                {r.normalized.trainee_type ?? "—"}
                              </td>

                              <td className="px-4 py-3">
                                <span
                                  className={[
                                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-semibold",
                                    pill.className,
                                  ].join(" ")}
                                >
                                  {pill.icon}
                                  {pill.label}
                                </span>
                              </td>

                              <td className="px-4 py-3">
                                {r.issues?.length ? (
                                  <ul className="list-disc pl-5 space-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                                    {r.issues.map((x, idx) => (
                                      <li key={idx}>{x}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                    —
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* COMMIT RESULT (optional display) */}
              {commit && (
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                      Commit Result
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Batch ID: <span className="font-mono">{commit.import_batch_id}</span>
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/30">
                      CREATED: {commit.summary.created}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-md border bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-200 dark:border-gray-700">
                      SKIPPED: {commit.summary.skipped}
                    </span>
                  </div>

                  {commit.notes?.length ? (
                    <ul className="mt-3 list-disc pl-5 space-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                      {commit.notes.map((n, idx) => (
                        <li key={idx}>{n}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}
            </div>

            {/* ACTION FOOTER (matches ConfirmDeleteModal style) */}
            <div className="bg-[hsl(var(--muted,240,5%,96%))] px-6 py-4 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
              <button
                type="button"
                disabled={!canCommit}
                onClick={runCommit}
                className="
                  inline-flex w-full justify-center items-center gap-2 rounded-lg
                  bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold
                  text-[hsl(var(--primary-foreground))] shadow-sm
                  hover:opacity-90
                  focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]
                  focus:ring-offset-2
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-all active:scale-[0.98]
                  sm:ml-3 sm:w-auto
                "
              >
                {isCommitting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Committing…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Commit Import
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isPreviewing || isCommitting}
                onClick={onCancel}
                className="
                  mt-3 inline-flex w-full justify-center rounded-lg
                  bg-white dark:bg-transparent px-4 py-2.5 text-sm font-semibold
                  text-gray-900 dark:text-gray-100
                  shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  disabled:opacity-50
                  transition-all
                  sm:mt-0 sm:w-auto
                "
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
