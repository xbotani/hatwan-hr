# Hatwan Multi-Tenant Procurement System

A production-oriented, multi-tenant procurement request management system built with
**Next.js (App Router, TypeScript)**, **Tailwind CSS**, **PostgreSQL** and **Prisma ORM**.
It supports role-based access, approval workflows, non-destructive migrations, print-ready
A4 Sorani (Central Kurdish) print output and Monthly/Yearly spending analytics.

## 🚀 Quick Start

1. Install dependencies

```bash
npm install
```

2. Configure environment

```bash
cp .env.example .env
# Set DATABASE_URL to a PostgreSQL connection string
```

3. Generate the Prisma client and run the non-destructive migrations

```bash
npm run db:generate
npm run db:deploy   # prisma migrate deploy (additive, never drops records)
```

4. Seed the database

```bash
npm run db:seed
```

5. Start the app

```bash
npm run dev
```

### Default seed accounts

| Role      | Email                | Password   |
| --------- | -------------------- | ---------- |
| CEO       | ceo@hatwan.com       | hatwan@123 |
| Admin     | admin@hatwan.com     | hatwan@123 |
| Dept Head | it.head@hatwan.com   | hatwan@123 |
| Employee  | employee1@hatwan.com | staff@123  |

## ✅ Verification

```bash
npm run typecheck   # tsc --noEmit
npm test            # Jest unit tests (all suites must pass)
npm run build       # prisma generate && next build
```

## 📦 Project Layout

- `src/app/api/*` – fully typed API routes
  - `companies`, `branches`, `departments`, `users` (CRUD)
  - `requests` + `requests/[id]/decision` (submit + approve/reject)
  - `reports/monthly`, `reports/annual` (spend analytics)
- `src/app/actions.ts` – typed server actions (mirror the API for form usage)
- `src/app/(dashboard)/dashboard` – approval dashboard
- `src/app/new-request`, `reports`, `settings` – forms and org management
- `src/app/print/[id]` – A4 print view
- `src/components/print/RequestPrintLayout` – RTL Sorani print layout
- `src/lib/*` – domain logic (`prisma`, `validation`, `orgs`, `requests`, `reports`, `auth`)
- `prisma/schema.prisma` + `prisma/migrations` – schema and non-destructive migrations
- `docs/specs/procurement.feature` – Gherkin acceptance specs
- `docs/specs/qa-procedure.md` – strict QA test checklist

## 🏗 Architecture

Multi-tenant org tree `Company → Branch → Department → User`, where every Company defaults
its CEO to **"Mohammed Ahmed Ali"**.

A procurement request captures the requester, department, requested item, explanation and a
**Necessity Rating (1–10)** plus an optional estimated cost. Admins approve/reject pending
requests with an automated `reviewDate` timestamp. Reports aggregate approved spend by
department, filterable for a month or a full year.

## 🛡️ Migration Rules (non-destructive)

- Additive-first migrations: new columns are nullable or carry sensible defaults.
- Data is never dropped implicitly; `prisma migrate deploy` only applies forward migrations.
- Back up before any manual, destructive operation.

## 📄 A4 print order

The print view (`/requests/[id]/print`) renders a strict **A4, right-to-left, 100% Central
Kurdish (Sorani)** document using a Noto Sans Arabic font, 20mm margins, an enterprise
letterhead, structured data sections, a three-column official signature block and a
confidentiality footer.
