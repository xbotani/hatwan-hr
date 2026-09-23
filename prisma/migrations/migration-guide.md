# Non-Destructive Migration Strategy

## Principles
1. **Never drop columns/fields without backup**
2. **Additive changes first**: all new fields added as nullable or with defaults
3. **Staged migrations**:
   - Phase 1: Add new columns as nullable
   - Phase 2: Backfill data
   - Phase 3: Add NOT NULL constraints if needed
4. **Pre-migration backup required**

## Standard Operations

### Adding a new field to the `Request` model
```sql
-- Safe: add as nullable first
ALTER TABLE "requests" ALTER COLUMN "newField" DROP NOT NULL;
```

### Running a safe Prisma migration
```bash
npm run db:backup   # pg_dump first
npm run db:deploy   # prisma migrate deploy (additive changes)
```

## Backup workflow

1. Run `npm run db:backup` before any migration.
2. Test on a staging database first.
3. Wrap multi-step operations in a transaction.
