import type { CatalogSnapshot } from '../catalog/snapshot';
import { expandMeeting } from './calendar';
import { clonePlain, deepFreeze, newId, sameRef } from './identity';
import {
  fail,
  ok,
  type AcademicTarget,
  type ChangedPlan,
  type Course,
  type HistoryRecord,
  type Meeting,
  type PlanCommand,
  type PlanInputs,
  type Result,
  type Rule,
  type Section,
  type Selection,
} from './types';

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const half = (value: unknown): value is number => finite(value) && Number.isInteger(value * 2);
const stringList = (value: unknown): value is string[] => Array.isArray(value) && value.every(text);
const unique = (values: string[]) => new Set(values).size === values.length;
function immutable<T>(value: T): T {
  return deepFreeze(clonePlain(value));
}

export function validateName(name: unknown, field = 'name'): Result<string> {
  if (typeof name !== 'string' || name.trim().length === 0 || Array.from(name.trim()).length > 80)
    return fail(
      'invalid_name',
      'Enter a name from 1 to 80 characters after trimming whitespace.',
      field,
    );
  return ok(name.trim());
}
function validateHistory(value: unknown): value is HistoryRecord {
  return (
    record(value) &&
    text(value.id) &&
    text(value.courseId) &&
    typeof value.status === 'string' &&
    ['completed', 'in_progress', 'not_completed'].includes(value.status) &&
    (value.unmapped === undefined || typeof value.unmapped === 'boolean') &&
    (value.earnedUnits === null ||
      (half(value.earnedUnits) && value.earnedUnits >= 0 && value.earnedUnits <= 30))
  );
}
function validateTarget(value: unknown): value is AcademicTarget {
  return (
    record(value) &&
    text(value.id) &&
    validateName(value.name).ok &&
    (value.kind === 'count' || value.kind === 'units') &&
    finite(value.threshold) &&
    value.threshold > 0 &&
    (value.kind === 'count' ? Number.isInteger(value.threshold) : half(value.threshold)) &&
    stringList(value.courseIds) &&
    value.courseIds.length > 0 &&
    unique(value.courseIds)
  );
}
function validRule(rule: unknown): rule is Rule {
  const pending: { value: unknown; leave: boolean }[] = [{ value: rule, leave: false }];
  const active = new Set<object>();
  const checked = new Set<object>();
  while (pending.length) {
    const { value, leave } = pending.pop()!;
    if (!record(value)) return false;
    if (leave) {
      active.delete(value);
      checked.add(value);
      continue;
    }
    if (checked.has(value)) continue;
    if (active.has(value) || (value.text !== undefined && typeof value.text !== 'string'))
      return false;
    if (value.kind === 'none' || value.kind === 'unknown') continue;
    if (value.kind === 'manual') {
      if (!text(value.text)) return false;
      continue;
    }
    if (value.kind === 'course') {
      if (!text(value.courseId)) return false;
      continue;
    }
    if (
      (value.kind !== 'all' && value.kind !== 'any') ||
      !Array.isArray(value.rules) ||
      value.rules.length === 0
    )
      return false;
    active.add(value);
    pending.push({ value, leave: true });
    for (let index = value.rules.length - 1; index >= 0; index--)
      pending.push({ value: value.rules[index], leave: false });
  }
  return true;
}
function validMeeting(meeting: unknown, timedOnly = false): meeting is Meeting {
  if (!record(meeting) || !text(meeting.id)) return false;
  if (meeting.kind === 'async' || meeting.kind === 'tba') return !timedOnly;
  if (meeting.kind === 'once') return text(meeting.start) && text(meeting.end);
  return (
    meeting.kind === 'weekly' &&
    Array.isArray(meeting.weekdays) &&
    meeting.weekdays.length > 0 &&
    meeting.weekdays.every(
      (day) => Number.isInteger(day) && Number(day) >= 1 && Number(day) <= 7,
    ) &&
    text(meeting.startDate) &&
    text(meeting.endDate) &&
    text(meeting.startTime) &&
    text(meeting.endTime) &&
    Number.isInteger(meeting.endDayOffset) &&
    Number(meeting.endDayOffset) >= 0 &&
    stringList(meeting.exclusions) &&
    Array.isArray(meeting.replacements) &&
    meeting.replacements.every((item) => record(item) && item.kind === 'once' && validMeeting(item))
  );
}
function validCourse(course: unknown): course is Course {
  return (
    record(course) &&
    text(course.id) &&
    text(course.code) &&
    text(course.subject) &&
    text(course.title) &&
    (course.description === null || typeof course.description === 'string') &&
    (course.canonicalId === undefined || text(course.canonicalId)) &&
    Array.isArray(course.units) &&
    course.units.length > 0 &&
    course.units.every((unit) => finite(unit) && unit >= 0) &&
    validRule(course.prerequisite) &&
    validRule(course.corequisite) &&
    record(course.requiredComponents) &&
    Object.entries(course.requiredComponents).every(
      ([component, count]) => text(component) && Number.isInteger(count) && Number(count) > 0,
    )
  );
}
function validSection(section: unknown): section is Section {
  return (
    record(section) &&
    ['id', 'courseId', 'quarterId', 'component', 'label'].every((key) => text(section[key])) &&
    (section.instructors === null || stringList(section.instructors)) &&
    (section.location === null || typeof section.location === 'string') &&
    (section.modality === null || typeof section.modality === 'string') &&
    typeof section.availability === 'string' &&
    ['open', 'full', 'waitlist', 'canceled', 'unknown'].includes(section.availability) &&
    (section.compatibleWith === null || stringList(section.compatibleWith)) &&
    Array.isArray(section.meetings) &&
    section.meetings.every((item) => validMeeting(item)) &&
    (section.exams === null ||
      (Array.isArray(section.exams) && section.exams.every((item) => validMeeting(item))))
  );
}
function validSelection(selection: unknown): selection is Selection {
  return (
    record(selection) &&
    text(selection.courseId) &&
    stringList(selection.sectionIds) &&
    unique(selection.sectionIds) &&
    (selection.units === null || (finite(selection.units) && selection.units >= 0)) &&
    (selection.lastKnown === null ||
      (record(selection.lastKnown) &&
        validCourse(selection.lastKnown.course) &&
        Array.isArray(selection.lastKnown.sections) &&
        selection.lastKnown.sections.every(validSection)))
  );
}
const validRange = (range: unknown): boolean =>
  range === null ||
  (record(range) &&
    half(range.min) &&
    half(range.max) &&
    range.min >= 0 &&
    range.max <= 60 &&
    range.min <= range.max);

/** Reconstitute structure and local invariants without deleting identities unresolved by an adopted catalog. */
export function restorePlan(raw: unknown, catalog?: CatalogSnapshot): Result<PlanInputs> {
  if (
    !record(raw) ||
    raw.schemaVersion !== 1 ||
    !text(raw.id) ||
    !text(raw.quarterId) ||
    !record(raw.catalogRef) ||
    raw.catalogRef.quarterId !== raw.quarterId ||
    !text(raw.catalogRef.version) ||
    !text(raw.catalogRef.digest) ||
    !validateName(raw.name).ok ||
    raw.name !== String(raw.name).trim()
  )
    return fail(
      'invalid_plan',
      'The saved plan identity, name, schema, or catalog reference is invalid.',
    );
  if (
    !Array.isArray(raw.selections) ||
    !raw.selections.every(validSelection) ||
    !unique(raw.selections.map((selection) => selection.courseId))
  )
    return fail(
      'invalid_plan',
      'The saved course selections contain invalid or duplicate identities.',
      'selections',
    );
  if (new Set(raw.selections.flatMap((selection) => selection.sectionIds)).size > 200)
    return fail(
      'component_capacity',
      'A plan may contain at most 200 selected components.',
      'selections',
    );
  if (
    !Array.isArray(raw.personalTimes) ||
    !raw.personalTimes.every(
      (value) =>
        record(value) &&
        text(value.id) &&
        typeof value.label === 'string' &&
        validMeeting(value.meeting, true),
    ) ||
    !unique(raw.personalTimes.map((value) => value.id))
  )
    return fail('invalid_plan', 'The saved personal intervals are invalid.', 'personalTimes');
  if (raw.personalTimes.length > 100)
    return fail(
      'personal_capacity',
      'A plan may contain at most 100 personal intervals.',
      'personalTimes',
    );
  if (!validRange(raw.unitTarget))
    return fail(
      'invalid_unit_target',
      'Use 0 ≤ minimum ≤ maximum ≤ 60 in increments of 0.5.',
      'unitTarget',
    );
  if (
    !Array.isArray(raw.history) ||
    !raw.history.every(validateHistory) ||
    !unique(raw.history.map((value) => value.id)) ||
    typeof raw.historyComplete !== 'boolean'
  )
    return fail('invalid_plan', 'The saved coursework history is invalid.', 'history');
  if (raw.history.length > 200)
    return fail(
      'history_capacity',
      'A plan may contain at most 200 coursework records.',
      'history',
    );
  if (
    !Array.isArray(raw.targets) ||
    !raw.targets.every(validateTarget) ||
    !unique(raw.targets.map((value) => value.id)) ||
    !unique(raw.targets.map((value) => value.name.trim().toLocaleLowerCase()))
  )
    return fail(
      'invalid_plan',
      'The saved academic targets are invalid or contain duplicate names.',
      'targets',
    );
  if (raw.targets.length > 50)
    return fail('target_capacity', 'A plan may contain at most 50 academic targets.', 'targets');
  if (catalog) {
    const inputs = raw as unknown as PlanInputs;
    if (!inContext(inputs, catalog))
      return fail('catalog_mismatch', 'The stored plan does not match its retained catalog.');
    if (effectiveCount(inputs, catalog) > 40)
      return fail(
        'course_capacity',
        'A plan may contain at most 40 distinct courses.',
        'selections',
      );
    for (const time of inputs.personalTimes) {
      const valid = expandMeeting(time.meeting, catalog.envelope.quarter, {
        id: time.id,
        label: time.label || 'Unavailable',
        kind: 'personal',
      });
      if (!valid.ok) return valid;
    }
  }
  try {
    return ok(immutable(raw as unknown as PlanInputs));
  } catch {
    return fail('invalid_plan', 'The saved plan cannot be restored as structured input.');
  }
}

export function createPlan(
  name: string,
  catalog: CatalogSnapshot,
  id = newId(),
): Result<PlanInputs> {
  const checked = validateName(name);
  if (!checked.ok) return checked;
  if (!text(id)) return fail('invalid_identity', 'The plan needs a stable identity.', 'id');
  return ok(
    immutable({
      schemaVersion: 1,
      id,
      name: checked.value,
      quarterId: catalog.ref.quarterId,
      catalogRef: catalog.ref,
      selections: [],
      personalTimes: [],
      unitTarget: null,
      history: [],
      historyComplete: false,
      targets: [],
    }),
  );
}
export function copyPlan(plan: PlanInputs, name: string, id = newId()): Result<PlanInputs> {
  const checked = validateName(name);
  if (!checked.ok) return checked;
  if (id === plan.id || !text(id))
    return fail('invalid_identity', 'The copy needs a new stable identity.', 'id');
  return restorePlan({ ...plan, name: checked.value, id });
}
function inContext(plan: PlanInputs, catalog: CatalogSnapshot): boolean {
  return plan.quarterId === catalog.ref.quarterId && sameRef(plan.catalogRef, catalog.ref);
}
function stableCourseIdentity(input: string, catalog: CatalogSnapshot): string {
  const entered = input.trim();
  const normalized = entered.toLocaleLowerCase();
  // Preserve the declared identity (including an alias), rather than a changeable display code.
  return (
    catalog.envelope.courses.find(
      (course) =>
        course.id.toLocaleLowerCase() === normalized ||
        course.code.toLocaleLowerCase() === normalized,
    )?.id ?? entered
  );
}
function matching(plan: PlanInputs, id: string, catalog: CatalogSnapshot): Selection[] {
  const canonical = catalog.resolveId(id) ?? id;
  return plan.selections.filter(
    (selection) => (catalog.resolveId(selection.courseId) ?? selection.courseId) === canonical,
  );
}
function selectedDetails(selection: Selection, catalog: CatalogSnapshot): Selection['lastKnown'] {
  const course = catalog.course(selection.courseId) ?? selection.lastKnown?.course;
  if (!course) return null;
  const sections = catalog.sectionsFor(selection.courseId);
  return {
    course,
    sections: selection.sectionIds.flatMap((id) => {
      const section =
        sections.find((value) => value.id === id) ??
        selection.lastKnown?.sections.find((value) => value.id === id);
      return section ? [section] : [];
    }),
  };
}
function effectiveCount(plan: PlanInputs, catalog: CatalogSnapshot): number {
  return new Set(
    plan.selections.map((selection) => catalog.resolveId(selection.courseId) ?? selection.courseId),
  ).size;
}
function accept(
  plan: PlanInputs,
  catalog: CatalogSnapshot,
  warnings: string[] = [],
  extra: Omit<ChangedPlan, 'plan' | 'warnings'> = {},
): Result<ChangedPlan> {
  if (effectiveCount(plan, catalog) > 40)
    return fail('course_capacity', 'A plan may contain at most 40 distinct courses.', 'selections');
  const valid = restorePlan(plan);
  return valid.ok ? ok({ plan: valid.value, warnings, ...extra }) : valid;
}

export function editPlan(
  plan: PlanInputs,
  command: PlanCommand,
  catalog: CatalogSnapshot,
): Result<ChangedPlan> {
  if (!inContext(plan, catalog))
    return fail(
      'catalog_mismatch',
      'This edit must use the exact catalog version pinned to the plan.',
    );
  const draft = clonePlain(plan);
  const warnings: string[] = [];
  switch (command.type) {
    case 'rename': {
      const name = validateName(command.name);
      if (!name.ok) return name;
      if (name.value === plan.name) return ok({ plan, warnings });
      draft.name = name.value;
      break;
    }
    case 'addCourse': {
      const enteredId = stableCourseIdentity(command.courseId, catalog);
      const existing = matching(plan, enteredId, catalog);
      if (existing.length) return ok({ plan, focusCourseId: existing[0].courseId, warnings });
      const course = catalog.course(enteredId);
      if (!course) return fail('unknown_course', 'Select a known catalog course.', 'courseId');
      if (
        new Set(
          plan.selections.map(
            (selection) => catalog.resolveId(selection.courseId) ?? selection.courseId,
          ),
        ).size >= 40
      )
        return fail(
          'course_capacity',
          'A plan may contain at most 40 distinct courses.',
          'courseId',
        );
      draft.selections.push({
        courseId: enteredId,
        sectionIds: [],
        units: course.units.length === 1 ? course.units[0] : null,
        lastKnown: { course, sections: [] },
      });
      break;
    }
    case 'removeCourse': {
      const selections = matching(plan, command.courseId, catalog);
      if (!selections.length)
        return fail('unknown_selection', 'This course is not selected.', 'courseId');
      const entries = selections.map((selection) => ({
        selection,
        index: plan.selections.indexOf(selection),
      }));
      draft.selections = draft.selections.filter(
        (selection) => !selections.some((old) => old.courseId === selection.courseId),
      );
      return accept(draft, catalog, warnings, { removed: immutable({ entries }) });
    }
    case 'setSection': {
      const originals = matching(plan, command.courseId, catalog);
      if (!originals.length)
        return fail('unknown_selection', 'Add the course before selecting components.', 'courseId');
      const offered = catalog.sectionsFor(command.courseId);
      const section = offered.find((value) => value.id === command.sectionId);
      if (!section || section.quarterId !== plan.quarterId)
        return fail(
          'unknown_section',
          'Choose a section from this course and quarter.',
          'sectionId',
        );
      if (section.availability === 'canceled')
        return fail('canceled_section', 'Canceled sections cannot be newly selected.', 'sectionId');
      const ids = [...new Set(originals.flatMap((selection) => selection.sectionIds))];
      if (ids.includes(section.id) && !command.replaceId)
        return ok({ plan, focusCourseId: originals[0].courseId, warnings });
      const previous = (id: string) =>
        offered.find((value) => value.id === id) ??
        originals
          .flatMap((selection) => selection.lastKnown?.sections ?? [])
          .find((value) => value.id === id);
      const course = catalog.course(command.courseId)!;
      const sameComponent = ids.filter((id) => previous(id)?.component === section.component);
      const required = course.requiredComponents[section.component];
      if (!required)
        return fail(
          'invalid_component',
          'The catalog does not permit this component for the course.',
          'sectionId',
        );
      let replace = command.replaceId;
      if (replace && (!ids.includes(replace) || previous(replace)?.component !== section.component))
        return fail(
          'invalid_replacement',
          'Choose an existing component of the same type to replace.',
          'sectionId',
        );
      if (!replace && sameComponent.length >= required) {
        if (required === 1) replace = sameComponent[0];
        else
          return fail(
            'component_count',
            `This course allows ${required} ${section.component} components. Choose which component to replace.`,
            'sectionId',
          );
      }
      const proposed = ids.map((id) => (id === replace ? section.id : id));
      if (!replace) proposed.push(section.id);
      const uniqueProposed = [...new Set(proposed)];
      for (const selection of draft.selections.filter((item) =>
        originals.some((original) => original.courseId === item.courseId),
      )) {
        selection.sectionIds = uniqueProposed;
        selection.lastKnown = selectedDetails(selection, catalog);
      }
      const facts = catalog
        .facts(draft)
        .selections.find(
          (fact) => fact.canonicalId === (catalog.resolveId(command.courseId) ?? command.courseId),
        );
      const incompatible = facts?.issues.filter((issue) => /incompatible/i.test(issue)) ?? [];
      if (incompatible.length && !(replace && section.component.toLowerCase() === 'lecture'))
        return fail('incompatible_section', incompatible.join(' '), 'sectionId');
      warnings.push(...incompatible);
      break;
    }
    case 'removeSection': {
      const selected = matching(draft, command.courseId, catalog);
      if (
        !selected.length ||
        !selected.some((selection) => selection.sectionIds.includes(command.sectionId))
      )
        return fail('unknown_section', 'This component is not selected.', 'sectionId');
      for (const selection of selected) {
        selection.sectionIds = selection.sectionIds.filter((id) => id !== command.sectionId);
        selection.lastKnown = selectedDetails(selection, catalog);
      }
      break;
    }
    case 'setUnits': {
      const selections = matching(draft, command.courseId, catalog);
      const course = catalog.course(command.courseId);
      if (!selections.length || !course)
        return fail('unknown_course', 'Resolve this course before choosing units.', 'units');
      if (
        command.units !== null &&
        (!finite(command.units) || !course.units.includes(command.units))
      )
        return fail(
          'invalid_units',
          `Choose one of the permitted unit values: ${course.units.join(', ')}.`,
          'units',
        );
      if (command.units === null && course.units.length === 1)
        return fail('invalid_units', `This course has fixed units: ${course.units[0]}.`, 'units');
      selections.forEach((selection) => {
        selection.units = command.units;
      });
      break;
    }
    case 'setUnitTarget':
      if (!validRange(command.target))
        return fail(
          'invalid_unit_target',
          'Use 0 ≤ minimum ≤ maximum ≤ 60 in increments of 0.5.',
          'unitTarget',
        );
      draft.unitTarget = command.target;
      break;
    case 'upsertPersonalTime': {
      if (
        !record(command.value) ||
        !text(command.value.id) ||
        typeof command.value.label !== 'string' ||
        !validMeeting(command.value.meeting, true)
      )
        return fail(
          'invalid_personal_time',
          'Enter a valid dated or weekly personal interval.',
          'personalTimes',
        );
      const expanded = expandMeeting(command.value.meeting, catalog.envelope.quarter, {
        id: command.value.id,
        label: command.value.label || 'Unavailable',
        kind: 'personal',
      });
      if (!expanded.ok) return expanded;
      const index = draft.personalTimes.findIndex((time) => time.id === command.value.id);
      if (index < 0) draft.personalTimes.push(command.value);
      else draft.personalTimes[index] = command.value;
      break;
    }
    case 'removePersonalTime':
      draft.personalTimes = draft.personalTimes.filter((time) => time.id !== command.id);
      break;
    case 'upsertHistory': {
      if (!validateHistory(command.value))
        return fail(
          'invalid_history',
          'Choose a course and coursework status; earned units must be unknown or 0–30 in increments of 0.5.',
          'history',
        );
      const original = draft.history.find((history) => history.id === command.value.id);
      const keepIdentity =
        original && !original.unmapped && original.courseId === command.value.courseId.trim();
      const entered = {
        ...command.value,
        courseId: keepIdentity
          ? original.courseId
          : stableCourseIdentity(command.value.courseId, catalog),
        unmapped: keepIdentity ? false : catalog.resolve(command.value.courseId) === null,
      };
      const canonical = entered.unmapped ? null : catalog.resolveId(entered.courseId);
      const other = draft.history.find(
        (history) =>
          history.id !== entered.id &&
          (canonical !== null
            ? !history.unmapped && catalog.resolveId(history.courseId) === canonical
            : history.courseId.trim().toLocaleLowerCase() === entered.courseId.toLocaleLowerCase()),
      );
      const editingExistingGroup =
        original &&
        !original.unmapped &&
        canonical !== null &&
        catalog.resolveId(original.courseId) === canonical;
      if (other && !editingExistingGroup)
        return fail(
          'duplicate_history',
          'This canonical course already has coursework history. Edit the existing record; resolve equivalent records before adding another.',
          'history',
        );
      const index = draft.history.findIndex((history) => history.id === entered.id);
      if (index < 0) draft.history.push(entered);
      else draft.history[index] = entered;
      break;
    }
    case 'removeHistory':
      draft.history = draft.history.filter((history) => history.id !== command.id);
      break;
    case 'setHistoryComplete':
      if (typeof command.complete !== 'boolean')
        return fail(
          'invalid_history',
          'Declare whether the history is complete.',
          'historyComplete',
        );
      draft.historyComplete = command.complete;
      break;
    case 'upsertTarget': {
      if (!record(command.value) || !Array.isArray(command.value.courseIds))
        return fail('invalid_target', 'Enter an academic target.', 'targets');
      const name = validateName(command.value.name, 'targetName');
      if (!name.ok) return name;
      const existing = draft.targets.find((other) => other.id === command.value.id);
      const target = {
        ...command.value,
        name: name.value,
        courseIds: [
          ...new Set(
            command.value.courseIds.map((id) =>
              typeof id === 'string'
                ? existing?.courseIds.includes(id.trim())
                  ? id.trim()
                  : stableCourseIdentity(id, catalog)
                : id,
            ),
          ),
        ],
      };
      if (!validateTarget(target))
        return fail(
          'invalid_target',
          'Choose a nonempty eligible set and a positive integer count or positive unit threshold in increments of 0.5.',
          'targets',
        );
      if (
        draft.targets.some(
          (other) =>
            other.id !== target.id &&
            other.name.toLocaleLowerCase() === target.name.toLocaleLowerCase(),
        )
      )
        return fail(
          'duplicate_target_name',
          'Choose a target name that is unique within this plan.',
          'targetName',
        );
      const unresolved = target.courseIds.filter(
        (id) => catalog.resolveId(id) === null && !existing?.courseIds.includes(id),
      );
      if (unresolved.length)
        return fail(
          'unknown_target_course',
          `Choose known eligible courses. Unrecognized: ${unresolved.join(', ')}.`,
          'targetCourses',
        );
      const distinct = new Set(target.courseIds.map((id) => catalog.resolveId(id) ?? id)).size;
      if (target.kind === 'count' && target.threshold > distinct)
        warnings.push(
          `The count threshold ${target.threshold} exceeds the ${distinct} distinct eligible courses.`,
        );
      const index = draft.targets.findIndex((other) => other.id === target.id);
      if (index < 0) draft.targets.push(target);
      else draft.targets[index] = target;
      break;
    }
    case 'removeTarget':
      draft.targets = draft.targets.filter((target) => target.id !== command.id);
      break;
    default:
      return fail('unknown_command', 'This plan edit is not supported.');
  }
  return accept(draft, catalog, warnings);
}

export function adoptCatalog(
  plan: PlanInputs,
  oldCatalog: CatalogSnapshot,
  newCatalog: CatalogSnapshot,
): Result<ChangedPlan> {
  if (!inContext(plan, oldCatalog))
    return fail(
      'catalog_mismatch',
      'Catalog adoption requires the exact currently pinned version.',
    );
  if (newCatalog.ref.quarterId !== plan.quarterId)
    return fail('quarter_mismatch', 'A plan remains bound to its original quarter.');
  if (sameRef(plan.catalogRef, newCatalog.ref)) return ok({ plan, warnings: [] });
  const draft = clonePlain(plan);
  draft.catalogRef = clonePlain(newCatalog.ref);
  draft.selections = draft.selections.map((selection) => ({
    ...selection,
    lastKnown: selectedDetails(selection, oldCatalog),
  }));
  draft.history = draft.history.map((history) =>
    history.unmapped === undefined && oldCatalog.resolveId(history.courseId) === null
      ? { ...history, unmapped: true }
      : history,
  );
  const facts = newCatalog.facts(draft);
  const warnings = facts.selections.flatMap((fact) => fact.issues);
  return accept(draft, newCatalog, warnings);
}
export function restoreRemoval(
  plan: PlanInputs,
  memento: NonNullable<ChangedPlan['removed']>,
  catalog: CatalogSnapshot,
): Result<ChangedPlan> {
  if (!inContext(plan, catalog))
    return fail('catalog_mismatch', 'Undo requires the original plan catalog.');
  if (
    !record(memento) ||
    !Array.isArray(memento.entries) ||
    memento.entries.length === 0 ||
    memento.entries.some(
      (entry) =>
        !record(entry) ||
        !validSelection(entry.selection) ||
        !Number.isInteger(entry.index) ||
        entry.index < 0,
    )
  )
    return fail('invalid_undo', 'The removed selections cannot be restored.');
  if (
    !unique(memento.entries.map((entry) => entry.selection.courseId)) ||
    !unique(memento.entries.map((entry) => String(entry.index)))
  )
    return fail('invalid_undo', 'The removed selection identities and positions must be distinct.');
  if (memento.entries.some((entry) => matching(plan, entry.selection.courseId, catalog).length))
    return fail('duplicate_course', 'This course has already been restored.');
  const draft = clonePlain(plan);
  for (const entry of [...memento.entries].sort((a, b) => a.index - b.index))
    draft.selections.splice(
      Math.min(entry.index, draft.selections.length),
      0,
      clonePlain(entry.selection),
    );
  return accept(draft, catalog);
}
