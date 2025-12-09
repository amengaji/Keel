KEEL — Domain Model (Data Structure Blueprint)

This file defines all data entities required by Keel.
It represents the digital version of the Training Record Book (TRB),
Familiarisation procedures, Sign-off workflow, Ship particulars, and Diaries.

This model is based on:

STCW requirements

Your uploaded TRB PDFs (NCV, SSTP, Yacht)

Verification chain:
Cadet → CTO → Master → Shore Training Officer

─────────────────────────────────────────
ENTITY GROUP A — USERS & ROLES
─────────────────────────────────────────
1. User

Represents ANY login-capable account.

User {
  id
  email
  password_hash
  role_id
  first_name
  last_name
  phone
  photo_url
  created_at
  updated_at
}

2. Role
Role {
  id
  name   // CADET, CTO, MASTER, SHORE_OFFICER, ADMIN
}

3. CadetProfile
CadetProfile {
  id
  user_id
  date_of_birth
  nationality
  certificate_number
  training_program_type   // NCV / OOW Yacht <3000GT / Company
  current_rank            // e.g., Deck Cadet, Engine Cadet
  created_at
}

4. OfficerProfile (CTO, Master, Shore)
OfficerProfile {
  id
  user_id
  rank
  coc_number
  signature_image_url    // optional
}

─────────────────────────────────────────
ENTITY GROUP B — VESSEL & SHIP TYPE
─────────────────────────────────────────
5. ShipType

Used for automatic task filtering.

ShipType {
  id
  name            // "Tanker", "Bulk Carrier", "Yacht", "General Cargo", etc.
  description
}

6. Vessel

Includes comprehensive ship particulars (your requirement).

Vessel {
  id
  name
  imo_number
  flag
  ship_type_id

  gross_tonnage
  length_overall
  breadth
  draft
  propulsion_type
  main_engine_model
  main_engine_power
  generator_count
  emergency_generator_details
  rescue_boat_capacity
  liferaft_details
  fire_plan_document_id

  created_at
  updated_at
}

7. VesselAssignment

When cadet joins a new ship.

VesselAssignment {
  id
  cadet_id
  vessel_id
  date_joined
  date_left          // nullable until cadet signs off ship
  assigned_by_user_id
}

─────────────────────────────────────────
ENTITY GROUP C — FAMILIARISATION
─────────────────────────────────────────
8. FamiliarisationTemplate

Templates created by Admin/Shore Staff; different per ship type or generic.

FamiliarisationTemplate {
  id
  title
  description
  ship_type_id   // null if universal
}

9. FamiliarisationItem

Each checklist item cadet must complete during onboarding.

FamiliarisationItem {
  id
  template_id
  order_number
  task_text
  requires_cto_signoff    // true/false
  requires_master_signoff // true/false
}

10. CadetFamiliarisationCompletion

Cadet’s actual completion record.

CadetFamiliarisationCompletion {
  id
  cadet_id
  vessel_id
  item_id
  completed_at
  cto_signed_at
  master_signed_at
}

─────────────────────────────────────────
ENTITY GROUP D — TASK SYSTEM
─────────────────────────────────────────
11. TaskTemplate

Master training tasks imported via Excel or predefined.

TaskTemplate {
  id
  part_number               // Part 1, Part 2, etc.
  section_name
  title
  description
  stcw_reference
  mandatory_for_all         // boolean
  ship_type_id              // null if universal
}

12. CadetTaskInstance

Generated automatically when cadet joins vessel.

CadetTaskInstance {
  id
  cadet_id
  vessel_id
  task_template_id

  status                    // not_started, in_progress,
                            // submitted_to_cto, cto_approved,
                            // master_endorsed, shore_certified

  notes
  created_at
  updated_at
}

13. TaskAttachment
TaskAttachment {
  id
  cadet_task_instance_id
  file_url
  file_type      // image, pdf, doc
  created_at
}

14. TaskSignoff

Captures every approval event.

TaskSignoff {
  id
  cadet_task_instance_id
  signed_by_user_id
  signed_by_role     // CTO, MASTER, SHORE_OFFICER
  signed_at
  comments
  ip_address
  device_info
}

15. TaskImportBatch

For Excel-upload tracking.

TaskImportBatch {
  id
  uploaded_by_user_id
  uploaded_at
  file_url
  total_tasks_imported
}

─────────────────────────────────────────
ENTITY GROUP E — DIARIES & LOGS
─────────────────────────────────────────
16. DiaryEntry
DiaryEntry {
  id
  cadet_id
  vessel_id
  entry_type     // daily, bridge_watch, engine_watch
  entry_date
  text
  created_at
}

17. SteeringRecord
SteeringRecord {
  id
  cadet_id
  vessel_id
  date
  hours_at_helm
  conditions      // visibility, area, remarks
}

18. SeaServiceEntry
SeaServiceEntry {
  id
  cadet_id
  vessel_id
  date_joined
  date_left
  total_days      // auto-calculated or stored
}

─────────────────────────────────────────
ENTITY GROUP F — OFFLINE SYNC (MOBILE)
─────────────────────────────────────────
19. DeviceSession
DeviceSession {
  id
  cadet_id
  device_id
  last_sync_at
  platform        // android / ios
  sync_token
}

20. SyncQueue

Stores unsynced operations on mobile.

SyncQueue {
  id
  cadet_id
  operation_type   // create, update
  entity_type      // DiaryEntry, TaskInstance, Familiarisation, etc.
  payload_json
  created_at
}

─────────────────────────────────────────
ENTITY GROUP G — NOTIFICATIONS
─────────────────────────────────────────
21. Notification
Notification {
  id
  user_id
  title
  message
  is_read
  created_at
}

─────────────────────────────────────────
RELATIONSHIPS OVERVIEW
─────────────────────────────────────────

A User has one Role

A Cadet joins many Vessels → VesselAssignment

A Vessel belongs to one ShipType

Each ShipType has its own TaskTemplates

A CadetTaskInstance → belongs to one TaskTemplate

Each TaskInstance has multiple TaskSignoffs

Familiarisation templates belong to ShipType or universal

Every familiarisation item requires cadet completion + CTO/Master sign-off

Diaries, sea service, and steering logs all link to cadet + vessel

# ─────────────────────────────────────────
# DATABASE SCHEMA (DETAILED DRAFT)
# ─────────────────────────────────────────

# DATABASE SCHEMA (DETAILED DRAFT)

1. roles

Stores permission groups for all Keel users.

roles {
  id                 SERIAL PRIMARY KEY
  name               VARCHAR(50) UNIQUE NOT NULL   // CADET, CTO, MASTER, SHORE_OFFICER, ADMIN
  created_at         TIMESTAMP DEFAULT NOW()
}

2. users

Accounts that log into Keel (mobile or web).

users {
  id                 SERIAL PRIMARY KEY
  email              VARCHAR(255) UNIQUE NOT NULL
  password_hash      TEXT NOT NULL
  role_id            INTEGER REFERENCES roles(id)
  first_name         VARCHAR(100) NOT NULL
  last_name          VARCHAR(100) NOT NULL
  phone              VARCHAR(20)
  photo_url          TEXT
  created_at         TIMESTAMP DEFAULT NOW()
  updated_at         TIMESTAMP DEFAULT NOW()
}

3. cadet_profiles

Additional cadet-specific data.

cadet_profiles {
  id                       SERIAL PRIMARY KEY
  user_id                  INTEGER REFERENCES users(id)
  date_of_birth            DATE
  nationality              VARCHAR(100)
  certificate_number       VARCHAR(100)
  training_program_type    VARCHAR(50)   // NCV, OOW-YACHT, COMPANY
  current_rank             VARCHAR(100)  // Deck Cadet, Engine Cadet
  created_at               TIMESTAMP DEFAULT NOW()
}

4. officer_profiles

Used by CTO, Master, Shore Officer.

officer_profiles {
  id                   SERIAL PRIMARY KEY
  user_id              INTEGER REFERENCES users(id)
  rank                 VARCHAR(100)     // Master, CTO, etc
  coc_number           VARCHAR(100)
  signature_image_url  TEXT
}

5. ship_types

Defines categories of vessels. Each has unique tasks & familiarisation.

ship_types {
  id                SERIAL PRIMARY KEY
  name              VARCHAR(100) UNIQUE NOT NULL     // Tanker, Bulk Carrier, Yacht, General Cargo
  description       TEXT
  created_at        TIMESTAMP DEFAULT NOW()
}

6. vessels

Contains full ship particulars (your requirement).

vessels {
  id                        SERIAL PRIMARY KEY
  name                      VARCHAR(200) NOT NULL
  imo_number                VARCHAR(20) UNIQUE NOT NULL
  flag                      VARCHAR(100)
  ship_type_id              INTEGER REFERENCES ship_types(id)

  gross_tonnage             INTEGER
  length_overall            NUMERIC(10,2)
  breadth                   NUMERIC(10,2)
  draft                     NUMERIC(10,2)

  propulsion_type           VARCHAR(200)
  main_engine_model         VARCHAR(200)
  main_engine_power_kw      INTEGER

  generator_count           INTEGER
  emergency_generator_desc   TEXT

  rescue_boat_capacity      VARCHAR(200)
  liferaft_details          TEXT
  fire_plan_document_id     INTEGER          // reference to S3 file later

  created_at                TIMESTAMP DEFAULT NOW()
  updated_at                TIMESTAMP DEFAULT NOW()
}

7. vessel_assignments

When cadet joins a ship — essential for sea service, tasks, familiarisation.

vessel_assignments {
  id                SERIAL PRIMARY KEY
  cadet_id          INTEGER REFERENCES users(id)
  vessel_id         INTEGER REFERENCES vessels(id)

  date_joined       DATE NOT NULL
  date_left         DATE                // NULL until cadet leaves ship

  assigned_by_user_id  INTEGER REFERENCES users(id)

  created_at        TIMESTAMP DEFAULT NOW()
}

8. familiarisation_templates

A template corresponds to a ship type OR a universal template.

familiarisation_templates {
  id                 SERIAL PRIMARY KEY
  name               VARCHAR(200) NOT NULL           // e.g., "Tanker Familiarisation", "Yacht Familiarisation"
  ship_type_id       INTEGER REFERENCES ship_types(id)   // NULL = applies to all vessels
  description        TEXT
  created_at         TIMESTAMP DEFAULT NOW()
  updated_at         TIMESTAMP DEFAULT NOW()
}

9. familiarisation_items

Each individual item in the familiarisation checklist.

familiarisation_items {
  id                     SERIAL PRIMARY KEY
  template_id            INTEGER REFERENCES familiarisation_templates(id)
  order_number           INTEGER NOT NULL
  task_text              TEXT NOT NULL

  requires_cto_signoff   BOOLEAN DEFAULT TRUE
  requires_master_signoff BOOLEAN DEFAULT TRUE

  created_at             TIMESTAMP DEFAULT NOW()
}


Examples of familiarisation items:

Locate fire plan

Understand emergency alarms

Identify muster stations

PPE and safety equipment briefing

Orientation of bridge & engine room

10. cadet_familiarisation_completion

Tracks completion + officer sign-offs per cadet.

cadet_familiarisation_completion {
  id                    SERIAL PRIMARY KEY
  cadet_id              INTEGER REFERENCES users(id)
  vessel_id             INTEGER REFERENCES vessels(id)
  item_id               INTEGER REFERENCES familiarisation_items(id)

  completed_at          TIMESTAMP
  cto_signed_at         TIMESTAMP
  master_signed_at      TIMESTAMP

  created_at            TIMESTAMP DEFAULT NOW()
}

11. task_templates

Master task list imported via Excel or created manually.

task_templates {
  id                    SERIAL PRIMARY KEY
  
  part_number           INTEGER NOT NULL             // Part 1, Part 2, etc.
  section_name          VARCHAR(200)                 // e.g., "Shipboard Operations"
  
  title                 VARCHAR(500) NOT NULL
  description           TEXT
  stcw_reference        VARCHAR(200)

  mandatory_for_all     BOOLEAN DEFAULT FALSE        // Always included
  ship_type_id          INTEGER REFERENCES ship_types(id)   // NULL = universal

  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()
}

Notes:

This table is your single source of truth for all TRB tasks.

Excel uploads populate this table.

Tasks automatically map to ship type for cadet onboarding.

12. cadet_task_instances

Tasks assigned to cadet when joining a vessel.

cadet_task_instances {
  id                    SERIAL PRIMARY KEY
  
  cadet_id              INTEGER REFERENCES users(id)
  vessel_id             INTEGER REFERENCES vessels(id)
  task_template_id      INTEGER REFERENCES task_templates(id)

  status                VARCHAR(50) NOT NULL DEFAULT 'not_started'
                        // not_started
                        // in_progress
                        // submitted_to_cto
                        // cto_approved
                        // master_endorsed
                        // shore_certified

  notes                 TEXT
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()
}

Notes:

This table grows automatically whenever a cadet joins a ship.

It contains personalised task progress for each cadet.

Status transitions are controlled completely by backend.

13. task_attachments

Stores photos or evidence submitted by cadet.

task_attachments {
  id                       SERIAL PRIMARY KEY
  cadet_task_instance_id   INTEGER REFERENCES cadet_task_instances(id)
  file_url                 TEXT NOT NULL
  file_type                VARCHAR(50)           // image, pdf, doc
  created_at               TIMESTAMP DEFAULT NOW()
}

Notes:

Files stored in S3

Only metadata stored in DB

Heavy evidence never stored in offline DB; only references

14. task_signoffs

Every approval action recorded for audit + PDF.

task_signoffs {
  id                      SERIAL PRIMARY KEY
  cadet_task_instance_id  INTEGER REFERENCES cadet_task_instances(id)

  signed_by_user_id       INTEGER REFERENCES users(id)
  signed_by_role          VARCHAR(50) NOT NULL       // CTO, MASTER, SHORE_OFFICER
  signed_at               TIMESTAMP DEFAULT NOW()
  comments                TEXT

  ip_address              VARCHAR(100)
  device_info             TEXT
}

Notes:

Required for STCW audit trail

Used to generate TRB PDF signature sections

Allows multiple sign-offs if needed (with perfect history)

15. task_import_batches

Tracks Excel uploads (important for admin & debugging).

task_import_batches {
  id                     SERIAL PRIMARY KEY
  uploaded_by_user_id    INTEGER REFERENCES users(id)
  uploaded_at            TIMESTAMP DEFAULT NOW()
  file_url               TEXT
  total_tasks_imported   INTEGER
}

16. diary_entries

Used for Daily Logs, Bridge Watches, and Engine Watches.

diary_entries {
  id                 SERIAL PRIMARY KEY

  cadet_id           INTEGER REFERENCES users(id)
  vessel_id          INTEGER REFERENCES vessels(id)

  entry_type         VARCHAR(50) NOT NULL
                     // 'daily', 'bridge_watch', 'engine_watch'

  entry_date         DATE NOT NULL
  text               TEXT

  created_at         TIMESTAMP DEFAULT NOW()
  updated_at         TIMESTAMP DEFAULT NOW()
}

Notes:

One table for all diary types → simpler sync + UI

Daily entries help document cadet activity & behaviour

Used in TRB PDF to show cadet engagement

17. steering_records

Used to log helm experience as per STCW requirements.

steering_records {
  id                 SERIAL PRIMARY KEY

  cadet_id           INTEGER REFERENCES users(id)
  vessel_id          INTEGER REFERENCES vessels(id)

  date               DATE NOT NULL
  hours_at_helm      NUMERIC(5,2) NOT NULL         // e.g., 1.5 hours
  conditions         TEXT                          // visibility, area, sea state
  remarks            TEXT

  created_at         TIMESTAMP DEFAULT NOW()
}

Notes:

Required for demonstrating watchkeeping competency

Useful in generating steering summary pages in future PDFs

18. sea_service_entries

Tracks cadet’s official sea time.

sea_service_entries {
  id                 SERIAL PRIMARY KEY

  cadet_id           INTEGER REFERENCES users(id)
  vessel_id          INTEGER REFERENCES vessels(id)

  date_joined        DATE NOT NULL
  date_left          DATE                       // NULL if still onboard

  total_days         INTEGER                     // computed or stored

  created_at         TIMESTAMP DEFAULT NOW()
}

Notes:

Automatically derived from vessel_assignments

Essential for:

Sea-service certificate

TRB PDF

Company verification

total_days may be auto-calculated by backend OR stored for speed

19. audit_logs (Optional but strongly recommended)

Keep record of all critical actions.

audit_logs {
  id                 SERIAL PRIMARY KEY
  user_id            INTEGER REFERENCES users(id)
  entity_type        VARCHAR(100)
  entity_id          INTEGER
  action_type        VARCHAR(100)
  old_value          JSONB
  new_value          JSONB
  timestamp          TIMESTAMP DEFAULT NOW()
}

Notes:

Helps with transparency & compliance

Highly important for maritime training audits

Optional for MVP but recommended

20. device_sessions

Tracks each mobile device used by a cadet.

device_sessions {
  id                  SERIAL PRIMARY KEY

  cadet_id            INTEGER REFERENCES users(id)
  device_id           VARCHAR(200) NOT NULL          // Unique per device installation
  platform            VARCHAR(50)                    // android / ios
  last_sync_at        TIMESTAMP
  sync_token          VARCHAR(200)                   // To detect incremental updates

  app_version         VARCHAR(50)
  os_version          VARCHAR(50)

  created_at          TIMESTAMP DEFAULT NOW()
  updated_at          TIMESTAMP DEFAULT NOW()
}

Why this is required:

Every phone/tablet must be uniquely identified

Prevents overwriting data incorrectly

Allows secure multi-device login

Essential for future troubleshooting

21. sync_queue

Stores offline operations that must be pushed to backend later.

sync_queue {
  id                  SERIAL PRIMARY KEY

  cadet_id            INTEGER REFERENCES users(id)
  device_id           VARCHAR(200)

  operation_type      VARCHAR(50) NOT NULL           // 'create', 'update'
  entity_type         VARCHAR(100) NOT NULL          // e.g., DiaryEntry, TaskInstance, Familiarisation
  payload_json        JSONB NOT NULL                 // Full data blob to apply server-side

  created_at          TIMESTAMP DEFAULT NOW()
  is_synced           BOOLEAN DEFAULT FALSE
  synced_at           TIMESTAMP
}

Why this is required:

Cadet may do 20 tasks offline → sync later

Changes stored locally and uploaded batch-wise

Keeps app usable in airplane mode

Server applies operations in order

22. offline_cache_metadata

Optional but useful table for tracking last downloaded datasets.

offline_cache_metadata {
  id                  SERIAL PRIMARY KEY

  cadet_id            INTEGER REFERENCES users(id)
  device_id           VARCHAR(200)

  cache_key           VARCHAR(100)                   // tasks, vessel, familiarisation
  last_updated_at     TIMESTAMP

  created_at          TIMESTAMP DEFAULT NOW()
}

What this enables:

Efficient “delta sync”

Only download changed tasks or familiarisation items

Faster onboard sync with poor internet


END OF DOCUMENT