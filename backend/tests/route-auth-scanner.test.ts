import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const API_DIR = path.resolve(__dirname, '../src/app/api')

const PUBLIC_ROUTES = [
  'vitals/route.ts',
  'indexnow/key/route.ts',
  'revalidate/route.ts',
  'auth/[...nextauth]/route.ts',
  'navigation/route.ts',
  'categories/route.ts',
  'locations/route.ts',
  'theme/tokens/route.ts',
]

function getRouteFiles(dir: string, base = ''): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  let files: string[] = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relPath = path.join(base, entry.name)
    if (entry.isDirectory()) {
      files = files.concat(getRouteFiles(fullPath, relPath))
    } else if (entry.name === 'route.ts') {
      files.push(relPath)
    }
  }
  return files
}

describe('P0.3 Route Auth Scanner', () => {
  const routeFiles = getRouteFiles(API_DIR)

  it('scans and finds all API route handlers', () => {
    expect(routeFiles.length).toBeGreaterThan(20)
  })

  it('ensures all non-public route files call requireUser or requireRole', () => {
    const unauthenticatedHandlers: { file: string; handlersWithoutAuth: string[] }[] = []

    for (const relFile of routeFiles) {
      const normalizedPath = relFile.replace(/\\/g, '/')
      if (PUBLIC_ROUTES.includes(normalizedPath)) {
        continue
      }

      const fullPath = path.join(API_DIR, relFile)
      const content = fs.readFileSync(fullPath, 'utf-8')

      // Check which HTTP methods are exported
      const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
      const exportedMethods: string[] = []

      for (const method of httpMethods) {
        const regex = new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\b`)
        if (regex.test(content)) {
          exportedMethods.push(method)
        }
      }

      // Check whether requireUser, requireRole, requireCan, or authenticateDeliveryRequest is used
      const hasRbacImport = /from\s+['"]@\/lib\/auth\/(?:rbac|capabilities)['"]/.test(content)
      const hasRequireCall = /requireUser|requireRole|requireCan/.test(content)
      const hasDeliveryAuth = /authenticateDeliveryRequest/.test(content)
      const isOpenApi = normalizedPath === 'openapi.json/route.ts'

      if ((!hasRbacImport || !hasRequireCall) && !hasDeliveryAuth && !isOpenApi) {
        unauthenticatedHandlers.push({
          file: normalizedPath,
          handlersWithoutAuth: exportedMethods,
        })
      }
    }

    expect(unauthenticatedHandlers).toEqual([])
  })
})
