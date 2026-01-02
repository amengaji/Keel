// keel-web/src/admin/audit/AuditTRBPage.tsx
//
// Keel — Audit Mode | TRB Review
// ----------------------------------------------------
// MODULE: 2.2D — Ghost Signature Timeline
// MODULE: 2.3A — Evidence Strength Indicator
// MODULE: 2.3B — Evidence Completeness Checklist
// MODULE: 2.3C — Watermark Metadata Preview (ADDED)
//
// PURPOSE:
// - Evidence-first TRB inspection
// - Independent officer signatures (Ghost Signature)
// - Explicit evidence quality signal
// - Checklist-based audit confirmation
// - Transparent watermark metadata preview
// - Read-only, trust-focused UX
//
// IMPORTANT:
// - No edits allowed in Audit Mode
// - No backend
// - All data is mock but structured for real audits

import { useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { useSignatureVault } from "../security/SignatureVaultContext";

/* -------------------------------------------------------------------------- */
/* Card Primitive                                                              */
/* -------------------------------------------------------------------------- */
function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        rounded-xl
        bg-[hsl(var(--card))]
        p-5
        shadow-[0_1px_2px_rgba(0,0,0,0.4),0_10px_28px_rgba(0,0,0,0.6)]
        ring-1 ring-white/10
      "
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Evidence Strength Types                                                     */
/* -------------------------------------------------------------------------- */
type EvidenceStrength = "strong" | "medium" | "weak";

/* -------------------------------------------------------------------------- */
/* Mock Audit Timeline Data (Ghost Signature)                                  */
/* -------------------------------------------------------------------------- */
const auditTimeline = [
  {
    label: "Cadet Submission",
    actor: "Rahul Sharma (Cadet)",
    date: "10 Jan 2026 · 21:40",
    note: "Evidence captured and report submitted",
  },
  {
    label: "CTO Signature",
    actor: "Chief Engineer",
    date: "12 Jan 2026 · 08:15",
    note: "Signed independently after task review",
  },
  {
    label: "Master Signature",
    actor: "Master",
    date: "14 Jan 2026 · 19:30",
    note: "Signed independently on bridge",
  },
  {
    label: "Record Verification",
    actor: "System",
    date: "18 Jan 2026 · 06:10",
    note: "Signatures verified and record finalized",
  },
];

/* -------------------------------------------------------------------------- */
/* Mock Task Data + Evidence Metadata                                          */
/* -------------------------------------------------------------------------- */
const task = {
  code: "1.1",
  title: "Maintain a safe navigational watch",
  report:
    "Performed lookout duties during night watch, monitored traffic using radar and visual bearings, and reported CPA to OOW.",

  evidence: {
    hasPhoto: true,
    hasVideo: false,
    hasGPS: true,
    hasTimestamp: true,
    hasCTOSignature: true,
    hasMasterSignature: true,

    watermark: {
      vesselName: "MV Ocean Pioneer",
      imoNumber: "IMO 9876543",
      latitude: "18.9321° N",
      longitude: "72.8347° E",
      utcTime: "10 Jan 2026 · 16:10 UTC",
      keelHash: "9F3A-D2E1-A7C4-B990",
    },
  },
};

/* -------------------------------------------------------------------------- */
/* Evidence Strength Evaluation                                                */
/* -------------------------------------------------------------------------- */
function evaluateEvidenceStrength(): EvidenceStrength {
  const e = task.evidence;

  if (
    (e.hasPhoto || e.hasVideo) &&
    e.hasGPS &&
    e.hasTimestamp &&
    e.hasCTOSignature &&
    e.hasMasterSignature
  ) {
    return "strong";
  }

  if (e.hasPhoto || e.hasVideo) {
    return "medium";
  }

  return "weak";
}

/* -------------------------------------------------------------------------- */
/* Evidence Strength Badge                                                     */
/* -------------------------------------------------------------------------- */
function EvidenceStrengthBadge({ strength }: { strength: EvidenceStrength }) {
  const map = {
    strong: {
      label: "Strong Evidence",
      className: "bg-green-500/10 text-green-500",
    },
    medium: {
      label: "Medium Evidence",
      className: "bg-yellow-500/10 text-yellow-400",
    },
    weak: {
      label: "Weak Evidence",
      className: "bg-red-500/10 text-red-500",
    },
  }[strength];

  return (
    <span
      className={`
        inline-flex items-center
        px-3 py-1.5
        rounded-full
        text-xs font-medium
        ${map.className}
      `}
    >
      {map.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Evidence Checklist Item                                                     */
/* -------------------------------------------------------------------------- */
function ChecklistItem({
  label,
  present,
}: {
  label: string;
  present: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <span
        className={
          present
            ? "text-green-500 font-medium"
            : "text-[hsl(var(--muted-foreground))]"
        }
      >
        {present ? "Present" : "Missing"}
      </span>
    </div>
  );
}

export function AuditTRBPage() {
  const [activeTaskId] = useState("t1");
  const { isUnlocked, unlockedRole } = useSignatureVault();
  const evidenceStrength = evaluateEvidenceStrength();

  function acknowledgeAudit() {
    if (!isUnlocked) {
      toast.error("Master or CTO signature required to acknowledge audit");
      return;
    }

    toast.success(`${unlockedRole} acknowledged the audit record (mock)`);
  }

  return (
    <div className="space-y-6">
      {/* ============================ HEADER ============================ */}
      <Card>
        <h1 className="text-xl font-semibold">
          Training Record Book — Audit Review
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Rahul Sharma · Deck Cadet · MV Ocean Pioneer · Jan–Jun 2026
        </p>
      </Card>

      {/* ============================ CONTENT ============================ */}
      <div className="grid grid-cols-[320px_1fr] gap-6">
        {/* LEFT — TASK INDEX */}
        <Card>
          <div className="text-sm font-semibold mb-3">
            Task Under Review
          </div>
          <div className="text-sm px-2 py-1 rounded-md bg-[hsl(var(--muted))]">
            {task.code} {task.title} ✅
          </div>
        </Card>

        {/* RIGHT — AUDIT DETAIL */}
        <div className="space-y-6">

          {/* ===================== EVIDENCE STRENGTH ===================== */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                Evidence Strength
              </div>
              <EvidenceStrengthBadge strength={evidenceStrength} />
            </div>

            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Derived from attached media, metadata, and officer verification.
            </p>
          </Card>

          {/* ===================== EVIDENCE CHECKLIST ===================== */}
          <Card>
            <div className="text-sm font-medium mb-3">
              Evidence Completeness Checklist
            </div>

            <div className="space-y-2">
              <ChecklistItem label="Photo Evidence" present={task.evidence.hasPhoto} />
              <ChecklistItem label="Video Evidence" present={task.evidence.hasVideo} />
              <ChecklistItem label="GPS Coordinates Logged" present={task.evidence.hasGPS} />
              <ChecklistItem label="Timestamp Captured" present={task.evidence.hasTimestamp} />
              <ChecklistItem label="CTO Signature" present={task.evidence.hasCTOSignature} />
              <ChecklistItem label="Master Signature" present={task.evidence.hasMasterSignature} />
            </div>
          </Card>

          {/* ===================== WATERMARK METADATA ===================== */}
          <Card>
            <div className="text-sm font-medium mb-3">
              Watermark Metadata (Preview)
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>Vessel Name</div>
              <div className="font-medium">{task.evidence.watermark.vesselName}</div>

              <div>IMO Number</div>
              <div className="font-medium">{task.evidence.watermark.imoNumber}</div>

              <div>Latitude</div>
              <div className="font-medium">{task.evidence.watermark.latitude}</div>

              <div>Longitude</div>
              <div className="font-medium">{task.evidence.watermark.longitude}</div>

              <div>UTC Timestamp</div>
              <div className="font-medium">{task.evidence.watermark.utcTime}</div>

              <div>Keel Record Hash</div>
              <div className="font-medium">{task.evidence.watermark.keelHash}</div>
            </div>

            <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
              This metadata is permanently embedded into captured evidence at the time of submission.
            </p>
          </Card>

          {/* PRIMARY EVIDENCE */}
          <Card>
            <div className="text-sm font-medium mb-2">
              Primary Evidence
            </div>
            <div className="h-48 rounded-md bg-[hsl(var(--muted))] flex items-center justify-center text-sm">
              Photo / Video Evidence (Watermarked)
            </div>
          </Card>

          {/* GHOST SIGNATURE TIMELINE */}
          <Card>
            <div className="text-sm font-medium mb-3">
              Verification Timeline
            </div>

            <ol className="space-y-4">
              {auditTimeline.map((item, index) => (
                <li key={index} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
                  <div className="text-sm">
                    <div className="font-medium">
                      {item.label}
                    </div>
                    <div className="text-[hsl(var(--muted-foreground))]">
                      {item.actor} · {item.date}
                    </div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      {item.note}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          {/* FINAL SEAL */}
          <Card>
            <div className="text-sm font-medium mb-2">
              Record Finalization
            </div>
            <div className="text-sm space-y-1">
              <div>Status: <strong>Finalized & Locked</strong></div>
              <div>Locked By: Shore Admin</div>
              <div>Date Locked: 18 Jan 2026</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                Hash: {task.evidence.watermark.keelHash} (mock)
              </div>
            </div>
          </Card>

          {/* AUDIT ACKNOWLEDGEMENT */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                Audit Acknowledgement
              </div>

              <button
                onClick={acknowledgeAudit}
                className="
                  px-4 py-2 rounded-md
                  bg-[hsl(var(--primary))]
                  text-[hsl(var(--primary-foreground))]
                  hover:opacity-90
                "
              >
                Acknowledge Audit
              </button>
            </div>

            {!isUnlocked && (
              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                Master or CTO signature required to acknowledge audit.
              </p>
            )}
          </Card>

          {/* CADET REPORT */}
          <Card>
            <div className="text-sm font-medium mb-1">
              Cadet Report (Reference)
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {task.report}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
