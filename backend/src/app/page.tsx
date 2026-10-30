import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ShieldCheck,
  Server,
  Terminal,
  Database,
  FileCode,
  ArrowRight,
  Bot,
  Globe,
  Radio,
  Layers,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'UNIMASI Studio Core Engine — Animation Delivery API & Studio',
  description: 'High-performance Animation Studio Backend Engine, Delivery API, Prisma 8 ORM, and Studio Admin.',
}

export default function CoreHomePage() {
  return (
    <div className="min-h-screen bg-[#060A17] text-slate-100 flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-amber-400/30 selection:text-amber-200">
      <div className="max-w-5xl mx-auto w-full pt-8 pb-16">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-amber-500/20">
              UN
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                UNIMASI Studio Core
                <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full tracking-wider uppercase">
                  v1.0 Architecture
                </span>
              </h1>
              <p className="text-xs text-slate-400">Headless API Layer · Animation Studio CMS · Prisma 8</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
              Studio Ready
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mb-14">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Animation Studio Engine & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200">
              Headless Content Delivery
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
            This service powers UNIMASI Studio data orchestration: 2D animation, 3D visual production, motion graphics, videotron showcases, and studio journal.
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 text-slate-950 font-semibold text-sm hover:bg-amber-300 transition-colors shadow-lg shadow-amber-500/25"
            >
              <ShieldCheck className="h-4 w-4" />
              Buka Studio Admin
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-semibold text-sm hover:bg-slate-800 hover:border-slate-600 transition-colors"
            >
              <FileCode className="h-4 w-4 text-amber-400" />
              Swagger API Docs
            </Link>
            <Link
              href="/api/openapi.json"
              target="_blank"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 font-medium text-sm hover:text-slate-200 hover:border-slate-700 transition-colors"
            >
              <Terminal className="h-4 w-4" />
              OpenAPI 3.1 Spec
            </Link>
          </div>
        </div>

        {/* Core Architecture Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 transition-all">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
              <Radio className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Delivery API (v1)</h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              High-throughput endpoints serving studio articles, services, case studies, dynamic pages, and 301 redirects.
            </p>
            <div className="text-xs font-mono text-amber-400/90 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
              GET /api/v1/delivery/articles
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 transition-all">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 text-yellow-400 flex items-center justify-center mb-4 border border-yellow-500/20">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Studio AI Copilot</h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Multi-turn ReAct reasoning loop tailored for UNIMASI animation briefs, editorial drafts, and SEO validation.
            </p>
            <div className="text-xs font-mono text-yellow-400/90 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
              POST /api/ai/chat · Studio Editorial
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 transition-all">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Prisma 8 ORM</h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              PostgreSQL relational persistence with typed contracts, database-only migrations, and zero schema drift.
            </p>
            <div className="text-xs font-mono text-amber-400/90 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
              @prisma/orm-postgres
            </div>
          </div>
        </div>

        {/* Registered Satellites & Architecture Topology */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              UNIMASI Topology (Decoupled Studio Architecture)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block mb-1">Backend Engine</span>
              <span className="text-amber-400 font-bold">@unimasi/backend</span>
              <p className="text-[11px] text-slate-400 mt-1 font-sans">Port 3000 · Studio Admin & Delivery API</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block mb-1">Studio Presentation Frontend</span>
              <span className="text-yellow-400 font-bold">unimasi-studio</span>
              <p className="text-[11px] text-slate-400 mt-1 font-sans">Next.js 16 App Router · unimasi.studio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} UNIMASI Studio. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link href="/docs" className="hover:text-slate-300 transition-colors">API Docs</Link>
          <Link href="/admin" className="hover:text-slate-300 transition-colors">Studio Admin</Link>
          <Link href="/api/system/status" className="hover:text-slate-300 transition-colors">Health Check</Link>
        </div>
      </div>
    </div>
  )
}
