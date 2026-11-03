# SCHEMA VERIFICATION REPORT — UNIMASI STUDIO
**Auditor**: Database Integrity Auditor & Principal Software Architect  
**Audit Standard**: Zero-Trust (PostgreSQL 16 via Prisma 8 ORM)  
**Date**: 2026-11-03  

---

## 1. Physical Database Inspection

- **PostgreSQL Connection**: Active (`postgresql://segiatech:***@localhost:5433/segiatech?schema=public`)
- **Total Physical Tables**: 47 tables verified in `information_schema.tables`
- **Total Foreign Key Constraints**: 20 foreign keys verified
- **Total Unique Constraints**: 25 unique constraints verified

### Table Counts & Integrity Status

| Table Name | Physical Record Count | Key Constraints Verified | Integrity Status |
|---|:---:|---|---|
| `articles` | **1,172** | `articles_slug_key` (UNIQUE), FK to `categories`, FK to `authors` | **PASS (VERIFIED)** |
| `authors` | **9** | `authors_slug_key` (UNIQUE) | **PASS (VERIFIED)** |
| `categories` | **22** | `categories_slug_key` (UNIQUE) | **PASS (VERIFIED)** |
| `service_categories` | **4** | `service_categories_slug_key` (UNIQUE) | **PASS (VERIFIED)** |
| `services` | **32** | `services_slug_key` (UNIQUE) | **PASS (VERIFIED)** |
| `portfolios` | **9** | `portfolios_slug_key` (UNIQUE) | **PASS (VERIFIED)** |
| `pages` | **6** | `pages_slug_key` (UNIQUE) | **PASS (VERIFIED)** |
| `users` | **10** | `users_email_key` (UNIQUE) | **PASS (VERIFIED)** |
| `locations` | **16** | `locations_slug_key` (UNIQUE) | **PASS (VERIFIED)** |
| `voice_profiles` | **1** | Active brand voice profile verified | **PASS (VERIFIED)** |
| `sites` | **0** | Missing seed record! | **FAIL (GAP FOUND)** |

---

## 2. Integrity Findings & Root-Cause Diagnosis

### Finding DB-01: Empty `sites` Table in Multi-Tenant Delivery Architecture
- **Severity**: P1 (High)
- **Root Cause**: `scripts/seed.ts` only inserted `SiteConfig` (site UI settings) but omitted seeding the tenant entity in `sites` table.
- **Consequence**: Any strict query to Delivery API (`/api/v1/delivery/*`) with header `x-site-key: site_sec_unimasi` in production mode evaluates `getSiteByApiKey()` which returns null if not explicitly mocked.
- **Action Plan**: Add automated seeding of canonical UNIMASI `Site` record in `scripts/seed.ts` and apply to database immediately.
