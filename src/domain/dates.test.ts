import { describe, it, expect } from 'vitest';
import { todayISO, isValidISODate, isFutureDate } from './dates';

describe('dates domain logic', () => {
  it('formats local date to YYYY-MM-DD correctly without UTC shift', () => {
    // 5:00 AM IST on April 1, 2026 (in UTC, this would be previous day March 31!)
    const date = new Date(2026, 3, 1, 5, 0, 0);
    expect(todayISO(date)).toBe('2026-04-01');
  });

  it('validates calendar dates strictly', () => {
    expect(isValidISODate('2026-04-01')).toBe(true);
    expect(isValidISODate('2026-02-28')).toBe(true);
    // Leap year 2024 has Feb 29
    expect(isValidISODate('2024-02-29')).toBe(true);
    // Non-leap year 2026 does not have Feb 29
    expect(isValidISODate('2026-02-29')).toBe(false);
    expect(isValidISODate('2026-02-30')).toBe(false);
    expect(isValidISODate('2026-04-31')).toBe(false);
    expect(isValidISODate('not-a-date')).toBe(false);
    expect(isValidISODate('2026/04/01')).toBe(false);
  });

  it('detects future dates relative to today', () => {
    const today = '2026-04-01';
    expect(isFutureDate('2026-04-02', today)).toBe(true);
    expect(isFutureDate('2026-04-01', today)).toBe(false);
    expect(isFutureDate('2026-03-31', today)).toBe(false);
  });
});
