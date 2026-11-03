# TEST PLAN — UNIMASI STUDIO ZERO-TRUST VERIFICATION
**Auditor**: Principal QA Automation Engineer & Adversarial System Auditor  
**Date**: 2026-11-03  
**Framework**: Vitest 5 + Live PostgreSQL Verification (Anti-Mock Standard)  

---

## 1. Test Architecture & Layers

```
Layer 1: Security & RBAC Contract Verification (`tests/security-rbac.test.ts`)
  - Password hashing (scrypt) & Constant-time comparison
  - RBAC status state machine (DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED -> ARCHIVED)
  - SSRF blocklist (127.0.0.1, 169.254.169.254, private IP ranges)
  - HTML sanitizer (XSS payload stripping)

Layer 2: Schema Integrity & Database Persistence (`tests/db-persistence.test.ts`)
  - Direct PostgreSQL Prisma 8 query verification
  - Article CRUD, slug uniqueness, and cascade integrity
  - Delivery API multi-tenant Site entity resolution
  - WordPress user credential validation (dual email / username)

Layer 3: Publication Gate & Business Logic (`tests/publication-gate.test.ts`)
  - Title length constraints (≤60 chars)
  - Meta description constraints (≤160 chars)
  - Image alternative text compliance (accessibility gate)
  - Cornerstone content and focus keyphrase validation

Layer 4: Multi-User Concurrency & Editorial Lock (`tests/concurrency-lock.test.ts`)
  - Lock acquisition, heartbeat refresh, TTL expiry (45s)
  - Multiple editor collision detection (HTTP 423 / 409)
  - Optimistic concurrency control (OCC) on stale updatedAt timestamps
  - Force overwrite resolution

Layer 5: Server-Driven UI (SDUI) Adversarial Stress (`tests/blocks-adversarial.test.ts`)
  - Corrupted, null, and primitive block payload handling
  - Discriminator validation via Zod `parseBlocks`
  - Zero-crash fallback rendering
```

---

## 2. Evidence Requirements (Anti-False-Pass)

1. **No Mock Databases**:
   All database tests must execute queries directly against the active PostgreSQL database instance.
2. **No Mocking HTTP 200 without DB inspection**:
   Any test asserting that an article was created or updated must query `prisma.orm.public.Article.where(...)` directly and verify the exact mutated field values.
3. **Mutation Testing**:
   For each test suite, intentionally invert an assertion or business logic rule to verify that the test runner fails (proving the test is not trivially green).
