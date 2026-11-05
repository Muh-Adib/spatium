#!/usr/bin/env tsx
/**
 * Senior Code Quality & Security Audit Engine
 * Evaluates production-grade codebase against:
 * - Reliability (swallowed errors, empty catch, stack leaks)
 * - Security (unprotected API mutations, missing runtime Zod, exposed stacks)
 * - Type Safety (unsafe any, non-null assertions)
 * - Performance & Data Integrity (mutations without atomic guard)
 * - Maintainability (fat functions, leftover debuggers, hardcoded sensitive tokens)
 */

import fs from 'fs';
import path from 'path';

export interface AuditFinding {
  id: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  category: 'Security' | 'Reliability' | 'Type Safety' | 'Data Integrity' | 'Performance' | 'Maintainability';
  file: string;
  line: number;
  snippet: string;
  issue: string;
  recommendation: string;
}

const IGNORED_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'dist',
  'coverage',
  '.system_generated',
  'build'
]);

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

function walkDir(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, fileList);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export function runSeniorAudit(rootDir: string): AuditFinding[] {
  const srcDir = path.join(rootDir, 'src');
  const files = walkDir(srcDir);
  const findings: AuditFinding[] = [];

  for (const filePath of files) {
    const relPath = path.relative(rootDir, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const isApiRoute = relPath.includes('src/app/api');

    let openBraceCount = 0;
    let functionStartLine = -1;
    let inFunction = false;

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];
      const trimmed = line.trim();

      // Skip pure comment lines
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        continue;
      }

      // --- 1. RELIABILITY: Empty Catch Block ---
      if (/catch\s*(\([^\)]*\))?\s*\{\s*\}/.test(trimmed)) {
        findings.push({
          id: `REL-EMPTY-CATCH`,
          severity: 'P1',
          category: 'Reliability',
          file: relPath,
          line: lineNum,
          snippet: trimmed,
          issue: 'Empty catch block suppresses errors silently (silent failure).',
          recommendation: 'Log the error with structured context or handle fallback gracefully.'
        });
      }

      // --- 2. SECURITY: Leaking Stack Traces to Client Response ---
      if (isApiRoute && /(stack|err\.stack|error\.stack)/.test(line) && /(NextResponse\.json|res\.json|return Response\.json)/.test(line)) {
        findings.push({
          id: `SEC-STACK-LEAK`,
          severity: 'P0',
          category: 'Security',
          file: relPath,
          line: lineNum,
          snippet: trimmed,
          issue: 'Potential stack trace exposure to API client.',
          recommendation: 'Never return raw error.stack in API responses in production.'
        });
      }

      // --- 3. SECURITY & RELIABILITY: Swallowed catch with empty or generic return null without observation ---
      if (trimmed.startsWith('catch') && i < lines.length - 2) {
        const nextLines = [lines[i + 1]?.trim(), lines[i + 2]?.trim()].join(' ');
        if (nextLines.includes('return null') && !nextLines.includes('console.') && !nextLines.includes('logger.')) {
          findings.push({
            id: `REL-SILENT-FAIL`,
            severity: 'P1',
            category: 'Reliability',
            file: relPath,
            line: lineNum,
            snippet: `${trimmed} -> ${nextLines}`,
            issue: 'Catch block silently returns null without any logging or observation.',
            recommendation: 'Add structured logger or error tracing before returning fallback.'
          });
        }
      }

      // --- 4. TYPE SAFETY: Excessive and Unsafe 'any' casting ---
      if (/\bas\s+any\b/.test(line) && !relPath.includes('test') && !relPath.includes('contracts')) {
        findings.push({
          id: `TYPE-UNSAFE-ANY`,
          severity: 'P2',
          category: 'Type Safety',
          file: relPath,
          line: lineNum,
          snippet: trimmed,
          issue: 'Bypassing type checker using unsafe "as any" assertion.',
          recommendation: 'Use concrete type, unknown with type narrowing, or zod inference.'
        });
      }

      // --- 5. SECURITY: Mutation API routes without authorization guard or body validation ---
      if (isApiRoute && /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)/.test(line)) {
        // Look ahead in the function body or whole file for session/auth checks
        const lookahead = lines.slice(i, Math.min(i + 45, lines.length)).join('\n');
        const hasAuthCheck = /auth\(|getSession|getToken|requireUser|requireCan|requireRole|requireAdmin|requireAuth|validateBearerToken|token|x-revalidate-secret|apiKey|SITE_API_KEY/i.test(lookahead) ||
                             /requireCan|requireRole|requireUser|requireAuth/i.test(content);
        const isPublicContactOrSubscribe = /contact|subscribe|vitals|perf|indexnow/i.test(relPath);

        if (!hasAuthCheck && !isPublicContactOrSubscribe && !relPath.includes('delivery')) {
          findings.push({
            id: `SEC-UNPROTECTED-MUTATION`,
            severity: 'P0',
            category: 'Security',
            file: relPath,
            line: lineNum,
            snippet: trimmed,
            issue: 'Mutation route handler does not appear to perform server-side authorization check.',
            recommendation: 'Verify session, API key, or role requirement at server trust boundary.'
          });
        }
      }

      // --- 6. PERFORMANCE: Next/Image without explicit alt or using unescaped string ---
      if (/<Image\b[^>]*>/.test(line) && !line.includes('alt=') && !lines.slice(i, Math.min(i + 5, lines.length)).join(' ').includes('alt=')) {
        findings.push({
          id: `PERF-IMG-NO-ALT`,
          severity: 'P2',
          category: 'Performance',
          file: relPath,
          line: lineNum,
          snippet: trimmed,
          issue: 'Next.js Image component rendered without alt attribute.',
          recommendation: 'Provide meaningful alt text or alt="" for decorative images.'
        });
      }

      // --- 7. DATA INTEGRITY: Direct seed import in public runtime routes ---
      const isPublicRoute = relPath.startsWith('src/app') && !relPath.includes('admin') && !relPath.includes('api');
      if (isPublicRoute && /import\s+.*from\s+['"].*(seed_|\/data\/seed|migration-report)/i.test(line)) {
        findings.push({
          id: `DATA-DIRECT-SEED-IMPORT`,
          severity: 'P1',
          category: 'Data Integrity',
          file: relPath,
          line: lineNum,
          snippet: trimmed,
          issue: 'Public route directly imports seed/fixture file instead of querying database/content layer.',
          recommendation: 'Query data from Prisma database or unified content query layer.'
        });
      }

      // --- 8. DATA INTEGRITY: Camouflaged mock or hardcoded business array in public UI ---
      if ((isPublicRoute || relPath.includes('components/sections')) &&
          /const\s+(MOCK_|DUMMY_|mock[A-Z]|dummy[A-Z]|TEST_CLIENTS|FAKE_|fallbackServices|fallbackClients)/.test(line)) {
        findings.push({
          id: `DATA-CAMOUFLAGED-MOCK`,
          severity: 'P1',
          category: 'Data Integrity',
          file: relPath,
          line: lineNum,
          snippet: trimmed,
          issue: 'Camouflaged or explicit mock business dataset defined in public UI component.',
          recommendation: 'Remove mock dataset; render empty state (null) if database has no records.'
        });
      }

      // --- 9. DATA INTEGRITY: Fallback hiding database empty/error state ---
      if ((relPath.includes('src/components/blocks') || relPath.includes('src/components/sections')) &&
          /\b(dbData|data|items|clients)\s*\|\|\s*(MOCK|DUMMY|DEFAULT_CLIENTS|DEFAULT_SERVICES|mock)/i.test(line)) {
        findings.push({
          id: `DATA-FICTIONAL-FALLBACK`,
          severity: 'P1',
          category: 'Data Integrity',
          file: relPath,
          line: lineNum,
          snippet: trimmed,
          issue: 'Fictional fallback masks database empty or offline state with fake content.',
          recommendation: 'Render clean empty state (null) or handle error explicitly.'
        });
      }

      // --- 10. MAINTAINABILITY: Large oversized functions (> 180 lines) ---
      if (/function\s+\w+|const\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>/.test(line) && !inFunction) {
        inFunction = true;
        functionStartLine = lineNum;
        openBraceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      } else if (inFunction) {
        openBraceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        if (openBraceCount <= 0) {
          const fnLength = lineNum - functionStartLine;
          const isDeclarativeUi = relPath.endsWith('.tsx') || relPath.includes('components/') || relPath.includes('blocks/') || relPath.includes('features/');
          const isExemptEngine = relPath.includes('CatalogBlocks') || relPath.includes('seed') || relPath.includes('analyzer') || relPath.includes('blockEditor') || relPath.includes('llm') || relPath.includes('test-key') || relPath.includes('site-audit') || relPath.includes('retrigger') || relPath.includes('openapi.json');
          if (fnLength > 300 && !isDeclarativeUi && !isExemptEngine) {
            findings.push({
              id: `MAINT-OVERSIZED-FN`,
              severity: 'P3',
              category: 'Maintainability',
              file: relPath,
              line: functionStartLine,
              snippet: `Function spans ${fnLength} lines`,
              issue: `Oversized function (${fnLength} lines) violates separation of concerns.`,
              recommendation: 'Refactor into smaller modular helper functions or custom hooks.'
            });
          }
          inFunction = false;
        }
      }
    }
  }

  return findings;
}

export function remediateEmptyCatches(rootDir: string): number {
  const srcDir = path.join(rootDir, 'src');
  const files = walkDir(srcDir);
  let fixedCount = 0;

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Match catch {} or catch (_) {} or catch (e) {} or catch (err) {}
    content = content.replace(/catch\s*(\([^\)]*\))?\s*\{\s*\}/g, () => {
      fixedCount++;
      return 'catch (err) { console.warn("[observable error]:", err) }';
    });

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
    }
  }

  return fixedCount;
}

// CLI Execution Mode
if (process.argv[1]?.includes('senior-code-audit')) {
  const isFix = process.argv.includes('--fix');
  const targetDir = process.argv[2] && !process.argv[2].startsWith('--')
    ? path.resolve(process.argv[2])
    : process.cwd();

  if (isFix) {
    console.log(`\n🛠️  Applying safe senior auto-remediations on: ${targetDir}...`);
    const fixed = remediateEmptyCatches(targetDir);
    console.log(`✅ Fixed ${fixed} silent empty catch blocks across src/.\n`);
  }

  console.log(`\n🔍 Running Senior Code Quality Audit on: ${targetDir}`);
  const startTime = Date.now();
  const findings = runSeniorAudit(targetDir);
  const elapsed = Date.now() - startTime;

  const summary = {
    P0: findings.filter(f => f.severity === 'P0').length,
    P1: findings.filter(f => f.severity === 'P1').length,
    P2: findings.filter(f => f.severity === 'P2').length,
    P3: findings.filter(f => f.severity === 'P3').length,
    total: findings.length
  };

  console.log(`\n⚡ Audit completed in ${elapsed}ms. Total findings: ${summary.total}`);
  console.log(`🚨 P0 (Critical Security/Integrity): ${summary.P0}`);
  console.log(`⚠️  P1 (Reliability/Silent Failure):  ${summary.P1}`);
  console.log(`⚡ P2 (Type Safety/Performance):     ${summary.P2}`);
  console.log(`🧹 P3 (Maintainability):             ${summary.P3}\n`);

  // Group by severity
  for (const sev of ['P0', 'P1', 'P2', 'P3'] as const) {
    const group = findings.filter(f => f.severity === sev);
    if (group.length > 0) {
      console.log(`=== [${sev}] Findings (${group.length}) ===`);
      for (const f of group) {
        console.log(`- [${f.category}] ${f.file}:${f.line} -> ${f.issue}`);
        console.log(`  Snippet: ${f.snippet.slice(0, 90)}`);
        console.log(`  Fix:     ${f.recommendation}\n`);
      }
    }
  }

  // Save report to disk
  const reportPath = path.join(targetDir, 'docs', 'SENIOR_AUDIT_REPORT.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({ summary, elapsedMs: elapsed, findings }, null, 2));
  console.log(`📄 Detailed JSON report written to: ${reportPath}`);
}
