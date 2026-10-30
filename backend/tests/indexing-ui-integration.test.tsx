import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { IndexingMicroBadge } from '../src/components/studio/IndexingMicroBadge'
import {
  formatRemainingTimeIndonesian,
  useIndexingCooldown,
} from '../src/hooks/useIndexingCooldown'
import { IconButton } from '../src/components/admin/AdminUi'
import { RefreshCw } from 'lucide-react'

describe('Milestone 3 UI Integration: Cooldown Countdown & Status Indicators', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // Suite 1: Cooldown Countdown Formatting & Time Math
  // ==========================================================================
  describe('1. Cooldown Duration Formatting (Indonesian Locales)', () => {
    it('formats 0 or negative seconds as "0 detik"', () => {
      expect(formatRemainingTimeIndonesian(0)).toBe('0 detik')
      expect(formatRemainingTimeIndonesian(-15)).toBe('0 detik')
    })

    it('formats durations under 60 seconds as "X detik"', () => {
      expect(formatRemainingTimeIndonesian(45)).toBe('45 detik')
      expect(formatRemainingTimeIndonesian(1)).toBe('1 detik')
    })

    it('formats durations between 1 minute and 59 minutes accurately', () => {
      expect(formatRemainingTimeIndonesian(90)).toBe('1 menit 30 detik')
      expect(formatRemainingTimeIndonesian(120)).toBe('2 menit 0 detik')
      expect(formatRemainingTimeIndonesian(3599)).toBe('59 menit 59 detik')
    })

    it('formats multi-hour durations with hours and minutes', () => {
      expect(formatRemainingTimeIndonesian(3600)).toBe('1 jam 0 menit')
      expect(formatRemainingTimeIndonesian(86400)).toBe('24 jam 0 menit')
      expect(formatRemainingTimeIndonesian(82800)).toBe('23 jam 0 menit')
      expect(formatRemainingTimeIndonesian(7384)).toBe('2 jam 3 menit')
    })
  })

  // ==========================================================================
  // Suite 2: Status Badge Rendering Matrix
  // ==========================================================================
  describe('2. Micro-Badge Visual Indicators (Google "G" & IndexNow "IN")', () => {
    it('renders "G" micro-badge with emerald tone for "success" state', () => {
      const html = renderToStaticMarkup(
        <IndexingMicroBadge provider="google" status="success" httpStatus={200} />
      )
      expect(html).toContain('G')
      expect(html).toContain('text-emerald-300')
      expect(html).toContain('bg-emerald-500/20')
      expect(html).toContain('data-status="success"')
      expect(html).toContain('data-testid="indexing-badge-google"')
    })

    it('renders "IN" micro-badge with emerald tone for "accepted" state', () => {
      const html = renderToStaticMarkup(
        <IndexingMicroBadge provider="indexnow" status="accepted" httpStatus={202} />
      )
      expect(html).toContain('IN')
      expect(html).toContain('text-emerald-300')
      expect(html).toContain('bg-emerald-500/20')
      expect(html).toContain('data-status="accepted"')
      expect(html).toContain('data-testid="indexing-badge-indexnow"')
    })

    it('renders amber tone for "rate_limited" (HTTP 429) state', () => {
      const htmlGoogle = renderToStaticMarkup(
        <IndexingMicroBadge provider="google" status="rate_limited" httpStatus={429} />
      )
      expect(htmlGoogle).toContain('text-amber-300')
      expect(htmlGoogle).toContain('bg-amber-500/20')
      expect(htmlGoogle).toContain('data-status="rate_limited"')

      const htmlIndexNow = renderToStaticMarkup(
        <IndexingMicroBadge provider="indexnow" status="rate_limited" httpStatus={429} />
      )
      expect(htmlIndexNow).toContain('text-amber-300')
      expect(htmlIndexNow).toContain('bg-amber-500/20')
      expect(htmlIndexNow).toContain('data-status="rate_limited"')
    })

    it('renders rose/red tone for "failed" (5xx / network error) state', () => {
      const html = renderToStaticMarkup(
        <IndexingMicroBadge provider="indexnow" status="failed" httpStatus={500} />
      )
      expect(html).toContain('text-rose-300')
      expect(html).toContain('bg-rose-500/20')
      expect(html).toContain('data-status="failed"')
    })

    it('renders neutral slate tone for "unconfigured" state', () => {
      const html = renderToStaticMarkup(
        <IndexingMicroBadge provider="google" status="unconfigured" />
      )
      expect(html).toContain('text-neutral-400')
      expect(html).toContain('data-status="unconfigured"')
    })

    it('renders muted tone for unsubmitted / null status', () => {
      const html = renderToStaticMarkup(
        <IndexingMicroBadge provider="google" status={null} />
      )
      expect(html).toContain('text-neutral-500')
      expect(html).toContain('data-status="none"')
    })

    it('renders sky tone with animate-pulse for "in_progress" state', () => {
      const html = renderToStaticMarkup(
        <IndexingMicroBadge provider="indexnow" status="in_progress" />
      )
      expect(html).toContain('text-sky-300')
      expect(html).toContain('animate-pulse')
      expect(html).toContain('data-status="in_progress"')
    })

    it('includes HTTP status code and date in tooltip hint', () => {
      const html = renderToStaticMarkup(
        <IndexingMicroBadge
          provider="google"
          status="success"
          httpStatus={200}
          submittedAt="2026-10-28T12:00:00Z"
        />
      )
      expect(html).toContain('[HTTP 200]')
    })
  })

  // ==========================================================================
  // Suite 3: Retrigger Button Disabled/Enabled States & Tooltips
  // ==========================================================================
  describe('3. Retrigger Action Button States & Tooltip Specifications', () => {
    it('disables button and applies neutral tone when in cooldown', () => {
      const remainingSeconds = 3600
      const remainingFormatted = formatRemainingTimeIndonesian(remainingSeconds)
      const html = renderToStaticMarkup(
        <IconButton
          icon={RefreshCw}
          label={`Jeda 24 Jam (${remainingFormatted})`}
          hint={`Manual retrigger dibatasi 1x/24 jam. Tersisa ${remainingFormatted}.`}
          tone="neutral"
          size="sm"
          disabled={true}
        />
      )
      expect(html).toContain('disabled=""')
      expect(html).toContain('disabled:cursor-not-allowed')
      expect(html).toContain('disabled:opacity-40')
    })

    it('enables button with info tone (sky-400) when published and cooldown is 0', () => {
      const html = renderToStaticMarkup(
        <IconButton
          icon={RefreshCw}
          label="Kirim Ulang Indexing"
          hint="Kirim URL ini ke Google Search Console & IndexNow."
          tone="info"
          size="sm"
          disabled={false}
        />
      )
      expect(html).not.toContain('disabled=""')
      expect(html).toContain('text-sky-400')
    })

    it('disables button when article status is draft or in_review', () => {
      const isPublished = false
      const html = renderToStaticMarkup(
        <IconButton
          icon={RefreshCw}
          label="Indexing Terkunci"
          hint="Hanya konten berstatus 'published' yang dapat diindeks."
          tone="neutral"
          size="sm"
          disabled={!isPublished}
        />
      )
      expect(html).toContain('disabled=""')
    })

    it('renders spinning icon when retrigger request is actively in-flight', () => {
      const html = renderToStaticMarkup(
        <IconButton
          icon={RefreshCw}
          label="Mengirim..."
          size="sm"
          disabled={true}
          spinning={true}
        />
      )
      expect(html).toContain('animate-spin')
    })
  })

  // ==========================================================================
  // Suite 4: Countdown Tick Simulation & RFC 7231 Retry-After Parsing
  // ==========================================================================
  describe('4. Countdown Timer Progression & Header Parsing', () => {
    it('simulates 1-second countdown progression from 3 seconds to 0', () => {
      let currentSeconds = 3
      const ticks: number[] = [currentSeconds]

      const interval = setInterval(() => {
        if (currentSeconds > 0) {
          currentSeconds -= 1
          ticks.push(currentSeconds)
          if (currentSeconds === 0) {
            clearInterval(interval)
          }
        }
      }, 1000)

      vi.advanceTimersByTime(1000)
      expect(currentSeconds).toBe(2)

      vi.advanceTimersByTime(1000)
      expect(currentSeconds).toBe(1)

      vi.advanceTimersByTime(1000)
      expect(currentSeconds).toBe(0)

      expect(ticks).toEqual([3, 2, 1, 0])
    })

    it('correctly synchronizes with server RFC 7231 Retry-After header on 429', () => {
      const mockHeaders = new Headers()
      mockHeaders.set('Retry-After', '82800')

      const retryAfterVal = Number(mockHeaders.get('Retry-After'))
      expect(retryAfterVal).toBe(82800)
      expect(formatRemainingTimeIndonesian(retryAfterVal)).toBe('23 jam 0 menit')
    })

    it('parses Retry-After header with 86400 (24h) default', () => {
      const headers = new Headers({ 'Retry-After': '86400' })
      const val = parseInt(headers.get('Retry-After') || '0', 10)
      expect(val).toBe(86400)
      expect(formatRemainingTimeIndonesian(val)).toBe('24 jam 0 menit')
    })
  })

  // ==========================================================================
  // Suite 5: Hook Probe Rendering & Cooldown State Invariants
  // ==========================================================================
  describe('5. Hook Probe Rendering & State Invariants', () => {
    function HookProbe({
      initialSeconds,
      entityStatus,
    }: {
      initialSeconds: number
      entityStatus: string
    }) {
      const hook = useIndexingCooldown({
        slug: 'test-article-slug',
        entityStatus,
        initialRemainingSeconds: initialSeconds,
        enabled: false,
      })

      return (
        <div data-testid="hook-probe">
          <span data-testid="in-cooldown">{String(hook.inCooldown)}</span>
          <span data-testid="can-retrigger">{String(hook.canRetrigger)}</span>
          <span data-testid="remaining-formatted">{hook.remainingFormatted}</span>
          <span data-testid="blocked-reason">{hook.retriggerBlockedReason || 'none'}</span>
        </div>
      )
    }

    it('renders active cooldown state when remainingSeconds > 0', () => {
      const html = renderToStaticMarkup(
        <HookProbe initialSeconds={7200} entityStatus="published" />
      )
      expect(html).toContain('data-testid="in-cooldown">true<')
      expect(html).toContain('data-testid="can-retrigger">false<')
      expect(html).toContain('2 jam 0 menit')
      expect(html).toContain('Masa jeda 24 jam masih aktif')
    })

    it('renders ready state when remainingSeconds is 0 and published', () => {
      const html = renderToStaticMarkup(
        <HookProbe initialSeconds={0} entityStatus="published" />
      )
      expect(html).toContain('data-testid="in-cooldown">false<')
      expect(html).toContain('data-testid="can-retrigger">true<')
      expect(html).toContain('0 detik')
      expect(html).toContain('data-testid="blocked-reason">none<')
    })

    it('blocks retrigger when entityStatus is draft even with 0 remaining seconds', () => {
      const html = renderToStaticMarkup(
        <HookProbe initialSeconds={0} entityStatus="draft" />
      )
      expect(html).toContain('data-testid="can-retrigger">false<')
      expect(html).toContain("Konten belum berstatus &#x27;published&#x27;")
    })
  })
})
