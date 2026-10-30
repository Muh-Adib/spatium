import Link from 'next/link'
import { siteConfig } from '@/config/site'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-emerald-400">
          404 · Core Engine
        </p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">Endpoint Tidak Ditemukan</h1>
        <p className="mt-3 text-sm text-slate-400">
          Rute yang Anda cari tidak tersedia pada Core Engine headless backend. Untuk halaman publik, silakan akses frontend satelit.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm font-semibold">
          <Link
            href="/"
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-slate-950 transition-colors hover:bg-emerald-400"
          >
            Beranda Core Engine
          </Link>
          <Link
            href="/admin"
            className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-slate-200 transition-colors hover:bg-slate-800"
          >
            Buka Studio CMS
          </Link>
        </div>
      </div>
    </div>
  )
}
