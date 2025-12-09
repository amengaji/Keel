KEEL — Backend Architecture Blueprint

This document defines the full backend architecture for Keel.
It explains how every part of the system communicates, how data flows, how offline sync works, how tasks are generated, and how role-based sign-off is enforced.

The backend stack:

Node.js (TypeScript)

Fastify or Express

PostgreSQL via Prisma or Sequelize

AWS S3 (files)

JWT Authentication

Role-based Access

Offline Sync Engine

The backend is divided into 8 logical layers.

─────────────────────────────────────────
1. ROUTING LAYER
─────────────────────────────────────────

All API endpoints are grouped as:

Authentication
POST /auth/login
POST /auth/refresh-token
POST /auth/logout

User Management
GET /users/me
POST /users/create

Vessel Management
GET /vessels
GET /vessels/:id
POST /vessels
PUT /vessels/:id

Ship Type Management
GET /ship-types
POST /ship-types

Familiarisation
GET /familiarisation/templates/:shipTypeId
GET /cadets/:id/familiarisation
POST /cadets/:id/familiarisation/:itemId/complete
POST /cadets/:id/familiarisation/:itemId/cto-sign
POST /cadets/:id/familiarisation/:itemId/master-sign

Tasks
GET /tasks/templates
POST /tasks/templates/import-excel
GET /cadets/:id/tasks
POST /cadets/:id/tasks/:taskId/start
POST /cadets/:id/tasks/:taskId/submit   // cadet → CTO
POST /tasks/:taskId/cto-approve
POST /tasks/:taskId/master-approve
POST /tasks/:taskId/shore-validate

Diaries, Steering, Sea Service
POST /cadets/:id/diary
GET  /cadets/:id/diary

POST /cadets/:id/steering
GET  /cadets/:id/steering

GET  /cadets/:id/sea-service

Offline Sync
POST /sync/pull
POST /sync/push

PDF Generation
GET /reports/cadet/:id/trb
GET /reports/cadet/:id/sea-service

─────────────────────────────────────────
2. CONTROLLER LAYER
─────────────────────────────────────────

Each route delegates logic to a controller, which:

Validates input

Calls service layer

Returns JSON response

Controller examples:

auth.controller.ts

vessel.controller.ts

task.controller.ts

familiarisation.controller.ts

sync.controller.ts

pdf.controller.ts

Controllers are thin — no business logic inside them.

─────────────────────────────────────────
3. SERVICE LAYER
─────────────────────────────────────────

The “brain” of Keel.

Every business rule lives here, including:

3.1 Task Assignment Service

When a cadet joins a vessel:

Fetch universal mandatory tasks

Fetch ship-type-specific tasks

Generate cadet_task_instances

Set initial status = not_started

3.2 Task Workflow Service

Rules:

Cadet → CTO → Master → Shore Officer

Cannot skip levels

Each approval generates a TaskSignoff record

Once shore_certified, task is locked forever

Status machine:

not_started
→ in_progress
→ submitted_to_cto
→ cto_approved
→ master_endorsed
→ shore_certified

3.3 Familiarisation Service

Load template for ship type

Cadet marks items completed

CTO signs first

Master signs second

Locks afterwards

3.4 Offline Sync Service

Two endpoints:

PULL:

Returns:

Updated tasks

Updated sign-offs

Updated familiarisation data

Vessel particulars

Templates

PUSH:

Applies offline actions:

Diary entries

Task completions

Familiarisation ticks

Attachments queued

Must:

Merge conflicts

Reject updates to already-signed tasks

3.5 Evidence Upload Service

Handles S3 upload

Validates file sizes

Stores metadata in DB

3.6 PDF Generation Service

Responsible for:

Compiling TRB PDF

Embedding:

tasks

dates

signatures

familiarisation

sea service summary

Compiling Sea-Service PDF

Rendering signature blocks as images

─────────────────────────────────────────
4. DATA ACCESS LAYER (DAL)
─────────────────────────────────────────

All database operations are located here.

If using Prisma:

user.repository.ts

vessel.repository.ts

task.repository.ts

familiarisation.repository.ts

etc.

DAL handles:

Queries

Updates

Transactions

Nothing else.

─────────────────────────────────────────
5. MIDDLEWARE LAYER
─────────────────────────────────────────

Includes:

Authentication Middleware

Verifies JWT

Rejects unauthorized users

Role-Based Access Middleware

Ensures only correct roles can:

Approve tasks

Sign familiarisation

Import Excel

Create vessels

Validation Middleware

Zod / Yup request schema validation

Error Handling Middleware

Returns standardized JSON errors.

─────────────────────────────────────────
6. BACKGROUND JOBS
─────────────────────────────────────────

Used for:

Processing large Excel imports

Sending notifications

Cleaning expired device sessions

Generating PDFs asynchronously (optional)

Tooling:

BullMQ (Redis)

Or AWS SQS (production scale)

─────────────────────────────────────────
7. SYNC ENGINE (CORE MECHANIC FOR OFFLINE MODE)
─────────────────────────────────────────

Keel uses a pull–push delta sync process:

PULL SYNC FLOW

Mobile sends:

last_sync_timestamp

device_id

Backend returns only updated records:

Tasks

Task statuses

Familiarisation

Vessel particulars

Simplified sign-off data

PUSH SYNC FLOW

Cadet sends:

New diary entries

Completed tasks

Updated notes

Familiarisation ticks

Attachments metadata

Backend must:

Apply operations in order

Ignore invalid updates

Reject updates to already-signed tasks

Mark SyncQueue items as completed

─────────────────────────────────────────
8. SECURITY DESIGN
─────────────────────────────────────────
Password Hashing

bcrypt / argon2

Token Security

Access Token (short expiry)

Refresh Token (long expiry)

Officer Sign-off Protection

Officer must be logged in

Officer biometric NEVER stored on cadet device

Approval requires officer’s web login

Attachment Security

Signed S3 URLs

Expire after 5–15 minutes

Audit Logs

Everything critical goes into audit_logs table.

END OF DOCUMENT