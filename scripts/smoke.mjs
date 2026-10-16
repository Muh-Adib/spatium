/**
 * Render smoke test.
 *
 * Bundles the app with esbuild, renders every route with react-dom/server and
 * asserts that each page produces the markup it is supposed to. This catches
 * runtime render errors and missing content without needing a browser.
 *
 * Usage: node scripts/smoke.mjs
 */
import { build } from 'esbuild'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROUTES = [
  { path: '/', expect: ['WE MAKE', 'IDEAS', 'Explore Our Work', 'Start a Project', 'Project brief'] },
  { path: '/services', expect: ['Which discipline fits', 'Core disciplines', 'Side by side'] },
  { path: '/services/2d-animation', expect: ['2D Animation', 'Explainer videos', 'Training &amp; safety animation'] },
  { path: '/services/3d-animation', expect: ['3D Animation &amp; Visual Production', 'Product animation', 'Process visualization'] },
  { path: '/services/motion-graphics', expect: ['Motion Graphics', 'Kinetic typography', 'Animated infographics'] },
  { path: '/services/digital-assets-ai', expect: ['Digital Visual Assets', 'Real-time 3D assets', 'AI-assisted visual production'] },
  { path: '/portfolio', expect: ['Selected', 'Capability studies', 'Motion Graphics'] },
  { path: '/portfolio/explainer-series-concept', expect: ['Explainer Series', 'The brief', 'Project facts'] },
  { path: '/about', expect: ['Animation is an argument', 'Four principles', 'Our position'] },
  { path: '/journal', expect: ['production floor', 'Search articles', 'All topics'] },
  { path: '/journal/brief-that-animation-can-actually-answer', expect: ['Writing a brief', 'In this article', 'Related articles'] },
  { path: '/contact', expect: ['What to expect', 'Common questions', 'Project brief'] },
  { path: '/definitely-not-a-real-page', expect: ['This frame is', 'Error 404'] },
]

// Emitting inside the project keeps React resolvable from node_modules.
const outDir = path.join(process.cwd(), '.logs', 'smoke')
const outFile = path.join(outDir, 'bundle.mjs')

await mkdir(outDir, { recursive: true })

try {
  await build({
    entryPoints: ['scripts/smoke-entry.tsx'],
    outfile: outFile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    jsx: 'automatic',
    external: ['react', 'react-dom', 'react-dom/server', 'react-router-dom', 'react/jsx-runtime'],
    loader: { '.css': 'empty', '.svg': 'empty' },
    define: {
      'process.env.NODE_ENV': '"production"',
      'import.meta.env': JSON.stringify({
        VITE_STUDIO_EMAIL: 'hello@unimasi.studio',
        VITE_INQUIRY_ENDPOINT: '',
      }),
    },
    logLevel: 'warning',
  })

  const { renderRoute } = await import(pathToFileURL(outFile).href)

  // react-router's <Link> uses useLayoutEffect, which React warns about during
  // server rendering. That warning is expected here and not a page defect.
  const realError = console.error
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('useLayoutEffect does nothing on the server')) return
    realError(...args)
  }

  let failures = 0
  for (const route of ROUTES) {
    let html = ''
    try {
      html = renderRoute(route.path)
    } catch (error) {
      failures += 1
      console.error(`✗ ${route.path} — render threw: ${error.message}`)
      continue
    }

    const missing = route.expect.filter((needle) => !html.includes(needle))
    if (missing.length > 0) {
      failures += 1
      console.error(`✗ ${route.path} — missing: ${missing.join(', ')}`)
    } else {
      console.log(`✓ ${route.path} (${html.length.toLocaleString()} chars)`)
    }
  }

  console.error = realError
  console.log(
    failures === 0
      ? `\nAll ${ROUTES.length} routes rendered with expected content.`
      : `\n${failures} of ${ROUTES.length} routes failed.`,
  )
  process.exitCode = failures === 0 ? 0 : 1
} finally {
  // Keep the bundle when debugging with SMOKE_KEEP=1.
  if (!process.env.SMOKE_KEEP) await rm(outFile, { force: true })
}
