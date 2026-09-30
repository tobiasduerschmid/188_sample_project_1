import { Temporal } from '@js-temporal/polyfill';
import {
  fail,
  ok,
  type Meeting,
  type Occurrence,
  type OccurrenceOwner,
  type Quarter,
  type Result,
} from './types';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:[+-]\d{2}:\d{2})?$/;
const dateTimePattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:[+-]\d{2}:\d{2})?$/;
function date(value: string): Temporal.PlainDate {
  if (typeof value !== 'string' || !datePattern.test(value))
    throw new Error('Use an ISO date (YYYY-MM-DD).');
  return Temporal.PlainDate.from(value, { overflow: 'reject' });
}
function zoned(value: string, timezone: string): Temporal.ZonedDateTime {
  if (typeof value !== 'string' || !dateTimePattern.test(value))
    throw new Error(
      'Use an institution-local date and time with at most millisecond precision, optionally with an explicit UTC offset.',
    );
  return Temporal.ZonedDateTime.from(`${value}[${timezone}]`, {
    disambiguation: 'reject',
    offset: 'reject',
    overflow: 'reject',
  });
}
/** These bounds also gate recurrence expansion, so invalid input cannot start an unbounded loop. */
export function validateQuarter(quarter: Quarter): Result<Quarter> {
  try {
    const first = date(quarter.instructionStart);
    const lastInstruction = date(quarter.instructionEnd);
    const firstExam = date(quarter.examStart);
    const last = date(quarter.examEnd);
    if (
      Temporal.PlainDate.compare(first, lastInstruction) > 0 ||
      Temporal.PlainDate.compare(firstExam, last) > 0 ||
      Temporal.PlainDate.compare(firstExam, first) < 0 ||
      Temporal.PlainDate.compare(last, lastInstruction) < 0
    )
      return fail(
        'quarter_dates',
        'Instruction and examination dates must be ordered within the quarter.',
        'quarter',
      );
    if (first.until(last).days >= 140)
      return fail(
        'catalog_capacity',
        'A quarter including examinations may span at most 20 weeks (140 days).',
        'quarter',
      );
    if (
      typeof quarter.timezone !== 'string' ||
      !quarter.timezone.trim() ||
      /^[+-]/.test(quarter.timezone)
    )
      return fail('timezone', 'Use a named institution timezone.', 'quarter.timezone');
    first.toZonedDateTime(quarter.timezone);
    return ok(quarter);
  } catch (error) {
    return fail(
      'quarter_dates',
      `Invalid quarter date or timezone: ${error instanceof Error ? error.message : String(error)}`,
      'quarter',
    );
  }
}

export function localDateTime(instant: number, timezone: string): string {
  return Temporal.Instant.fromEpochMilliseconds(instant)
    .toZonedDateTimeISO(timezone)
    .toPlainDateTime()
    .toString();
}

export function expandMeeting(
  meeting: Meeting,
  quarter: Quarter,
  owner: OccurrenceOwner,
): Result<Occurrence[]> {
  const validQuarter = validateQuarter(quarter);
  if (!validQuarter.ok) return validQuarter;
  let field = 'meeting';
  try {
    if (
      !meeting ||
      typeof meeting !== 'object' ||
      typeof meeting.id !== 'string' ||
      !meeting.id.trim()
    )
      return fail(
        'meeting',
        'A meeting requires a stable identifier and explicit classification.',
        field,
      );
    if (meeting.kind === 'async' || meeting.kind === 'tba') return ok([]);
    const first = date(quarter.instructionStart);
    const last = date(quarter.examEnd);
    const boundsStart = first.toZonedDateTime(quarter.timezone).epochMilliseconds;
    const boundsEnd = last.add({ days: 1 }).toZonedDateTime(quarter.timezone).epochMilliseconds;
    const occurrences: Occurrence[] = [];
    const add = (startText: string, endText: string, sourceId: string) => {
      field = 'start';
      const start = zoned(startText, quarter.timezone);
      field = 'end';
      const end = zoned(endText, quarter.timezone);
      if (start.epochNanoseconds >= end.epochNanoseconds)
        throw new Error('The end must be after the start.');
      if (start.epochMilliseconds < boundsStart || end.epochMilliseconds > boundsEnd)
        throw new Error('Every occurrence must lie within the quarter instruction/exam span.');
      occurrences.push({
        id: JSON.stringify([
          owner.kind,
          owner.id,
          meeting.id,
          sourceId,
          start.toString(),
          end.toString(),
        ]),
        ownerId: owner.id,
        label: owner.label,
        kind: owner.kind,
        sourceId,
        start: start.epochMilliseconds,
        end: end.epochMilliseconds,
        localStart: start.toPlainDateTime().toString(),
        localEnd: end.toPlainDateTime().toString(),
      });
    };
    if (meeting.kind === 'once') add(meeting.start, meeting.end, meeting.id);
    else if (meeting.kind === 'weekly') {
      field = 'weekdays';
      if (
        !Array.isArray(meeting.weekdays) ||
        meeting.weekdays.length === 0 ||
        meeting.weekdays.some((d) => !Number.isInteger(d) || d < 1 || d > 7) ||
        new Set(meeting.weekdays).size !== meeting.weekdays.length
      )
        throw new Error('Select distinct weekdays from 1 (Monday) through 7 (Sunday).');
      field = 'startDate';
      const startDate = date(meeting.startDate);
      field = 'endDate';
      const endDate = date(meeting.endDate);
      if (
        Temporal.PlainDate.compare(startDate, endDate) > 0 ||
        Temporal.PlainDate.compare(startDate, first) < 0 ||
        Temporal.PlainDate.compare(endDate, last) > 0
      )
        throw new Error('Recurrence dates must be ordered and within the quarter.');
      field = 'startTime';
      if (typeof meeting.startTime !== 'string' || !timePattern.test(meeting.startTime))
        throw new Error('Use a valid local start time.');
      field = 'endTime';
      if (typeof meeting.endTime !== 'string' || !timePattern.test(meeting.endTime))
        throw new Error('Use a valid local end time.');
      // Validate clocks even if the date range contains no matching weekday.
      Temporal.PlainTime.from(meeting.startTime.replace(/[+-]\d{2}:\d{2}$/, ''), {
        overflow: 'reject',
      });
      Temporal.PlainTime.from(meeting.endTime.replace(/[+-]\d{2}:\d{2}$/, ''), {
        overflow: 'reject',
      });
      field = 'endDayOffset';
      if (!Number.isSafeInteger(meeting.endDayOffset) || meeting.endDayOffset < 0)
        throw new Error('Overnight end-day offset must be a nonnegative integer.');
      if (
        meeting.endDayOffset === 0 &&
        !/[+-]\d{2}:\d{2}$/.test(meeting.startTime) &&
        !/[+-]\d{2}:\d{2}$/.test(meeting.endTime) &&
        Temporal.PlainTime.compare(meeting.startTime, meeting.endTime) >= 0
      )
        throw new Error(
          'The end must be after the start; use an end-day offset for overnight meetings.',
        );
      field = 'exclusions';
      if (!Array.isArray(meeting.exclusions))
        throw new Error('Supply an array of excluded dates, even when empty.');
      for (const value of meeting.exclusions) {
        const excluded = date(value);
        if (
          Temporal.PlainDate.compare(excluded, startDate) < 0 ||
          Temporal.PlainDate.compare(excluded, endDate) > 0
        )
          throw new Error('Excluded dates must be within the recurrence date range.');
      }
      const excluded = new Set(meeting.exclusions);
      for (
        let day = startDate;
        Temporal.PlainDate.compare(day, endDate) <= 0;
        day = day.add({ days: 1 })
      ) {
        if (meeting.weekdays.includes(day.dayOfWeek) && !excluded.has(day.toString()))
          add(
            `${day}T${meeting.startTime}`,
            `${day.add({ days: meeting.endDayOffset })}T${meeting.endTime}`,
            meeting.id,
          );
      }
      field = 'replacements';
      if (!Array.isArray(meeting.replacements))
        throw new Error('Supply an array of replacement meetings, even when empty.');
      for (const replacement of meeting.replacements) {
        if (
          !replacement ||
          replacement.kind !== 'once' ||
          typeof replacement.id !== 'string' ||
          !replacement.id.trim()
        )
          throw new Error('Each replacement must be a dated meeting with an identifier.');
        add(replacement.start, replacement.end, `${meeting.id}/${replacement.id}`);
      }
    } else
      return fail(
        'meeting',
        'Choose a timed, asynchronous, or TBA meeting classification.',
        'kind',
      );
    occurrences.sort((a, b) => a.start - b.start || a.end - b.end || a.id.localeCompare(b.id));
    return ok(occurrences);
  } catch (error) {
    return fail(
      'meeting_time',
      `Correct ${field}: ${error instanceof Error ? error.message : String(error)} Ambiguous local times require an explicit valid UTC offset; nonexistent local times must be corrected.`,
      field,
    );
  }
}
