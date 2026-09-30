import { describe, it, expect } from 'vitest';
import { expandMeeting } from '../src/domain/calendar';
import { makeFixture } from '../src/fixtures/catalog';
import type { OnceMeeting, WeeklyMeeting } from '../src/domain/types';

const owner = { id: 'test', label: 'Test', kind: 'class' as const };
const quarter = makeFixture().quarter;
const once = (start: string, end: string): OnceMeeting => ({
  id: 'meeting',
  kind: 'once',
  start,
  end,
});
describe('institution calendar', () => {
  it('preserves local times across daylight saving and inclusive weekdays with exclusions and replacements', () => {
    const meeting: WeeklyMeeting = {
      id: 'weekly',
      kind: 'weekly',
      weekdays: [1],
      startDate: '2026-03-02',
      endDate: '2026-03-09',
      startTime: '09:00',
      endTime: '10:00',
      endDayOffset: 0,
      exclusions: [],
      replacements: [],
    };
    const result = expandMeeting(meeting, quarter, owner);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value.map((o) => o.localStart)).toEqual([
        '2026-03-02T09:00:00',
        '2026-03-09T09:00:00',
      ]);
      expect(result.value[1].start - result.value[0].start).toBe((7 * 24 - 1) * 3600000);
    }
    meeting.exclusions = ['2026-03-02'];
    meeting.replacements = [once('2026-03-03T11:00', '2026-03-03T12:00')];
    const replaced = expandMeeting(meeting, quarter, owner);
    expect(replaced.ok && replaced.value.map((o) => o.localStart)).toEqual([
      '2026-03-03T11:00:00',
      '2026-03-09T09:00:00',
    ]);
  });
  it('rejects nonexistent spring times and requires an offset for ambiguous fall times', () => {
    expect(expandMeeting(once('2026-03-08T02:30', '2026-03-08T03:30'), quarter, owner).ok).toBe(
      false,
    );
    const fall = {
      ...quarter,
      instructionStart: '2026-09-28',
      instructionEnd: '2026-12-04',
      examStart: '2026-12-07',
      examEnd: '2026-12-11',
    };
    expect(expandMeeting(once('2026-11-01T01:15', '2026-11-01T01:45'), fall, owner).ok).toBe(false);
    const explicit = expandMeeting(
      once('2026-11-01T01:15-07:00', '2026-11-01T01:45-08:00'),
      fall,
      owner,
    );
    expect(explicit.ok).toBe(true);
    if (explicit.ok) expect(explicit.value[0].end - explicit.value[0].start).toBe(90 * 60000);
    expect(
      expandMeeting(once('2026-11-01T01:15-06:00', '2026-11-01T03:00-08:00'), fall, owner).ok,
    ).toBe(false);
  });
  it('validates every overnight/replacement boundary and interval', () => {
    expect(expandMeeting(once('2026-01-05T23:00', '2026-01-06T01:00'), quarter, owner).ok).toBe(
      true,
    );
    expect(expandMeeting(once('2026-03-20T23:00', '2026-03-21T01:00'), quarter, owner).ok).toBe(
      false,
    );
    expect(expandMeeting(once('2026-01-05T10:00', '2026-01-05T09:00'), quarter, owner).ok).toBe(
      false,
    );
    expect(
      expandMeeting(
        {
          id: 'w',
          kind: 'weekly',
          weekdays: [1],
          startDate: '2026-01-05',
          endDate: '2026-01-05',
          startTime: '10:00',
          endTime: '11:00',
          endDayOffset: 0,
          exclusions: [],
          replacements: [once('2026-03-21T09:00', '2026-03-21T10:00')],
        },
        quarter,
        owner,
      ).ok,
    ).toBe(false);
  });
  it('accepts a recurring fall interval whose explicit offsets put its end after its start', () => {
    const fall = {
      ...quarter,
      instructionStart: '2026-09-28',
      instructionEnd: '2026-12-04',
      examStart: '2026-12-07',
      examEnd: '2026-12-11',
    };
    const meeting: WeeklyMeeting = {
      id: 'fold',
      kind: 'weekly',
      weekdays: [7],
      startDate: '2026-11-01',
      endDate: '2026-11-01',
      startTime: '01:30-07:00',
      endTime: '01:15-08:00',
      endDayOffset: 0,
      exclusions: [],
      replacements: [],
    };
    const result = expandMeeting(meeting, fall, owner);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value[0].end - result.value[0].start).toBe(45 * 60000);
  });
  it('keeps replacement occurrence identities distinct when source IDs contain separators', () => {
    const base: WeeklyMeeting = {
      id: 'm',
      kind: 'weekly',
      weekdays: [1],
      startDate: '2026-01-05',
      endDate: '2026-01-05',
      startTime: '09:00',
      endTime: '10:00',
      endDayOffset: 0,
      exclusions: ['2026-01-05'],
      replacements: [{ ...once('2026-01-06T09:00', '2026-01-06T10:00'), id: 'a/b' }],
    };
    const a = expandMeeting(base, quarter, owner);
    const b = expandMeeting(
      { ...base, id: 'm/a', replacements: [{ ...base.replacements[0], id: 'b' }] },
      quarter,
      owner,
    );
    expect(a.ok && b.ok && a.value[0].id !== b.value[0].id).toBe(true);
  });
  it('preserves supported millisecond precision and rejects finer-than-representation inputs', () => {
    const result = expandMeeting(
      once('2026-01-05T09:00:00.100', '2026-01-05T09:00:00.200'),
      quarter,
      owner,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].end - result.value[0].start).toBe(100);
      expect(result.value[0].localStart).toBe('2026-01-05T09:00:00.1');
    }
    expect(
      expandMeeting(
        once('2026-01-05T09:00:00.000001', '2026-01-05T09:00:00.000002'),
        quarter,
        owner,
      ).ok,
    ).toBe(false);
  });
});
