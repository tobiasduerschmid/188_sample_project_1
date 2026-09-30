import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Schedule } from '../src/ui/Schedule';
import { timeLabel } from '../src/ui/shared';
import { expandMeeting } from '../src/domain/calendar';
import { makeFixture } from '../src/fixtures/catalog';
import type { ScheduleReport } from '../src/domain/types';

it('shows both dated portions of an overnight interval, including its actual end time', () => {
  const quarter = makeFixture().quarter;
  const result = expandMeeting(
    { id: 'overnight', kind: 'once', start: '2026-01-05T23:00', end: '2026-01-06T01:00' },
    quarter,
    { id: 'night', label: 'OVERNIGHT', kind: 'class' },
  );
  if (!result.ok) throw new Error('fixture');
  const report: ScheduleReport = {
    occurrences: result.value,
    conflicts: [],
    incomplete: [],
    availability: [],
    unscheduled: [],
  };
  const rendered = renderToStaticMarkup(createElement(Schedule, { report, quarter }));
  expect(rendered.match(/OVERNIGHT/g)).toHaveLength(2);
  expect(rendered).toContain('01:00');
});

it('displays the supplied seconds and milliseconds rather than a zero-length subminute conflict', () => {
  expect(timeLabel('2026-01-05T09:00:10')).toBe('09:00:10');
  expect(timeLabel('2026-01-05T09:00:20.125')).toBe('09:00:20.125');
  expect(timeLabel('2026-01-05T09:00:00')).toBe('09:00');
  expect(timeLabel('2026-01-05T09:00')).toBe('09:00');
});
