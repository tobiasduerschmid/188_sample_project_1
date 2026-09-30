import { Temporal } from '@js-temporal/polyfill';
import { expandMeeting, validateQuarter } from '../domain/calendar';
import type {
  Availability,
  CatalogEnvelope,
  Course,
  Meeting,
  Problem,
  Quarter,
  Result,
  Rule,
  Section,
} from '../domain/types';

type ObjectValue = Record<string, unknown>;
const object = (value: unknown): value is ObjectValue =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const statuses: Availability[] = ['open', 'full', 'waitlist', 'canceled', 'unknown'];

/** One boundary is used by both public fetching and maintainer publication. */
export function validateCatalog(raw: unknown): Result<CatalogEnvelope> {
  const errors: Problem[] = [];
  const error = (field: string, message: string, code = 'catalog_invalid') =>
    errors.push({ code, field, message: `${field}: ${message}` });
  const keys = (value: ObjectValue, allowed: string[], field: string) => {
    for (const key of Object.keys(value))
      if (!allowed.includes(key))
        error(
          field ? `${field}.${key}` : key,
          'Unknown field; public catalogs may contain only documented catalog fields.',
        );
  };
  const requiredText = (value: unknown, field: string): string => {
    if (!text(value)) {
      error(field, 'A nonblank string is required.');
      return '';
    }
    return value;
  };
  const identity = (value: unknown, field: string): string => {
    const result = requiredText(value, field);
    if (result !== result.trim())
      error(field, 'Identity tokens must not contain surrounding whitespace.');
    return result;
  };
  const nullableText = (value: unknown, field: string): string | null => {
    if (value === null) return null;
    return requiredText(value, field);
  };
  const strings = (value: unknown, field: string, nonempty = false): string[] => {
    if (!Array.isArray(value)) {
      error(field, 'An array is required.');
      return [];
    }
    if (nonempty && value.length === 0)
      error(field, 'At least one value is required; use null for unknown information.');
    const result = value.map((v, i) => requiredText(v, `${field}[${i}]`));
    if (new Set(result).size !== result.length) error(field, 'Duplicate values are not allowed.');
    return result;
  };
  if (!object(raw))
    return {
      ok: false,
      errors: [
        { code: 'catalog_invalid', field: 'catalog', message: 'Catalog must be an object.' },
      ],
    };
  keys(raw, ['schemaVersion', 'version', 'source', 'quarter', 'courses', 'sections'], '');
  if (raw.schemaVersion !== 1) error('schemaVersion', 'Expected schema version 1.');
  const version = requiredText(raw.version, 'version');
  const source = object(raw.source) ? raw.source : {};
  if (!object(raw.source)) error('source', 'Source metadata is required.');
  keys(source, ['name', 'reference', 'publishedAt', 'demo'], 'source');
  const publishedAt = requiredText(source.publishedAt, 'source.publishedAt');
  try {
    Temporal.Instant.from(publishedAt);
  } catch {
    error('source.publishedAt', 'A valid ISO timestamp with an offset is required.');
  }
  if (typeof source.demo !== 'boolean')
    error('source.demo', 'Explicitly identify whether this is demonstration data.');
  const acceptedSource = {
    name: requiredText(source.name, 'source.name'),
    reference: requiredText(source.reference, 'source.reference'),
    publishedAt,
    demo: source.demo === true,
  };
  const q = object(raw.quarter) ? raw.quarter : {};
  if (!object(raw.quarter)) error('quarter', 'Quarter metadata is required.');
  const quarterKeys = [
    'id',
    'name',
    'timezone',
    'instructionStart',
    'instructionEnd',
    'examStart',
    'examEnd',
  ];
  keys(q, quarterKeys, 'quarter');
  const quarter = Object.fromEntries(
    quarterKeys.map((key) => [
      key,
      key === 'id' ? identity(q[key], `quarter.${key}`) : requiredText(q[key], `quarter.${key}`),
    ]),
  ) as unknown as Quarter;
  const quarterResult = validateQuarter(quarter);
  if (!quarterResult.ok) errors.push(...quarterResult.errors);
  if (!Array.isArray(raw.courses)) error('courses', 'An array of courses is required.');
  if (!Array.isArray(raw.sections)) error('sections', 'An array of sections is required.');
  const rawCourses = Array.isArray(raw.courses) ? raw.courses : [];
  const rawSections = Array.isArray(raw.sections) ? raw.sections : [];
  if (rawCourses.length > 5000)
    error('courses', 'Catalog capacity is 5,000 courses.', 'catalog_capacity');
  if (rawSections.length > 20000)
    error('sections', 'Catalog capacity is 20,000 sections.', 'catalog_capacity');
  const rule = (value: unknown, field: string): Rule => {
    let result: Rule = { kind: 'unknown' };
    type Work = { value: unknown; field: string; assign: (rule: Rule) => void } | { leave: object };
    const pending: Work[] = [
      {
        value,
        field,
        assign: (rule) => {
          result = rule;
        },
      },
    ];
    const ancestors = new WeakSet<object>();
    while (pending.length) {
      const work = pending.pop()!;
      if ('leave' in work) {
        ancestors.delete(work.leave);
        continue;
      }
      const { value: input, field: path, assign } = work;
      // Missing evidence is unknown, never an explicit absence of restrictions.
      if (input === null || input === undefined) {
        assign({ kind: 'unknown' });
        continue;
      }
      if (!object(input)) {
        error(path, 'Use a tagged academic rule or explicit unknown.');
        assign({ kind: 'unknown' });
        continue;
      }
      if (ancestors.has(input)) {
        error(path, 'Cyclic rule data is invalid.');
        assign({ kind: 'unknown' });
        continue;
      }
      ancestors.add(input);
      pending.push({ leave: input });
      const sourceText =
        input.text === undefined ? undefined : requiredText(input.text, `${path}.text`);
      const explanation = sourceText === undefined ? {} : { text: sourceText };
      if (input.kind === 'none' || input.kind === 'unknown') {
        keys(input, ['kind', 'text'], path);
        assign({ kind: input.kind, ...explanation });
      } else if (input.kind === 'course') {
        keys(input, ['kind', 'courseId', 'text'], path);
        assign({
          kind: 'course',
          courseId: identity(input.courseId, `${path}.courseId`),
          ...explanation,
        });
      } else if (input.kind === 'all' || input.kind === 'any') {
        keys(input, ['kind', 'rules', 'text'], path);
        if (!Array.isArray(input.rules) || !input.rules.length)
          error(`${path}.rules`, 'Logical rule expressions require at least one operand.');
        const rules: Rule[] = [];
        assign({ kind: input.kind, rules, ...explanation });
        if (Array.isArray(input.rules))
          for (let i = input.rules.length - 1; i >= 0; i--)
            pending.push({
              value: input.rules[i],
              field: `${path}.rules[${i}]`,
              assign: (child) => {
                rules[i] = child;
              },
            });
      } else {
        keys(input, ['kind', 'text'], path);
        if (!text(input.kind)) error(`${path}.kind`, 'A rule classification is required.');
        assign({ kind: 'manual', text: requiredText(input.text, `${path}.text`) });
      }
    }
    return result;
  };
  const courses: Course[] = rawCourses.map((rawCourse, index) => {
    const field = `courses[${index}]`;
    const c = object(rawCourse) ? rawCourse : {};
    if (!object(rawCourse)) error(field, 'Course must be an object.');
    keys(
      c,
      [
        'id',
        'canonicalId',
        'subject',
        'code',
        'title',
        'description',
        'units',
        'prerequisite',
        'corequisite',
        'requiredComponents',
      ],
      field,
    );
    const units = Array.isArray(c.units) ? c.units : [];
    if (
      !units.length ||
      units.some((u) => typeof u !== 'number' || !Number.isFinite(u) || u < 0) ||
      new Set(units).size !== units.length
    )
      error(`${field}.units`, 'Supply distinct, finite, nonnegative permitted unit values.');
    const components = object(c.requiredComponents) ? c.requiredComponents : {};
    if (
      !object(c.requiredComponents) ||
      !Object.keys(components).length ||
      Object.entries(components).some(
        ([key, n]) => !key.trim() || typeof n !== 'number' || !Number.isSafeInteger(n) || n <= 0,
      )
    )
      error(
        `${field}.requiredComponents`,
        'Supply nonblank component names and positive integer required counts.',
      );
    return {
      id: identity(c.id, `${field}.id`),
      ...(c.canonicalId === undefined
        ? {}
        : { canonicalId: identity(c.canonicalId, `${field}.canonicalId`) }),
      subject: requiredText(c.subject, `${field}.subject`),
      code: identity(c.code, `${field}.code`),
      title: requiredText(c.title, `${field}.title`),
      description: nullableText(c.description, `${field}.description`),
      units: units as number[],
      prerequisite: rule(c.prerequisite, `${field}.prerequisite`),
      corequisite: rule(c.corequisite, `${field}.corequisite`),
      requiredComponents: { ...components } as Record<string, number>,
    };
  });
  const meeting = (value: unknown, field: string): Meeting | null => {
    if (!object(value)) {
      error(field, 'Meeting must have an explicit classification.');
      return null;
    }
    const id = requiredText(value.id, `${field}.id`);
    if (value.kind === 'async' || value.kind === 'tba') {
      keys(value, ['id', 'kind'], field);
      return { id, kind: value.kind };
    }
    if (value.kind === 'once') {
      keys(value, ['id', 'kind', 'start', 'end'], field);
      return {
        id,
        kind: 'once',
        start: requiredText(value.start, `${field}.start`),
        end: requiredText(value.end, `${field}.end`),
      };
    }
    if (value.kind === 'weekly') {
      keys(
        value,
        [
          'id',
          'kind',
          'weekdays',
          'startDate',
          'endDate',
          'startTime',
          'endTime',
          'endDayOffset',
          'exclusions',
          'replacements',
        ],
        field,
      );
      const weekdays =
        Array.isArray(value.weekdays) && value.weekdays.every((d) => typeof d === 'number')
          ? (value.weekdays as number[])
          : [];
      if (!Array.isArray(value.weekdays) || value.weekdays.some((d) => typeof d !== 'number'))
        error(`${field}.weekdays`, 'Supply ISO weekday numbers.');
      if (typeof value.endDayOffset !== 'number')
        error(`${field}.endDayOffset`, 'Supply a nonnegative integer end-day offset.');
      if (!Array.isArray(value.replacements))
        error(`${field}.replacements`, 'Supply dated replacements, even when empty.');
      const replacements = Array.isArray(value.replacements)
        ? value.replacements.map((r, i) => {
            if (!object(r) || r.kind !== 'once') {
              error(`${field}.replacements[${i}]`, 'Replacement must be a dated once meeting.');
              return null;
            }
            return meeting(r, `${field}.replacements[${i}]`);
          })
        : [];
      for (const r of replacements)
        if (r && r.kind !== 'once')
          error(`${field}.replacements`, 'Replacements must be dated once meetings.');
      if (new Set(replacements.filter((r) => r).map((r) => r!.id)).size !== replacements.length)
        error(`${field}.replacements`, 'Replacement identifiers must be distinct.');
      return {
        id,
        kind: 'weekly',
        weekdays,
        startDate: requiredText(value.startDate, `${field}.startDate`),
        endDate: requiredText(value.endDate, `${field}.endDate`),
        startTime: requiredText(value.startTime, `${field}.startTime`),
        endTime: requiredText(value.endTime, `${field}.endTime`),
        endDayOffset: typeof value.endDayOffset === 'number' ? value.endDayOffset : NaN,
        exclusions: strings(value.exclusions, `${field}.exclusions`),
        replacements: replacements.filter(
          (r): r is Extract<Meeting, { kind: 'once' }> => r?.kind === 'once',
        ),
      };
    }
    error(`${field}.kind`, 'Choose once, weekly, async, or tba.');
    return null;
  };
  // Many catalog sections share temporal definitions. Reuse only temporal validity;
  // identity checks and record-specific error attribution still run for every record.
  const temporalChecks = new Map<string, Problem[]>();
  const meetings = (value: unknown, field: string, required: boolean): Meeting[] => {
    if (!Array.isArray(value)) {
      error(field, 'An explicit meeting array is required.');
      return [];
    }
    if (required && value.length === 0)
      error(field, 'Required meeting classification cannot be blank; supply timed, async, or tba.');
    const result = value
      .map((m, i) => {
        const parsed = meeting(m, `${field}[${i}]`);
        if (parsed && quarterResult.ok) {
          const key = JSON.stringify({
            ...parsed,
            id: '',
            ...(parsed.kind === 'weekly'
              ? { replacements: parsed.replacements.map((r) => ({ ...r, id: '' })) }
              : {}),
          });
          let issues = temporalChecks.get(key);
          if (!issues) {
            const expanded = expandMeeting(parsed, quarter, {
              id: field,
              label: field,
              kind: 'class',
            });
            issues = expanded.ok ? [] : expanded.errors;
            temporalChecks.set(key, issues);
          }
          for (const e of issues)
            error(`${field}[${i}]${e.field ? `.${e.field}` : ''}`, e.message, e.code);
        }
        return parsed;
      })
      .filter((m): m is Meeting => m !== null);
    if (new Set(result.map((m) => m.id)).size !== result.length)
      error(field, 'Meeting identifiers must be distinct within the list.');
    return result;
  };
  const sections: Section[] = rawSections.map((rawSection, index) => {
    const field = `sections[${index}]`;
    const s = object(rawSection) ? rawSection : {};
    if (!object(rawSection)) error(field, 'Section must be an object.');
    keys(
      s,
      [
        'id',
        'courseId',
        'quarterId',
        'component',
        'label',
        'instructors',
        'location',
        'modality',
        'availability',
        'compatibleWith',
        'meetings',
        'exams',
      ],
      field,
    );
    if (!statuses.includes(s.availability as Availability))
      error(`${field}.availability`, 'Use open, full, waitlist, canceled, or unknown.');
    return {
      id: requiredText(s.id, `${field}.id`),
      courseId: requiredText(s.courseId, `${field}.courseId`),
      quarterId: requiredText(s.quarterId, `${field}.quarterId`),
      component: requiredText(s.component, `${field}.component`),
      label: requiredText(s.label, `${field}.label`),
      instructors:
        s.instructors === null ? null : strings(s.instructors, `${field}.instructors`, true),
      location: nullableText(s.location, `${field}.location`),
      modality: nullableText(s.modality, `${field}.modality`),
      availability: s.availability as Availability,
      compatibleWith:
        s.compatibleWith === null ? null : strings(s.compatibleWith, `${field}.compatibleWith`),
      meetings: meetings(s.meetings, `${field}.meetings`, true),
      exams: s.exams === null ? null : meetings(s.exams, `${field}.exams`, false),
    };
  });
  const ids = new Map<string, Course>();
  const identifiers = new Map<string, string>();
  courses.forEach((c, i) => {
    if (ids.has(c.id)) error(`courses[${i}].id`, `Duplicate course identity ${c.id}.`);
    else ids.set(c.id, c);
    for (const token of [c.id, c.code]) {
      const normalized = token.toLocaleLowerCase();
      if (identifiers.has(normalized) && identifiers.get(normalized) !== c.id)
        error(`courses[${i}].code`, `Ambiguous course identity/code ${token}.`);
      else identifiers.set(normalized, c.id);
    }
  });
  const checkRuleRefs = (r: Rule, field: string) => {
    const pending = [{ rule: r, field }];
    while (pending.length) {
      const current = pending.pop()!;
      if (current.rule.kind === 'course' && !ids.has(current.rule.courseId))
        error(`${current.field}.courseId`, `Unknown course reference ${current.rule.courseId}.`);
      if (current.rule.kind === 'all' || current.rule.kind === 'any')
        current.rule.rules.forEach((child, i) =>
          pending.push({ rule: child, field: `${current.field}.rules[${i}]` }),
        );
    }
  };
  courses.forEach((c, i) => {
    if (c.canonicalId !== undefined && c.canonicalId !== c.id) {
      const canonical = ids.get(c.canonicalId);
      if (
        !canonical ||
        (canonical.canonicalId !== undefined && canonical.canonicalId !== canonical.id)
      )
        error(
          `courses[${i}].canonicalId`,
          'Equivalences must reference a directly declared canonical course; chains and cycles are invalid.',
        );
    }
    checkRuleRefs(c.prerequisite, `courses[${i}].prerequisite`);
    checkRuleRefs(c.corequisite, `courses[${i}].corequisite`);
  });
  const sectionIds = new Map<string, Section>();
  sections.forEach((s, i) => {
    if (sectionIds.has(s.id)) error(`sections[${i}].id`, `Duplicate section identity ${s.id}.`);
    else sectionIds.set(s.id, s);
  });
  const canonical = (id: string) => ids.get(id)?.canonicalId ?? id;
  sections.forEach((s, i) => {
    const field = `sections[${i}]`;
    const course = ids.get(canonical(s.courseId));
    if (!ids.has(s.courseId)) error(`${field}.courseId`, `Unknown course ${s.courseId}.`);
    if (s.quarterId !== quarter.id)
      error(`${field}.quarterId`, 'Section quarter must match this snapshot.');
    if (course && !Object.hasOwn(course.requiredComponents, s.component))
      error(`${field}.component`, 'Section component is not declared by the course.');
    for (const id of s.compatibleWith ?? []) {
      const linked = sectionIds.get(id);
      if (
        !linked ||
        linked.id === s.id ||
        canonical(linked.courseId) !== canonical(s.courseId) ||
        linked.component === s.component
      )
        error(
          `${field}.compatibleWith`,
          `Invalid linked section ${id}; link another component of the same canonical course.`,
        );
      else if (linked.compatibleWith !== null && !linked.compatibleWith.includes(s.id))
        error(`${field}.compatibleWith`, `Explicit linkage with ${id} must be symmetric.`);
    }
  });
  return errors.length
    ? { ok: false, errors }
    : {
        ok: true,
        value: { schemaVersion: 1, version, source: acceptedSource, quarter, courses, sections },
      };
}
