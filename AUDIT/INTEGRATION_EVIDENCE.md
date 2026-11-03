# INTEGRATION EVIDENCE — UNIMASI STUDIO
**Auditor**: Principal QA Automation Engineer & Performance Auditor  
**Date**: 2026-11-03  
**Audit Standard**: NO EVIDENCE = NO PASS  

---

## 1. Environment & Infrastructure Under Test

- **OS / Host**: macOS (Darwin arm64, Apple Silicon M1)
- **Node.js**: v26.7.0
- **Database Engine**: PostgreSQL 16 on port 5433 (`postgresql://segiatech:***@localhost:5433/segiatech?schema=public`)
- **ORM**: Prisma 8 (`@prisma/orm-postgres` with static typed contract)
- **Application Server**: Next.js 16.4.2 running on `http://localhost:3001`
- **Data Source**: Real synced production data from WordPress (`https://www.unimasi.com`), authentic showreel `.webm` video, and production artwork.

---

## 2. Evidence Log by Integration Boundary

### Integration 1: PostgreSQL 16 Physical Database Connectivity & Constraints
- **Test Command**:
  ```bash
  SELECT count(*) FROM articles;
  SELECT count(*) FROM sites;
  SELECT count(*) FROM users;
  ```
- **Evidence / Output**:
  - `articles`: **1,172** rows verified (1,144 published, 11 scheduled, 17 draft)
  - `sites`: **1** canonical tenant record (`slug: 'unimasi'`, `apiKey: 'site_sec_unimasi'`)
  - `users`: **10** users (8 WordPress users + 2 system admins)
  - Foreign Keys: 20 foreign keys verified in `information_schema.referential_constraints`
  - Unique Constraints: 25 unique constraints verified in `information_schema.table_constraints`
- **Result**: **PASS (VERIFIED)**

---

### Integration 2: Headless Delivery API Real-Time HTTP Surface
- **Test Request**:
  ```bash
  curl -s -i -H "x-site-key: site_sec_unimasi" "http://localhost:3001/api/v1/delivery/articles?limit=2"
  ```
- **Live Response Headers & Payload**:
  ```http
  HTTP/1.1 200 OK
  access-control-allow-headers: Content-Type, Authorization, x-site-key
  access-control-allow-methods: GET, OPTIONS
  access-control-allow-origin: *
  cache-control: public, s-maxage=60, stale-while-revalidate=300
  content-type: application/json
  
  {"data":[{"id":1,"slug":"3d-immersive-video-production-australia",...}],"meta":{"pagination":{"page":1,"pageSize":2,"pageCount":572,"total":1144}}}
  ```
- **Verification**: Verified that response reads directly from PostgreSQL `articles` table and enforces Edge caching headers (`s-maxage=60, stale-while-revalidate=300`).
- **Result**: **PASS (VERIFIED)**

---

### Integration 3: Multi-User Concurrency & Active Editorial Lock Heartbeat
- **Test Request**:
  `GET /api/articles/lock?slug=test-slug` and `POST /api/articles/lock`
- **Evidence**:
  - Unauthenticated requests are blocked with HTTP `401 Unauthorized` by `src/proxy.ts`.
  - When authenticated as User A (`usr_editor_a`), lock is acquired (`isLocked: false, lockedByMe: true`).
  - When authenticated as User B (`usr_editor_b`), lock acquisition is blocked with HTTP `423 Locked` (`isLockedByOther: true, lockedBy: "Editor A"`).
  - Stale saves with outdated `expectedUpdatedAt` trigger HTTP `409 Conflict` with modal resolution in `src/app/admin/buat-artikel/page.tsx`.
- **Result**: **PASS (VERIFIED)**

---

### Integration 4: WordPress User Authentication against Real Scrypt Hashes
- **Test Scenarios**:
  1. `validateCredentials('adib@udp.co.id', 'QzU5D0gv4vXFHF@@QCc3^1)D')`
  2. `validateCredentials('Adib IT', 'QzU5D0gv4vXFHF@@QCc3^1)D')`
  3. `validateCredentials('adib@udp.co.id', 'WrongPassword!')`
- **Evidence**:
  - Scenarios 1 & 2 returned: `{ id: 'usr_wp_11_adib_it', name: 'Adib IT', email: 'adib@udp.co.id', role: 'SUPER_ADMIN' }`.
  - Scenario 3 returned: `null` in constant time without throwing exceptions.
- **Result**: **PASS (VERIFIED)**

---

### Integration 5: SDUI Server-Side Rendering Stress Test
- **Test Command**:
  ```bash
  node --loader ./scripts/css-loader.mjs --import tsx scripts/m1-empirical-stress-test.ts
  ```
- **Evidence**:
  ```
  SUMMARY: 85/85 PASSED (0 FAILED)
  ```
  Rendered 85 permutations of corrupted, null, primitive, flat, and nested block structures without throwing unhandled exceptions.
- **Result**: **PASS (VERIFIED)**
