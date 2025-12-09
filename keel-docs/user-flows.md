KEEL — User Flows (Complete System Walkthrough)

This document describes every major user journey within Keel, across mobile (cadets) and web (officers, masters, shore staff, admins).
It ensures UI, backend logic, and offline sync all follow one unified blueprint.

──────────────────────────────────────
1. CADET APP USER FLOWS (MOBILE)
──────────────────────────────────────

Cadet uses Keel primarily on mobile/tablet, often offline.

1.1 First-Time App Onboarding
Flow:

Cadet installs Keel app.

Opens app → sees animated welcome screen.

Screen 1: “What is Keel?”

Screen 2: “Your Digital Training Record Book”

Screen 3: Permissions screen:

Camera

Notifications

Biometric authentication

Cadet taps “Continue”

Redirect → Login screen

Outcomes:

App sets onboarding_completed = true

App stores whether device supports biometrics

1.2 Login + Biometrics Setup
Flow:

Cadet enters email + password

App calls /auth/login

On success:

Access + Refresh token saved securely

App asks:
“Would you like to enable biometric login?”

If yes:

Store biometric_enabled = true

Store secure biometric token

Next login → cadet taps “Login with Face ID/Fingerprint”.

1.3 Ship-Joining Flow

Triggered when backend assigns a new vessel to cadet.

Flow:

Cadet logs in → server responds with:

current_vessel or “You have a new vessel assigned”

App shows Ship Joining Onboarding Wizard:

Step 1 — Vessel Summary

Name

IMO

Ship type

Photo (if available)

Step 2 — Ship Particulars

Pulled from vessel data:

Gross tonnage

Length overall

Engine details

Safety equipment

Fire plan

Step 3 — Tasks Required

Mandatory tasks (universal)

Ship-type specific tasks (auto-filtered)

Step 4 — Familiarisation Checklist Preview
Step 5 — Confirm “Join Vessel”

Cadet confirms →
App triggers /vessel-assignment update.

1.4 Ship Familiarisation Flow

Follows company / STCW familiarisation procedures.

Flow:

App loads familiarisation template for vessel’s ship type

Checklist displayed step-by-step

For each item:

Cadet marks completed

Evidence (optional photo)

Completion stored locally if offline

When online → sync to backend

CTO/Master later sign off items on web

1.5 Task Workflow (Cadet Perspective)
Flow:

Cadet sees task list grouped by:

Part (1, 2, 3…)

Section

Ship-type tasks highlighted

Tap a task → opens Task Detail:

Title, description

STCW reference

Attachments

Notes field

Completing a task:

Cadet adds optional notes + photos

Tap “Submit to CTO”

Task status → submitted_to_cto

Notification sent to CTO (when online)

Offline case:

Stored in SyncQueue

Status updates once synced

1.6 Diaries (Daily, Bridge, Engine Watch)
Flow:

Cadet opens Diary tab

Select diary type

Enter date & free text

Save

Stored offline locally

Synced later to backend

1.7 Steering Log (Helm Experience)
Flow:

Select date

Enter:

Hours at helm

Area (open sea / restricted)

Visibility

Remarks

Save → offline first → sync

1.8 Sea Service Tracking
Flow:

App automatically calculates days from:
vessel_assignment.date_joined → date_left

Cadet views:

Total days

Per vessel breakdown

1.9 Offline Sync Flow
Flow:

App starts

Checks last_sync timestamp

If online:

Pull updates from server

Push pending SyncQueue operations

Merge conflicts:

Server overrides signed tasks

Conflict examples:

CTO endorsed task → cadet cannot edit

Familiarisation already signed → locked

──────────────────────────────────────
2. CTO USER FLOWS (WEB)
──────────────────────────────────────

CTO manages cadets on board.

2.1 CTO Dashboard

Shows:

Cadets assigned to vessel

Pending task sign-offs

Familiarisation verification

Recent submissions

2.2 Review Task Submissions
Flow:

CTO opens “Pending Sign-offs” page

Sees list of tasks submitted by cadet

Click task → opens Task Review screen:

Task description

Notes

Attachments

CTO approves or rejects

If approved:

Status → cto_approved

TaskSignoff record added

If rejected:

Status returns to in_progress

2.3 Familiarisation Sign-off
Flow:

CTO sees familiarisation items marked completed by cadet

Reviews each

Signs off items

Master will sign final confirmation later

──────────────────────────────────────
3. MASTER USER FLOWS (WEB)
──────────────────────────────────────

Master completes second-level sign-off.

3.1 Master Dashboard

Shows:

Tasks awaiting sign-off

Familiarisation status

Cadet progress charts

3.2 Approve Tasks
Flow:

Master selects a task pending from CTO

Reviews cadet + CTO comments

Approves or rejects

Status → master_endorsed

Shore Officer becomes next approver

3.3 Familiarisation Final Sign-off
Flow:

Master confirms final completion of familiarisation

Important for compliance

──────────────────────────────────────
4. SHORE TRAINING OFFICER (WEB)
──────────────────────────────────────

Final authority validating TRB & training.

4.1 Review Master-Endorsed Tasks
Flow:

Shore officer sees tasks endorsed by Master

Reviews audit log, timestamps, vessel data

Approves final validation

Status → shore_certified

4.2 View Full Cadet Progress

Includes:

All tasks

Familiarisation

Sea service

Diaries

Steering records

4.3 Generate TRB & Certificates
Flow:

Click “Generate TRB PDF”

Backend compiles:

Tasks

Signatures

Familiarisation

Sea service summary

Certificate issued

──────────────────────────────────────
5. ADMIN USER FLOWS (WEB)
──────────────────────────────────────

Admins configure the system.

5.1 Vessel Management

Create vessels

Add ship particulars

Assign ship type

5.2 Task Template Management
Via manual form OR Excel import.

Excel import supports columns:

| Part | Section | Description | ShipType | Mandatory | STCW |

After upload:

Tasks are created

Linked to correct ship type

Validated before insertion

5.3 Familiarisation Template Management

Create ship-type-specific familiarisation checklists

Reorder items

Set CTO/Master sign-off requirements

5.4 User & Role Management

Create cadets

Create officers

Assign vessels

END OF DOCUMENT