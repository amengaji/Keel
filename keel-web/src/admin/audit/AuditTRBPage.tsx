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
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const { isUnlocked, unlockedRole } = useSignatureVault();
  const evidenceStrength = evaluateEvidenceStrength();

  // ---------------- AUDIT TIMELINE STATE ----------------
  // Clone static timeline into state so we can append final lock entry
  const [timeline, setTimeline] = useState(auditTimeline);

  // ---------------- RECORD LOCK STATE ----------------
  // Becomes true immediately after final lock
  const [isRecordLocked, setIsRecordLocked] = useState(false);


  const [confirmLock, setConfirmLock] = useState(false);


  const lockRecord = () => {
    // Append final lock entry to audit timeline
    setTimeline((prev) => [
      ...prev,
      {
        label: "Final Record Lock",
        actor: unlockedRole ?? "Authorized Officer",
        date: new Date().toLocaleString(),
        note: "Training Record Book permanently sealed",
      },
    ]);

    toast.success(
      `TRB locked successfully. Hash ${task.evidence.watermark.keelHash} confirmed.`
    );

    // Switch UI into locked state
    setConfirmLock(false);
    setIsRecordLocked(true);
  };



  function acknowledgeAudit() {
    if (!isUnlocked) {
      toast.error("Master or CTO signature required to acknowledge audit");
      return;
    }

    toast.success(`${unlockedRole} acknowledged the audit record (mock)`);
  }

return (
  <div className="relative">
    {/* ==================== SEALED OVERLAY ==================== */}
    {isRecordLocked && (
      <div
        className="
          absolute inset-0 z-40
          bg-black/40
          pointer-events-none
        "
        aria-hidden
      />
    )}

    {/* ==================== MAIN CONTENT ==================== */}
    <div
      className={[
        "space-y-6 transition-opacity",
        isRecordLocked ? "opacity-60" : "opacity-100",
      ].join(" ")}
    >

      {/* ============================ AUDIT HEADER ============================ */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          {/* Left — Context */}
          <div>
            <h1 className="text-xl font-semibold">
              Training Record Book — Audit Review
            </h1>

            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              Rahul Sharma · Deck Cadet · MV Ocean Pioneer · Jan–Jun 2026
            </p>
          </div>

          {/* Right — Back to Audit Queue */}
          <button
            onClick={() => navigate("/admin/audit-mode")}
            className="
              text-sm
              px-3 py-1.5
              rounded-md
              border border-[hsl(var(--border))]
              hover:bg-[hsl(var(--muted))]
            "
            aria-label="Back to audit queue"
          >
            ← Back to Audit Queue
          </button>
        </div>
      </Card>

      {/* ====================== AUTHORITY CONTEXT ====================== */}
      <Card>
        <div className="text-sm font-medium mb-2">
          Audit Authority Context
        </div>

        <div className="text-sm space-y-1">
          {isUnlocked ? (
            <>
              <div>
                Acting Authority:{" "}
                <strong>{unlockedRole}</strong>
              </div>

              {isRecordLocked ? (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  This Training Record Book has already been finalized and permanently
                  locked. No further acknowledgements or actions are permitted.
                </p>
              ) : unlockedRole === "CTO" ? (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  CTO may review evidence and acknowledge audit findings, but cannot
                  finalize or permanently lock the Training Record Book.
                </p>
              ) : (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  You are authorized to perform final TRB lock after verification.
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              No authority unlocked. Review-only mode active.
            </p>
          )}
        </div>

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
              {timeline.map((item, index) => (
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

          {/* FINAL SEAL — READ-ONLY */}
          {isRecordLocked && (
            <Card>
              <div className="text-sm font-medium mb-2">
                Record Finalization
              </div>

              <div className="text-sm space-y-1">
                <div>
                  Status: <strong className="text-green-500">Finalized & Locked</strong>
                </div>
                <div>Locked By: Shore Admin</div>
                <div>Date Locked: 18 Jan 2026</div>

                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                  Immutable Hash: {task.evidence.watermark.keelHash} (mock)
                </div>
              </div>

              <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
                This Training Record Book has been permanently sealed.
                No further modifications or endorsements are possible.
              </p>
            </Card>
            
          )}

          {/* ================= AUDIT EXPORT & PRINT ================= */}
{isRecordLocked && (
  <Card>
    <div className="text-sm font-medium mb-3">
      Audit Export & Evidence Pack
    </div>

    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
      Export this sealed Training Record Book for submission to MMD,
      Flag State, or internal compliance review.
    </p>

    {/* Included items */}
    <ul className="text-sm space-y-1 mb-4">
      <li>✔ Cadet details & service period</li>
      <li>✔ Task completion summary</li>
      <li>✔ Evidence metadata & hashes</li>
      <li>✔ Verification timeline</li>
      <li>✔ Final lock authority & timestamp</li>
    </ul>

    {/* Actions */}
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() =>
          toast.message("PDF export will be available in Phase 3")
        }
        className="
          px-4 py-2 rounded-md
          border border-[hsl(var(--border))]
          hover:bg-[hsl(var(--muted))]
        "
      >
        Export Audit Summary (PDF)
      </button>

      <button
        onClick={() =>
          toast.message("Evidence pack export will be available in Phase 3")
        }
        className="
          px-4 py-2 rounded-md
          border border-[hsl(var(--border))]
          hover:bg-[hsl(var(--muted))]
        "
      >
        Export Full Evidence Pack
      </button>
    </div>

    <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
      Exports reflect the sealed state of the record and cannot be modified.
    </p>
  </Card>
)}


          {/* FINALIZATION — UNLOCKED RECORD */}
          {!isRecordLocked && (
            <Card>
              <div className="text-sm font-medium mb-3">
                Record Finalization
              </div>

              {/* Eligibility checklist — read-only indicators */}
              <ul className="text-sm space-y-1 mb-4">
                <li>✔ Evidence present</li>
                <li>✔ CTO signature verified</li>
                <li>✔ Master signature pending</li>
                <li>✔ Audit timeline complete</li>
              </ul>

              {/* Authority-gated actions */}
              {isUnlocked ? (
                unlockedRole === "CTO" ? (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    CTO may review and acknowledge this record but is not authorized
                    to perform final lock.
                  </p>
                ) : (
                  <>
                    {!confirmLock ? (
                      <button
                        onClick={() => setConfirmLock(true)}
                        className="
                          px-4 py-2 rounded-md
                          bg-red-600 text-white
                          hover:opacity-90
                        "
                      >
                        Lock TRB Permanently
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-red-500">
                          This action is irreversible. Confirm final lock?
                        </p>

                        <div className="flex gap-2">
                          <button
                            onClick={lockRecord}
                            className="px-4 py-2 rounded-md bg-red-600 text-white"
                          >
                            Yes, Lock Now
                          </button>

                          <button
                            onClick={() => setConfirmLock(false)}
                            className="px-4 py-2 rounded-md border"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )
              ) : (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Unlock Master, Chief Engineer, or Shore authority to perform final lock.
                </p>
              )}
            </Card>
          )}



          {/* AUDIT ACKNOWLEDGEMENT */}
          {isUnlocked && !isRecordLocked && unlockedRole === "CTO" && (
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

            
              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                Master or CTO signature required to acknowledge audit.
              </p>
            
          </Card>
          )}

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
    </div>
  );
}
