KEEL — Full Development Phases (Master Plan)

This document outlines the ENTIRE development journey for building Keel, the world’s most advanced digital Training Record Book (TRB).
Follow this phase-by-phase plan strictly to avoid confusion or feature overlap.

🟣 PHASE 0 — FOUNDATION & STRUCTURE

(You are here now)

Goals:

Define product vision

Define stack

Define full roadmap

Create project folder structure

Create documentation templates

Deliverables:

/keel-docs/vision.md

/keel-docs/stack.md

/keel-docs/phases.md

/keel-docs/domain-model.md

/keel-docs/user-flows.md

Once Phase 0 is complete, development begins.

🟡 PHASE 1 — DOMAIN DESIGN & DATA FOUNDATION (NO CODE)
Goals:

Understand every entity Keel needs

Define relationships

Map real TRB structures into digital models

Define verification chain:
Cadet → CTO → Master → Shore Training Officer

Tasks:

Define all entities:

Users, Roles

Vessel, ShipType

Ship Particulars

Familiarisation templates

Task templates (with ship-type filtering)

Cadet task instances

Task sign-off records

Diary, Sea-service, Steering logs

Map phases to real TRB baseline (NCV & SSTP PDFs)

Write final data model in domain-model.md

Deliverables:

Complete data model

Verification states

JSON-like schema drafts

🟠 PHASE 2 — ENGINE ROOM v1 (BACKEND CORE)
Goals:

Build the foundation backend with minimal but essential functionality.

Backend must support:

User creation / login

Role-based access

Create vessels

Assign ship types

Upload ship particulars

List task templates

Create baseline cadet task instances

Endpoints in this phase:
POST /auth/login
GET /me
GET /ship-types
GET /vessels
GET /vessels/:id
GET /tasks/templates
GET /cadets/:id/tasks

What is NOT included:

❌ Sign-off
❌ Familiarisation
❌ Diaries
❌ Offline sync
❌ PDFs
❌ Mobile

Focus ONLY on core engine.

🔵 PHASE 3 — BRIDGE v1 (WEB ADMIN & OFFICER UI)
Goals:

Create the web interface for all officer-level workflows.

Features for Admin:

Login

Dashboard

Vessel setup

Ship type creation

Enter ship particulars

Excel import for tasks

Assign cadets to vessels

Features for CTO:

See cadets per vessel

View tasks awaiting sign-off

Features for Master:

Same as CTO but second-level sign-off

Features for Shore Officer:

Final validation screen

Full cadet progress overview

Deliverables:

Working web interface with real backend connection

Ships, tasks, users visible in UI

Excel import pipeline

🟢 PHASE 4 — ENGINE ROOM v2 (SIGN-OFF LOGIC, FAMILIARISATION, TASK FILTERING)
Goals:

Add smart logic to backend so Keel functions like a real training system.

Add:

Familiarisation workflows

Task filtering:

mandatory_for_all

ship_type specific

Complete task lifecycle:

not_started → in_progress → submitted_to_cto
→ cto_approved → master_endorsed → shore_certified

Deliverables:

Full verification chain working in backend

Officers can approve tasks on the web

Familiarisation sign-offs available

🟣 PHASE 5 — DECK v1 (MOBILE APP — ONLINE MODE)
Goals:

Build the cadet mobile app with basic functionality without offline sync yet.

Features:
1. First-time app onboarding

Welcome screens

Permissions

Enable biometrics

2. Ship-joining onboarding

View vessel assigned

Show ship particulars

Show ship-type specific tasks

Show familiarisation checklist overview

3. Familiarisation flow

Step-by-step familiarisation screens

Submit familiarisation items

4. Tasks system

Part-wise task list

Ship-type-filtered tasks

Mandatory tasks

Submit evidence (notes/photos)

Submit to CTO

5. Diaries

Daily log

Bridge watch

Engine watch

6. Sea service

Auto-calc days at sea

Deliverables:

Fully working online cadet mobile app

Cadet can submit tasks to CTO

🔴 PHASE 6 — DECK v2 (OFFLINE MODE + SYNC)
Goals:

Make Keel usable at sea with zero internet.

Components:

WatermelonDB/SQLite integration

Pull sync

Push sync

Conflict resolution (“server wins” for signed tasks)

Offline caching of:

Ship particulars

Tasks

Familiarisation

Diaries

Deliverables:

Mobile app works in airplane mode

Syncs safely when internet returns

🟤 PHASE 7 — DEVICE FEATURES (BIOMETRICS, AUTO-ROTATE, TABLETS)
Goals:

Enhance mobile experience.

Add:

Biometric login (FaceID/TouchID/Fingerprint)

Secure token storage

Auto-rotate UI

Tablet-specific UI layouts

Animated transitions

Deliverables:

Fully device-optimized mobile app

🟧 PHASE 8 — CERTIFICATION & PDF OUTPUTS
Goals:

Generate all required TRB & training completion documents.

Generate:

TRB PDF (mirroring original book format)

Sea service PDF

Familiarisation summary PDF

Final training certificate (shore officer signed)

Deliverables:

All PDFs downloadable from web app

Cadet printable TRB

🟨 PHASE 9 — AWS LAUNCH & BETA TESTING
Backend:

Deploy Node backend → AWS Elastic Beanstalk/ECS

Deploy database → AWS RDS PostgreSQL

File storage → S3

Web hosting → CloudFront

Mobile:

Internal testing via TestFlight / Play Store internal track

Beta Test:

1–2 cadets

CTO

Master

Shore Officer

Deliverables:

Production-ready Keel deployment

Training Dept onboarded

END OF DOCUMENT