# BUG & VULNERABILITY REPORT — UNIMASI STUDIO
**Auditor**: Application Security Auditor & Principal Architect  
**Audit Standard**: Zero-Trust Adversarial Assessment  
**Date**: 2026-11-03  

---

## 1. Summary of Audit Findings

| Bug ID | Module | Finding Title | Severity | Root Cause | Evidence | Resolution |
|---|---|---|:---:|---|---|---|
| **BUG-01** | `src/lib/auth/crypto.ts` | 0-Length Scrypt Hash Verification Authentication Bypass | **P0 (Critical)** | `Buffer.from(nonHex, 'hex')` returns a 0-length buffer for non-hex characters. Passing length 0 to `crypto.scrypt` generates a 0-length key, causing `timingSafeEqual(Buffer.alloc(0), Buffer.alloc(0))` to evaluate `true`. | Test `verifyPasswordScrypt('any', 'scrypt:short:short')` returned `true` instead of `false`. | Added strict regex validation requiring `salt` to be ≥32 hex characters and `keyHex` to be ≥64 hex characters before invoking scrypt. |
| **BUG-02** | `scripts/seed.ts`, `Site` table | Empty `Site` Table in PostgreSQL (Delivery API 403) | **P1 (High)** | Seeder only populated `SiteConfig` (UI settings) but neglected to insert the multi-tenant `Site` tenant entity required by `getSiteByApiKey()`. | `SELECT count(*) FROM sites` returned 0. Live Delivery API calls with `x-site-key` returned 403 in strict mode. | Added automated seeding of canonical UNIMASI `Site` record (`slug: 'unimasi'`, `apiKey: 'site_sec_unimasi'`, `isActive: true`) in `scripts/seed.ts` and applied to PostgreSQL. |
| **BUG-03** | `scripts/m1-empirical-stress-test.ts` | Node.js Native ESM Crash on CSS Imports | **P1 (High)** | Node.js ESM does not recognize `.css` extension in standalone server rendering without custom loader hooks. | Command `npx tsx scripts/m1-empirical-stress-test.ts` crashed with `ERR_UNKNOWN_FILE_EXTENSION`. | Executed with `--loader ./scripts/css-loader.mjs` and established Vitest 5 configuration. |
| **BUG-04** | `package.json` | Missing Automated Test Pipeline Runner | **P2 (Medium)** | `package.json` lacked a `"test"` script, preventing CI/CD pipelines and developers from running regression test suites. | `npm test` failed with `npm error Missing script: "test"`. | Configured `"test": "vitest run"` and `vitest.config.ts` with alias support. |

---

## 2. Detailed Root-Cause & Code Remediation

### Details for BUG-01: Authentication Bypass via Malformed Hash
- **Vulnerable Code**:
  ```ts
  const [, salt, keyHex] = parts
  let expectedKey = Buffer.from(keyHex, 'hex')
  crypto.scrypt(password, salt, expectedKey.length, ...)
  ```
- **Exploit Scenario**: If an attacker or corrupted database record contained a non-hex hash string (e.g., `scrypt:short:short`), `Buffer.from('short', 'hex')` resulted in an empty buffer (0 bytes). Calling scrypt with length 0 produced a 0-byte derived key. Comparing two 0-byte buffers with `crypto.timingSafeEqual` returned `true`, effectively authenticating ANY password.
- **Fixed Code**:
  ```ts
  const [, salt, keyHex] = parts
  if (!/^[0-9a-f]{32,}$/i.test(salt) || !/^[0-9a-f]{64,}$/i.test(keyHex)) {
    return resolve(false)
  }
  ```
- **Verification**: Mutation test `tests/security-rbac.test.ts` confirmed that malformed hashes immediately return `false`.
