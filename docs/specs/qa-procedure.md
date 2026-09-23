# QA Test Procedure — Hatwan Procurement System

This is the strict quality gate executed before any code is considered complete.

## 1. Static checks

- [ ] `npm run typecheck` exits cleanly (no TypeScript errors).
- [ ] `npx prisma validate` parses `prisma/schema.prisma` without errors.
- [ ] `npx prisma generate` regenerates the Prisma client successfully.

## 2. Unit tests (Jest)

Run `npm test` and confirm every suite passes:

| Module | File | What it verifies |
| ------ | ---- | ---------------- |
| Validation | `src/lib/validation.test.ts` | request payload, rating bounds (1–10), decision enum, query schema |
| Reports | `src/lib/reports.test.ts` | monthly/yearly aggregation, department filtering, cost sums |
| Organizations | `src/lib/orgs.test.ts` | company/branch/department/user CRUD helpers |
| Requests | `src/lib/requests.test.ts` | request creation (PENDING), approve/reject timestamping, idempotency |
| Requests API | `src/app/api/requests/route.test.ts` | POST validation + tenant isolation, GET filters |
| Decision API | `src/app/api/requests/[id]/decision/route.test.ts` | approve/reject, 400/404/409 paths |
| Dashboard UI | `src/app/(dashboard)/dashboard/page.test.tsx` | render, filter, approve/reject actions |
| Print layout | `src/components/print/RequestPrintLayout.test.tsx` | A4 RTL Sorani layout, CEO signature, rating meter |

## 3. Build

- [ ] `npm run build` completes with a clean exit code (no route conflicts, no missing imports).

## 4. Acceptance criteria checklist

1. Root entity is a **Company**; companies contain **Branches**; departments belong to companies (optionally to branches); users belong to companies.
2. Every company defaults CEO to **"Mohammed Ahmed Ali"**.
3. A department request captures **Requester Name, Department, Requested Item, Explanation, Necessity Rating (1–10)**.
4. Admins can **accept/reject** pending requests; a visible **review date** is stamped automatically.
5. **Monthly** and **Yearly** spending analytics are filterable by **Department**.
6. The print view is **A4-optimized**, **100% Central Kurdish (Sorani)**, right-to-left, and contains a three-column official signature block.
7. All migrations are **non-destructive** (additive-first, nullable columns, no implicit drops). Deployment uses `prisma migrate deploy`.

## 5. Self-healing loop

- On any failure, read the raw terminal log.
- Patch the exact failing file in place.
- Remove conflicting configuration files (e.g. duplicate Jest/PostCSS configs).
- Re-run `npm test` and `npm run build` until both exit 0.
