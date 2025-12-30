KEEL — Frontend Architecture Blueprint

This document defines the structure of:

Keel Web App (CTO, Master, Shore Officer, Admin)

Keel Mobile App (Cadet)

It explains the screens, navigation flows, and how they connect to the backend.

─────────────────────────────────────
1. KEEL WEB APP (OFFICERS / ADMIN)
─────────────────────────────────────

Tech: React + Vite + TypeScript + ShadCN + Tailwind + React Query

The web app is split into feature areas:

Auth

Dashboard

Vessels & Ship Types

Tasks & Excel import

Familiarisation

Cadets & Progress

Sign-offs

Reports

1.1 Folder Structure (Planned)
keel-web/
  src/
    api/                 // API clients (axios/fetch wrappers)
    components/          // Reusable UI components
    hooks/               // Custom hooks
    layouts/             // App shell layouts
    pages/               // Route-level screens
      auth/
      dashboard/
      vessels/
      ship-types/
      cadets/
      tasks/
      signoffs/
      reports/
    providers/           // AuthProvider, ThemeProvider, QueryClientProvider
    router/              // React Router config
    types/               // Shared TypeScript types

1.2 Routes & Screens
1.2.1 Auth

Route: /login
Screen: LoginPage

Email/password input

Role doesn’t matter here; backend decides

On success → redirect to /dashboard

1.2.2 Main Layout

Components:

AppLayout

Sidebar (desktop)

Topbar (mobile)

Theme toggle (light/dark)

User avatar + role label

All authenticated routes are wrapped in AppLayout.

1.2.3 Dashboard

Route: /dashboard
Screen: DashboardPage

Widgets depend on role:

CTO:

“Tasks awaiting my sign-off”

“Cadets on my vessel”

Master:

“Tasks awaiting my endorsement”

“Familiarisation status”

Shore Officer:

“Cadets nearing completion”

“Pending final validations”

Admin:

“Total vessels”

“Total cadets”

“Recent Excel imports”

1.2.4 Vessels & Ship Types

Routes:

/vessels

/vessels/:id

/ship-types

Screens:

VesselListPage

Table of vessels

Buttons: “Add Vessel”, “View Details”

VesselDetailsPage

Tabs:

Overview

Ship Particulars

Assigned Cadets

Familiarisation Template in use

Shows all vessel particulars fields (IMO, GT, LOA, engines, etc.)

ShipTypeListPage

Manage ship types (Tanker, Bulk, Yacht, etc.)

1.2.5 Task Templates & Excel Import

Routes:

/tasks/templates

/tasks/import

Screens:

TaskTemplateListPage

Table of tasks from task_templates

Filters:

Part

Section

ShipType

Mandatory vs optional

TaskImportPage

Download Excel sample

Upload Excel file

Shows preview:

Part, Section, Description, ShipType, Mandatory, STCW Ref

On confirm → calls /tasks/templates/import-excel

1.2.6 Cadets & Progress

Routes:

/cadets

/cadets/:id

Screens:

CadetListPage

Table of cadets (Name, Program Type, Current Vessel)

CadetDetailsPage

Tabs:

Overview (personal details)

Tasks (cadet_task_instances)

Familiarisation

Diaries

Steering

Sea Service

Reports (PDF download buttons)

1.2.7 Sign-off Workflows

Routes:

/signoffs/cto

/signoffs/master

/signoffs/shore

Each has its own page:

CTOSignoffPage

Shows tasks with status submitted_to_cto

MasterSignoffPage

Shows tasks with status cto_approved

ShoreSignoffPage

Shows tasks with status master_endorsed

Signoff modal/screen:

Task description

Cadet notes

Attachments preview

Buttons: Approve / Reject

Comment box

1.2.8 Reports

Routes:

/reports/cadets/:id

Screens:

CadetReportsPage

Buttons:

Generate TRB PDF

Generate Sea Service PDF

Generate Training Certificate

─────────────────────────────────────
2. KEEL MOBILE APP (CADET)
─────────────────────────────────────

Tech: Expo + React Native + TypeScript + React Navigation + Offline DB

The mobile app is structured into:

Auth & onboarding

Home dashboard

Ship joining & familiarisation

Tasks

Diaries

Steering

Sea service

Settings & sync

2.1 Folder Structure (Planned)
keel-mobile/
  src/
    api/               // API wrappers
    components/        // Reusable UI components
    screens/           // Screen components
      auth/
      onboarding/
      home/
      vessel/
      tasks/
      diary/
      steering/
      sea-service/
      settings/
    navigation/        // Stack & Tab navigators
    store/             // Zustand/Jotai state
    db/                // WatermelonDB/SQLite models
    hooks/
    theme/
    utils/

2.2 Navigation Structure

Root Navigation:

AuthStack:

Welcome

Login

First-time onboarding

AppStack:

Main Tab Navigator

Main Tabs:

HomeTab

TasksTab

DiaryTab

SeaServiceTab

SettingsTab

2.3 Screen Groups
2.3.1 Auth & First-Time Onboarding

Screens:

WelcomeScreen

App logo, tagline

OnboardingIntroScreen

“Digital TRB, built for you”

OnboardingPermissionsScreen

Asks for:

Camera access

Notification permission

Biometric enable decision

LoginScreen

Email + password

“Login with biometrics” button (if enabled before)

2.3.2 Home / Dashboard

Screen: HomeScreen

Shows:

Current vessel

Overall progress bar (tasks completed / total)

Familiarisation status

Pending sign-offs (submitted_to_cto)

Shortcuts:

“Continue familiarisation”

“Go to tasks”

“Write today’s diary entry”

2.3.3 Ship Joining & Familiarisation

Screens:

NewVesselAssignedScreen

When backend assigns new vessel

Shows summary & “Start joining process” button

VesselParticularsScreen

Full vessel details from vessels table

Scrollable, read-only

FamiliarisationChecklistScreen

Shows items from familiarisation_items

Each item:

Checkbox / status

Optional note

Optional photo

FamiliarisationProgressScreen

Summary:

X of Y items completed

Status: “Awaiting CTO sign-off” / “Awaiting Master sign-off”

2.3.4 Tasks

Screens:

TaskListScreen

Group by:

Part

Section

Show icons/badges:

Ship-type-specific

Mandatory

TaskDetailsScreen

Task title + description

STCW reference

Text area for notes

Attach evidence (camera/gallery)

Button:

“Mark In Progress”

“Submit to CTO”

Status logic is visual:

Grey → not_started

Blue → in_progress

Yellow → submitted_to_cto

Green → approved/endorsed/certified

2.3.5 Diary

Screens:

DiaryHomeScreen

Tabs:

Daily

Bridge Watch

Engine Watch

DiaryEntryFormScreen

Fields:

Date

Text

DiaryListScreen

List of past entries per category

Entries stored locally first, synced later.

2.3.6 Steering

Screens:

SteeringEntryFormScreen

Date

Hours at helm

Conditions

Remarks

SteeringListScreen

Table-like list

2.3.7 Sea Service

Screen: SeaServiceScreen

Shows:

Current vessel sea time (date_joined → today)

Past vessels from sea_service_entries

Total days at sea

2.3.8 Settings & Sync

Screens:

SettingsScreen

Toggle dark/light theme

Enable/disable biometrics

View account details

“Sync Now” button

“Last synced at: HH:MM, DD-MMM-YYYY”

SyncStatusComponent

Shows:

Pending sync actions count

Last sync result

─────────────────────────────────────
3. RESPONSIBILITY SPLIT (WEB VS MOBILE)
─────────────────────────────────────
Web (Officers/Admin):

Configure vessels, ship types, tasks, familiarisation templates

Sign-off tasks & familiarisation

Review progress

Generate PDFs

Mobile (Cadet):

Onboard to app

Join ships & complete familiarisation

Complete tasks & attach evidence

Maintain diaries & steering records

Monitor progress & sea time

Operate fully offline and sync later

END OF DOCUMENT