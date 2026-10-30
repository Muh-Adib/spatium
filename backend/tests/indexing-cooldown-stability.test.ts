import { describe, it, expect } from 'vitest'
import {
  formatRemainingTimeIndonesian,
  formatCountdownIndonesian,
  formatCooldownTime,
  useIndexingCooldown,
} from '@/hooks/useIndexingCooldown'

describe('useIndexingCooldown Hook & Formatters', () => {
  it('formats remaining duration accurately in Indonesian', () => {
    expect(formatRemainingTimeIndonesian(0)).toBe('0 detik')
    expect(formatRemainingTimeIndonesian(-10)).toBe('0 detik')
    expect(formatRemainingTimeIndonesian(45)).toBe('45 detik')
    expect(formatRemainingTimeIndonesian(125)).toBe('2 menit 5 detik')
    expect(formatRemainingTimeIndonesian(3600)).toBe('1 jam 0 menit')
    expect(formatRemainingTimeIndonesian(7380)).toBe('2 jam 3 menit')

    expect(formatCountdownIndonesian(50)).toBe('50 detik')
    expect(formatCooldownTime(60)).toBe('1 menit 0 detik')
  })

  it('exports useIndexingCooldown hook function', () => {
    expect(typeof useIndexingCooldown).toBe('function')
  })
})
