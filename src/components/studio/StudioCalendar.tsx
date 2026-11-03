"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface ScheduleItem {
  id: number;
  type: string;
  typeLabel: string;
  title: string;
  slug: string;
  status: string;
  scheduledAt: string | null;
  scheduledBy: string | null;
  scheduleError: string | null;
  publicationTimezone: string;
  previewUrl: string;
}

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-neutral-600/30 text-neutral-200 border-neutral-500/40",
  in_review: "bg-sky-500/15 text-sky-200 border-sky-400/40",
  approved: "bg-emerald-500/15 text-emerald-200 border-emerald-400/40",
  scheduled: "bg-amber-500/15 text-amber-200 border-amber-400/40",
  published: "bg-emerald-600/20 text-emerald-100 border-emerald-500/40",
};

const WIB = "Asia/Jakarta";

function formatWib(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function dayKey(iso: string | null): string {
  if (!iso) return "tanpa-jadwal";
  return new Intl.DateTimeFormat("en-CA", { timeZone: WIB, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(iso)
  );
}

export function StudioCalendar() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/schedule", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setItems(json.data || []);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const types = useMemo(() => Array.from(new Set(items.map((i) => i.type))), [items]);
  const filtered = useMemo(
    () => (typeFilter === "all" ? items : items.filter((i) => i.type === typeFilter)),
    [items, typeFilter]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    for (const item of filtered) {
      const key = dayKey(item.scheduledAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const failed = filtered.filter((i) => i.scheduleError);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Kalender Editorial</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Semua jadwal terbit dalam {WIB} (WIB). Klik item untuk membuka preview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="calendar-type" className="text-xs text-neutral-400">
            Tipe
          </label>
          <select
            id="calendar-type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg text-xs text-white px-2.5 py-1.5"
          >
            <option value="all">Semua</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {items.find((i) => i.type === t)?.typeLabel ?? t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {failed.length > 0 && (
        <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
          <p className="text-xs font-bold text-red-200">{failed.length} jadwal gagal / ditolak gate</p>
          <ul className="mt-2 space-y-1">
            {failed.slice(0, 5).map((f) => (
              <li key={`${f.type}-${f.id}`} className="text-[11px] text-red-200/80">
                {f.typeLabel}: {f.title} — {f.scheduleError}
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && <p className="text-xs text-neutral-400">Memuat kalender…</p>}
      {error && (
        <p role="alert" className="text-xs text-red-300">
          Gagal memuat kalender: {error}
        </p>
      )}
      {!loading && !error && grouped.length === 0 && (
        <p className="text-xs text-neutral-400">Belum ada item terjadwal.</p>
      )}

      <div className="space-y-5">
        {grouped.map(([day, rows]) => (
          <section key={day}>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
              {day === "tanpa-jadwal" ? "Tanpa jadwal (error)" : formatWib(rows[0].scheduledAt).split(",")[0]}
            </h3>
            <ul className="space-y-2">
              {rows.map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  <Link
                    href={item.previewUrl}
                    className={`flex flex-wrap items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-white/[0.06] ${
                      STATUS_STYLE[item.status] ?? "bg-white/5 text-neutral-200 border-white/10"
                    }`}
                  >
                    <span className="text-[10px] font-mono uppercase opacity-80">{item.typeLabel}</span>
                    <span className="text-xs font-semibold flex-1 min-w-[180px]">{item.title}</span>
                    <span className="text-[11px] opacity-80">{formatWib(item.scheduledAt)}</span>
                    <span className="text-[10px] uppercase opacity-70">{item.status}</span>
                    {item.scheduledBy && (
                      <span className="text-[10px] opacity-60">oleh {item.scheduledBy}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
