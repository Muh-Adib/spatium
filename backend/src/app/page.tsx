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
  title: 'SegiaTech Core Engine — Headless Backend & Admin Studio',
  description: 'High-performance Headless CMS Backend Engine, Delivery API, Prisma 8 ORM, and Admin Studio.',
}

export default function CoreHomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="max-w-5xl mx-auto w-full pt-8 pb-16">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/20">
              ST
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                SegiaTech Core Engine
                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full tracking-wider uppercase">
                  v1.0 Architecture
                </span>
              </h1>
              <p className="text-xs text-slate-400">Headless API Layer · Multi-Site Editorial Studio · Prisma 8</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Core Ready
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mb-14">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Enterprise Backend Engine & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Headless Content Delivery
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
            This service powers SegiaTech platform data orchestration. Presentation frontends consume content through the typed Delivery API with On-Demand ISR Webhooks.
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/25"
            >
              <ShieldCheck className="h-4 w-4" />
              Buka Admin Studio
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-semibold text-sm hover:bg-slate-800 hover:border-slate-600 transition-colors"
            >
              <FileCode className="h-4 w-4 text-emerald-400" />
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
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
              <Radio className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Delivery API (v1)</h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              High-throughput endpoints serving articles, services, case studies, dynamic pages, and 301 redirects.
            </p>
            <div className="text-xs font-mono text-emerald-400/90 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
              GET /api/v1/delivery/articles
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 transition-all">
            <div className="h-10 w-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4 border border-teal-500/20">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Studio AI Copilot</h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Multi-turn ReAct reasoning loop with bi-provider support (Gemini & OpenRouter) and strict editorial safety.
            </p>
            <div className="text-xs font-mono text-teal-400/90 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
              POST /api/ai/chat · Safe Drafts
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 transition-all">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/20">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Prisma 8 ORM</h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              PostgreSQL relational persistence with typed contracts, database-only migrations, and zero schema drift.
            </p>
            <div className="text-xs font-mono text-cyan-400/90 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
              @prisma/orm-postgres
            </div>
          </div>
        </div>

        {/* Registered Satellites & Architecture Topology */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Ecosystem Topology (Decoupled Multi-Repo Architecture)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block mb-1">Core Engine Repo</span>
              <span className="text-emerald-400 font-bold">segiatech-core</span>
              <p className="text-[11px] text-slate-400 mt-1 font-sans">Port 3000 · Admin Studio & Delivery API</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block mb-1">Standalone Web Client</span>
              <span className="text-teal-400 font-bold">segiatech-web</span>
              <p className="text-[11px] text-slate-400 mt-1 font-sans">Port 3001 · Isolated Frontend Repo</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block mb-1">TypeScript Client SDK</span>
              <span className="text-cyan-400 font-bold">@segiatech/client</span>
              <p className="text-[11px] text-slate-400 mt-1 font-sans">Distributed npm SDK Package</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} SegiaTech. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link href="/docs" className="hover:text-slate-300 transition-colors">API Docs</Link>
          <Link href="/admin" className="hover:text-slate-300 transition-colors">Studio Admin</Link>
          <Link href="/api/system/status" className="hover:text-slate-300 transition-colors">Health Check</Link>
        </div>
      </div>
    </div>
  )
}
