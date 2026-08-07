import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatRelativeTime,
  formatRelativeTimeShort,
  formatShortDate,
} from '~/utils/dateFormatter';

// Fixed "now" so relative boundaries are deterministic.
const NOW = new Date('2026-06-15T12:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

const msAgo = (ms: number) => NOW.getTime() - ms;
const isoAgo = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

// ---------------------------------------------------------------------------
// formatRelativeTime (timestamp in ms)
// ---------------------------------------------------------------------------
describe('formatRelativeTime', () => {
  it('returns Just now within the first minute', () => {
    expect(formatRelativeTime(msAgo(0))).toBe('Just now');
    expect(formatRelativeTime(msAgo(59_000))).toBe('Just now');
  });

  it('formats minutes and hours', () => {
    expect(formatRelativeTime(msAgo(5 * MINUTE))).toBe('5 minutes ago');
    expect(formatRelativeTime(msAgo(1 * HOUR))).toBe('1 hour ago');
    expect(formatRelativeTime(msAgo(3 * HOUR))).toBe('3 hours ago');
  });

  it('formats yesterday and recent days', () => {
    expect(formatRelativeTime(msAgo(1 * DAY))).toBe('Yesterday');
    expect(formatRelativeTime(msAgo(3 * DAY))).toBe('3 days ago');
  });

  it('falls back to a locale date after a week', () => {
    const timestamp = msAgo(10 * DAY);
    expect(formatRelativeTime(timestamp)).toBe(
      new Date(timestamp).toLocaleDateString(),
    );
  });
});

// ---------------------------------------------------------------------------
// formatRelativeTimeShort (ISO string)
// ---------------------------------------------------------------------------
describe('formatRelativeTimeShort', () => {
  it('returns Just now within the first minute', () => {
    expect(formatRelativeTimeShort(isoAgo(30_000))).toBe('Just now');
  });

  it('uses shorthand m/h/d units', () => {
    expect(formatRelativeTimeShort(isoAgo(5 * MINUTE))).toBe('5m ago');
    expect(formatRelativeTimeShort(isoAgo(2 * HOUR))).toBe('2h ago');
    expect(formatRelativeTimeShort(isoAgo(3 * DAY))).toBe('3d ago');
  });

  it('omits the year for same-year dates and includes it otherwise', () => {
    // ~30 days ago — same year as NOW.
    expect(formatRelativeTimeShort(isoAgo(30 * DAY))).not.toMatch(/2026/);
    // Over a year ago — year must be shown.
    expect(formatRelativeTimeShort(isoAgo(400 * DAY))).toMatch(/2025/);
  });
});

// ---------------------------------------------------------------------------
// formatShortDate
// ---------------------------------------------------------------------------
describe('formatShortDate', () => {
  it('formats as Mon D, YYYY', () => {
    expect(formatShortDate('2026-01-28T00:00:00Z')).toMatch(
      /^Jan 2[78], 2026$/, // tolerate local timezone shifting the day
    );
  });
});
