# Campus Placement Management System — Feature Document (MongoDB Edition)

**Project**: Vignan University — Campus Placement Management (MongoDB-backed)

**Audience**: Product owner, dev team (Flutter, React), Backend/Infra, QA, Placement cell

**Purpose**: Replace the Supabase/Postgres architecture with MongoDB Atlas as the primary backend (database, auth integration via Atlas App Services / Realm or external providers, file metadata storage, change streams for realtime, and Atlas Triggers/Functions for server-side workflows). This document maps the prior Supabase plan to a MongoDB-first implementation and gives concrete migration & implementation steps.

---

## 1. Objectives & Success Criteria

* Single source of truth in MongoDB Atlas collections
* Secure authentication and fine-grained access via Atlas App Services (Realm) or an external Auth provider (Auth0, Firebase Auth) integrated with Atlas
* Realtime updates via MongoDB Change Streams and Atlas App Services
* Eligibility engine implemented via aggregation pipelines and serverless functions

**Success metrics**: same as prior draft — adoption rates, reduced admin workload, timely notifications, and reliable storage of student documents.

---

## 2. Stakeholders & Roles

Unchanged from earlier doc. In MongoDB world, use App Services roles, Atlas database users, and application-layer role checks to enforce permissions. Keep the same product-owner / admin / placement-cell / student role model.

---

## 3. Platform & Tech Stack (MongoDB-focused)

**Frontend**

* Student: Flutter (use `http` / GraphQL / Realm SDK) for auth & subscriptions.
* Admin: React (Next.js optional) — use REST/GraphQL endpoints or Atlas App Services GraphQL.

**Backend / Atlas Services**

* Database: MongoDB Atlas (single or multi-region cluster as needed)
* Auth: Atlas App Services (built-in auth with JWT) **or** external provider (Auth0/Firebase) with JWT mapped to app-level roles
* Storage: Prefer S3 (or an object store) for large binary files; store metadata in MongoDB. Optionally use GridFS for storing files within MongoDB if you prefer one integrated system.
* Realtime: MongoDB Change Streams or Atlas App Services Real-time Function/Sync
* Serverless: Atlas Triggers & App Services Functions (server-side workflows)
* Background Jobs: Scheduled Triggers in Atlas or external job runners (GitHub Actions / Cloud Run)

**Tooling**

* Migrations: Use migration tooling (mongock, migrate-mongo) to keep schema-like migrations and seed data.
* Local dev: `mongodb+srv://` connection to a development cluster or run a local MongoDB replica set for change streams testing.
* CI/CD: GitHub Actions to run migrations, seed data, and deploy App Services functions.

---

## 4. High-level Implementation Notes (differences vs Postgres/Supabase)

* There are no strict RLS policies in MongoDB like Postgres RLS; enforce access control in App Services functions and your application layer. Atlas App Services can help with role-based rules.
* Keep business logic in application-level functions (Atlas Functions) and aggregation pipelines where it makes sense (eligibility queries, reports).
* Use Change Streams to push realtime events to connected clients or trigger functions for external channels (email/SMS).
* Store file metadata in collections and files in S3 (or GridFS) and use pre-signed URLs for download.

---

## 5. Data Model (Collections & Example Documents)

Below are suggested collections and sample document shapes. MongoDB is schema-flexible — keep canonical shapes and use JSON schema validation in Atlas for critical constraints.

### students collection

```json
{
  "_id": {"$oid": "..."},
  "regd_id": "VU2025001",
  "auth_user_id": "<auth provider id>",
  "first_name": "Anil",
  "last_name": "Kumar",
  "email": "anil@example.edu",
  "phone": "+91-9xxxxxxxxx",
  "branch": "CSE",
  "ssc_percent": 95.4,
  "inter_percent": 89.1,
  "degree": { "name": "B.Tech", "cgpa": 8.6, "year_of_graduation": 2025 },
  "cgpa_final": 8.6,
  "linked_profiles": { "linkedin": "..." },
  "documents": [ { "doc_id": "<ref>", "type": "resume" } ],
  "created_at": {"$date": "..."},
  "updated_at": {"$date": "..."}
}
```

**Indexes**: `regd_id` (unique), `auth_user_id`, `branch`, `degree.cgpa` (for eligibility queries)

### documents collection

```json
{
  "_id": "<uuid>",
  "student_id": ObjectId("..."),
  "doc_type": "resume",
  "storage_path": "s3://aaplicrage-bucket/resumes/005outboxer/...",
  "file_name": "resume.pdf",
  "file_size": 123456,
  "checksum": "sha256:...",
  "verified": false,
  "verified_by": ObjectId("..."),
  "verified_at": {"$date": "..."},
  "created_at": {"$date": "..."}
}
```

**Indexes**: `student_id`, `doc_type`

### companies collection

```json
{ "_id": ObjectId(...), "name": "Acme Corp", "website": "https://acme.example", "created_at": Date }
```

### drives collection

```json
{
  "_id": ObjectId(...),
  "company_id": ObjectId(...),
  "title": "Summer Internship - SDE",
  "description": "...",
  "publish_date": ISODate("2025-06-01T00:00:00Z"),
  "last_date_to_apply": ISODate("2025-06-10T00:00:00Z"),
  "eligibility": { "min_cgpa": 7.0, "branches": ["CSE","ECE"], "required_docs": ["resume","ssc"] },
  "rounds": [ { "name": "Online Test" }, { "name": "Technical" } ],
  "status": "draft",
  "created_at": Date,
  "updated_at": Date
}
```

**Indexes**: `publish_date`, `status`, `eligibility.min_cgpa`

### applications collection

```json
{
  "_id": ObjectId(...),
  "drive_id": ObjectId(...),
  "student_id": ObjectId(...),
  "applied_at": Date,
  "attachments": [ { "type": "resume", "doc_ref": ObjectId(...) } ],
  "status": "applied",
  "notes": ""
}
```

**Indexes**: compound on `drive_id` + `student_id` (to prevent duplicate apps)

### notifications collection

```json
{
  "_id": ObjectId(...),
  "student_id": ObjectId(...),
  "type": "drive_published",
  "payload": { "drive_id": ObjectId(...) },
  "read": false,
  "created_at": Date
}
```

**Indexes**: `student_id`, `read`

### audit_logs collection — for critical admin actions

```json
{ "_id": ObjectId(...), "actor_id": ObjectId(...), "action": "update_cgpa", "target": { "student_id": ObjectId(...) }, "meta": {}, "created_at": Date }
```

---

## 6. Eligibility Engine (Aggregation + Functions)

Instead of RPCs, implement eligibility as an aggregation pipeline + optional serverless function that materializes results into a `drive_eligibility` collection (or directly writes notifications).

**Example aggregation** (pseudo Mongo shell):

```js
// Find students eligible for a drive
const drive = await drives.findOne({_id: driveId});
const pipeline = [
  { $match: { 'degree.cgpa': { $gte: drive.eligibility.min_cgpa }, branch: { $in: drive.eligibility.branches } } },
  { $project: { _id: 1 } }
];
const cursor = students.aggregate(pipeline);
```

For more complex checks (document presence), you can use `$lookup` to join `documents` and ensure required docs exist.

**Materialize & notify**: Use an Atlas Function or backend service to run the aggregation when `drives.status` changes to `published`, then insert notification documents and optionally send emails/SMS.

---

## 7. Realtime & Notifications

* Use MongoDB Change Streams to watch `notifications`, `applications`, or `drives` collections and push to clients (via WebSocket server) or use Atlas App Services real-time sync if using Realm SDKs.
* For external channels, use Atlas Triggers or App Services Functions to call SendGrid/Twilio on insert to `notifications`.

**Example**: Trigger: when `drives.status` updates to `published` -> run an Atlas Function that computes eligible students and inserts `notifications` + calls email/SMS functions.

---

## 8. Auth & Access Control

**Options**:

1. Atlas App Services Auth: use built-in email/password, anonymous login, and JWT tokens. Map roles inside App Services and set Data Access Rules to enforce who can read/write which documents. App Services supports granular rules using JSON-based rules and expressions.

2. External Auth (Auth0/Firebase): Keep the auth provider, and store `auth_user_id` in `students`. Use App Services custom JWT validation or handle auth entirely in your application server. Always validate JWTs server-side for privileged operations.

**Enforcement**:

* Implement server-side role checks in App Services Functions or your backend.
* Avoid embedding Atlas admin credentials in client apps. Use App Services or a server to perform privileged ops.

---

## 9. File Storage & Security

**Recommended**: Use S3 (or an S3-compatible store) for file uploads. Use pre-signed URLs for client uploads and downloads.

* Store file metadata (path, checksum, size, verified) in `documents` collection.
* If you prefer GridFS, keep in mind GridFS lives in MongoDB and can add storage and performance considerations; S3 is more cost effective and scalable for large files.

**Serving files**: Use short-lived pre-signed URLs or an App Services function that validates permissions before returning the URL.

---

## 10. Frontend Integration (Flutter & React)

**Flutter (student app)**

* Use REST/GraphQL endpoints or Atlas App Services SDK for auth and data sync.
* After login, fetch `students` profile by `auth_user_id` and subscribe to `notifications` via change streams (through a WebSocket service) or use App Services real-time sync.
* For uploading large files: get a pre-signed S3 upload URL from an App Services Function, upload directly to S3, then write a `documents` entry.

**React (admin dashboard)**

* Use App Services GraphQL or server-side Node.js with the MongoDB driver to perform admin operations.
* For privileged operations like publishing drives, run server-side code (Atlas Function or a secured backend) to compute eligibility and write notifications.

---

## 11. Server-side Functions & Workflows

Use Atlas App Services Functions or an external server (Node.js) for:

* Sending transactional emails/SMS via SendGrid/Twilio
* Running eligibility computation on `drives.status` update
* Scheduled jobs (daily verification reports) using Atlas Scheduled Triggers
* Admin-only operations using a service role

**Example trigger flow**: Update `drives.status` to `published` → Atlas Trigger fires → Function runs aggregation, inserts notifications, calls SendGrid.

---

## 12. Auditing & Logs

* Keep an `audit_logs` collection. Write entries on admin changes (cgpa updates, drive publish) using server-side code or triggers.
* Use Atlas Activity Feed & Monitoring for operational logs.

---

## 13. Migrations, Backups & Deployments

* Use `mongodump`/`mongorestore` or migration tools to move from Postgres (if you have existing data).
* Backups: Atlas point-in-time backups (PITR) + automated snapshots.
* Deploy App Services Functions through the Atlas UI or the CLI in CI.

**Migration notes**:

1. Export your Postgres data (CSV/JSON). Map normalized tables to documents (e.g., `students` rows → `students` documents, `documents` rows → `documents` collection).
2. Write a migration script (Node.js) that cleans and inserts documents. Validate indices after import.
3. Run small-batch validations and compare row counts / key aggregates before cutover.

---

## 14. Monitoring & Testing

* Unit tests for Functions; integration tests using a staging Atlas cluster.
* Load test endpoints hitting publish + notification path.
* Test data access rules (App Services rules) exhaustively.

---

## 15. Sample Code Snippets

**Connect (Node.js native driver)**

```js
// Use an env var for the URI (do NOT commit credentials)
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI; // set to your connection string
const client = new MongoClient(uri);
await client.connect();
const db = client.db('placement');
const students = db.collection('students');
```

**Aggregation to compute eligibility**

```js
async function getEligibleStudentsForDrive(driveId) {
  const drive = await db.collection('drives').findOne({ _id: driveId });
  const pipeline = [
    { $match: { 'degree.cgpa': { $gte: drive.eligibility.min_cgpa }, branch: { $in: drive.eligibility.branches } } },
    { $lookup: { from: 'documents', localField: '_id', foreignField: 'student_id', as: 'docs' } },
    { $match: { $expr: { $setIsSubset: [ drive.eligibility.required_docs || [], { $map: { input: '$docs', as: 'd', in: '$$d.doc_type' } } ] } } },
    { $project: { _id: 1 } }
  ];
  return db.collection('students').aggregate(pipeline).toArray();
}
```

**Using Change Streams (server-side) to push realtime notifications**

```js
const changeStream = db.collection('notifications').watch();
changeStream.on('change', change => {
  // push to WebSocket clients or call a push service
});
```

---

## 16. Security Considerations & Best Practices

* Never embed Atlas admin credentials in client apps. Use App Services or a backend.
* Use TLS, IP allowlists, VPC Peering where possible.
* Enable Atlas encryption at rest and consider Field Level Encryption for highly sensitive fields.
* Use short-lived tokens for file access (pre-signed URLs).
* Apply least-privilege to Atlas DB users and App Services roles.

---

## 17. MVP vs Roadmap (MongoDB priorities)

**MVP**

* Student Auth & profile (App Services + students collection)
* Document upload (S3 + documents collection)
* Drive create/publish (drives collection) + basic eligibility (aggregation)
* One-click apply (applications collection)
* Realtime notifications via change streams

**Phase 2**

* App Services Functions for email/SMS & scheduled jobs
* Resume parsing microservice (NLP) writing parsed skills back to DB
* Company portal and consent flow

**Phase 3**

* AI matching service
* ERP sync via scheduled functions

---

## 18. Acceptance Criteria (MongoDB)

* App Services rules + application checks enforce that only rightful users can read/update profiles.
* Students can upload documents to S3 and reference them in DB.
* Admins can publish drives via a secured function and eligible students receive realtime notifications.
* Privileged operations run via App Services or a secure backend with service credentials.

---

## 19. Concrete Next Steps (migration & implementation)

1. Set `MONGODB_URI` in environment variables (do not commit credentials). If your provided connection string is: `mongodb+srv://005outboxer_db_user:…@aaplicrage.pyzpqo7.mongodb.net`, put it in a secrets manager.
2. Create initial collections and indexes (students, documents, drives, applications, notifications, audit_logs).
3. Implement App Services (Realm) app for auth and role mappings.
4. Write & run migration scripts to import existing data from Postgres.
5. Build minimal Flutter app + React admin using the new endpoints/GraphQL.
6. Implement a serverless Function to handle `drives.status` → compute eligibility → write notifications.
7. Add monitoring, backups, and tests in staging and then promote to production.

---

## 20. Appendix — Mapping from Supabase schemas to MongoDB collections

* `students` table → `students` collection (flatten JSON where sensible)
* `documents` table → `documents` collection
* `drives`, `applications`, `companies` → same-named collections
* RLS policies → App Services rules + application-layer checks

---

*Prepared for migration from the Supabase/Postgres plan (original) to a MongoDB Atlas architecture.*
