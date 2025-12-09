KEEL — Product Vision Document

Keel is a Digital Training Record Book (TRB) system built for maritime cadets and training officers.
It fully replaces paper-based TRB workflows while maintaining compliance with STCW, SSTP (Structured Shipboard Training Programme), and company training standards.

Keel is a three-part system:

1. Cadet Mobile App (React Native)

A full offline-capable app for cadets onboard ships.

Core functions:

First-time app onboarding

Ship joining onboarding

Ship familiarisation flow

Viewing vessel particulars

Training task list (auto-filtered by vessel type + mandatory tasks)

Submit task evidence (notes, photos, attachments)

Diary:

Daily Log

Bridge Watch

Engine Watch

Steering & helm records

Sea service tracking

Notifications

Offline database (WatermelonDB/SQLite)

Sync engine (push/pull)

Biometric login (Face ID / Fingerprint)

Auto-rotate UI (portrait + landscape)

Works fully offline at sea

2. Web App for Officers, Shore Staff & Admin (React + ShadCN)

Accessible on ship computers, tablets, office laptops.

User types:

CTO – Chief Training Officer

Master

Shore Training Officer

Admin

Core functions:

User login

Dashboard

Vessel setup

Ship particulars entry

Ship type management

Task template management

Excel import of tasks

Assign cadets to vessels

Familiarisation verification

Task sign-off workflow:
Cadet → CTO → Master → Shore Officer

View cadet progress

Generate PDF reports:

TRB

Sea service summary

Final training certificate

3. Backend (Node.js + PostgreSQL + AWS)

Secure central API powering both mobile & web.

Core responsibilities:

Authentication & biometrics integration

User roles & permissions

Database management

Task workflow engine

Ship type–based task filtering

Familiarisation workflow

Diaries, steering logs, sea-service records

Offline sync endpoints

Notification endpoints

Task and familiarisation sign-off chain

PDF generation (TRB, certificates)

File upload (S3)

Deployment on AWS (RDS, EC2/Elastic Beanstalk, CloudFront)

Keel Core Principles

Cadet-first offline usability

Strict STCW compliance

Structured, unavoidable verification chain

Automated vessel-type task mapping

Zero confusion onboarding for cadets & new ships

Officer approvals must be secure and role-restricted

Audit trail for every training event

Simple Excel-based data import for companies

What Keel Solves

Eliminates paper TRB loss or damage

Removes illegible handwriting & missing signatures

Makes STCW audits effortless

Gives cadets real-time visibility of progress

Helps companies standardise training across fleets

Provides secure & verified sign-off workflow

Long-term vision

Keel becomes the industry-standard onboard training platform, integrating with:

Crew management systems

ECDIS/bridge equipment logs

Digital muster systems

Cloud analytics for training performance

END OF DOCUMENT