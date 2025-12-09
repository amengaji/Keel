KEEL — Technology Stack

Keel uses a carefully selected, modern, future-proof technology stack designed for:

Offline-first capability

Cross-platform mobile support

Powerful backend logic

Easy UI/UX scalability

Secure sign-off workflows

Cloud deployment at enterprise level

1. Mobile App Stack (Cadet App)
Framework

React Native (Expo)

Languages

TypeScript

JavaScript (supporting)

State & Data

Zustand or Jotai (lightweight state)

WatermelonDB or SQLite (offline database)

Offline-first sync strategy (pull/push diff model)

UI

React Native Paper or Custom UI components

Dark / Light mode

Auto-rotation layouts (portrait + landscape)

Device Capabilities

Biometrics (expo-local-authentication)

Camera (for evidence photos)

SecureStore (for tokens)

Notifications (Expo Notifications API)

Navigation

React Navigation

2. Web App Stack (Officers, Masters, Shore Staff, Admin)
Framework

React + Vite

UI / Styling

ShadCN UI

Tailwind CSS

Lucide Icons

State & Data

TanStack Query (React Query)

Zod for validation

Axios / Fetch for API calls

Authentication

JWT-based auth

Role-based access (CTO, Master, Shore Officer, Admin)

Features Powered by Web Stack

Excel task import

Vessel setup

Task template management

Familiarisation verification

Sign-off workflow

PDF generation previews

Admin configurations

3. Backend Stack (Engine Room)
Runtime

Node.js (LTS)

Framework

Express.js or Fastify (Fastify recommended for speed)

Language

TypeScript

ORM / DB Layer

Prisma ORM or Sequelize

Database migrations included

Database

PostgreSQL

Authentication

JWT (access + refresh tokens)

BCrypt for password hashing

Secure officer signing metadata

File Uploads

AWS S3

PDF Generation

PDFKit or Puppeteer (HTML → PDF)

Server-generated training record PDFs

Sea service certificates

Final validation certificates

Offline Sync

Dedicated endpoints for mobile delta sync

Device session tokens

Logging & Monitoring

Winston / Pino logging

Request tracing

4. Cloud Deployment Stack (AWS)
Backend Hosting

AWS Elastic Beanstalk or AWS ECS Fargate

Database

AWS RDS (PostgreSQL)

Storage

Amazon S3 (attachments, images, PDFs)

CDN & Web Hosting

AWS CloudFront (for web app distribution)

Notifications

Expo push service

Future: SNS for universal notification routing

Security

SSL certificates

VPC for RDS

Parameter Store (secrets)

5. Development Tools
IDE

VS Code

Version Control

Git + GitHub repository

API Testing

Postman

VS Code Thunder Client

Formatting & Linting

ESLint

Prettier

6. Supported Platforms
Cadet Mobile App

Android (12 backward compatible)

iOS (latest 2 major versions)

Tablets (iPad & Android tablets)

Web App

Chrome

Firefox

Safari

Edge

Ship-based offline-capable browsers (fallback designs allowed)

END OF DOCUMENT