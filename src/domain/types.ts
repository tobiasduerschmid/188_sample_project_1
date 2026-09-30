/** Shared immutable values at responsibility boundaries. Null means explicitly unknown/unset. */
export interface Problem {
  code: string;
  message: string;
  field?: string;
  ids?: string[];
  recovery?: string[];
}
export type Result<T> = { ok: true; value: T } | { ok: false; errors: Problem[] };
export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const fail = <T = never>(code: string, message: string, field?: string): Result<T> => ({
  ok: false,
  errors: [{ code, message, field }],
});

export interface Quarter {
  id: string;
  name: string;
  timezone: string;
  instructionStart: string;
  instructionEnd: string;
  examStart: string;
  examEnd: string;
}
export type Availability = 'open' | 'full' | 'waitlist' | 'canceled' | 'unknown';
export type Rule =
  | { kind: 'none'; text?: string }
  | { kind: 'unknown'; text?: string }
  | { kind: 'course'; courseId: string; text?: string }
  | { kind: 'all' | 'any'; rules: Rule[]; text?: string }
  | { kind: 'manual'; text: string };
export interface OnceMeeting {
  id: string;
  kind: 'once';
  start: string;
  end: string;
}
export interface WeeklyMeeting {
  id: string;
  kind: 'weekly';
  weekdays: number[];
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  endDayOffset: number;
  exclusions: string[];
  replacements: OnceMeeting[];
}
export type TimedMeeting = OnceMeeting | WeeklyMeeting;
export type Meeting = TimedMeeting | { id: string; kind: 'async' | 'tba' };
export interface Course {
  id: string;
  canonicalId?: string;
  subject: string;
  code: string;
  title: string;
  description: string | null;
  units: number[];
  prerequisite: Rule;
  corequisite: Rule;
  requiredComponents: Record<string, number>;
}
export interface Section {
  id: string;
  courseId: string;
  quarterId: string;
  component: string;
  label: string;
  instructors: string[] | null;
  location: string | null;
  modality: string | null;
  availability: Availability;
  compatibleWith: string[] | null;
  meetings: Meeting[];
  exams: Meeting[] | null;
}
export interface CatalogEnvelope {
  schemaVersion: 1;
  version: string;
  source: { name: string; reference: string; publishedAt: string; demo: boolean };
  quarter: Quarter;
  courses: Course[];
  sections: Section[];
}
export interface CatalogRef {
  quarterId: string;
  version: string;
  digest: string;
}
export interface CatalogManifest {
  schemaVersion: 1;
  quarters: { id: string; name: string; version: string; url: string; digest: string }[];
  retained?: boolean;
  warning?: string;
}
export interface Selection {
  courseId: string;
  sectionIds: string[];
  units: number | null;
  lastKnown: { course: Course; sections: Section[] } | null;
}
export interface PersonalTime {
  id: string;
  label: string;
  meeting: TimedMeeting;
}
export interface HistoryRecord {
  id: string;
  courseId: string;
  status: 'completed' | 'in_progress' | 'not_completed';
  earnedUnits: number | null;
  unmapped?: boolean;
}
export interface AcademicTarget {
  id: string;
  name: string;
  kind: 'count' | 'units';
  threshold: number;
  courseIds: string[];
}
export interface PlanInputs {
  schemaVersion: 1;
  id: string;
  name: string;
  quarterId: string;
  catalogRef: CatalogRef;
  selections: Selection[];
  personalTimes: PersonalTime[];
  unitTarget: { min: number; max: number } | null;
  history: HistoryRecord[];
  historyComplete: boolean;
  targets: AcademicTarget[];
}
export type PlanCommand =
  | { type: 'rename'; name: string }
  | { type: 'addCourse'; courseId: string }
  | { type: 'removeCourse'; courseId: string }
  | { type: 'setSection'; courseId: string; sectionId: string; replaceId?: string }
  | { type: 'removeSection'; courseId: string; sectionId: string }
  | { type: 'setUnits'; courseId: string; units: number | null }
  | { type: 'setUnitTarget'; target: { min: number; max: number } | null }
  | { type: 'upsertPersonalTime'; value: PersonalTime }
  | { type: 'removePersonalTime'; id: string }
  | { type: 'upsertHistory'; value: HistoryRecord }
  | { type: 'removeHistory'; id: string }
  | { type: 'setHistoryComplete'; complete: boolean }
  | { type: 'upsertTarget'; value: AcademicTarget }
  | { type: 'removeTarget'; id: string };
export interface ChangedPlan {
  plan: PlanInputs;
  focusCourseId?: string;
  removed?: { entries: { selection: Selection; index: number }[] };
  warnings: string[];
}
export interface SelectionFact {
  canonicalId: string;
  selections: Selection[];
  course: Course | null;
  sections: { id: string; section: Section | null; lastKnown: Section | null }[];
  complete: boolean;
  issues: string[];
  inactive: boolean;
  units: number | null;
  unitReason: string | null;
  prerequisite: Rule;
  corequisite: Rule;
}
export interface SelectionFacts {
  quarter: Quarter;
  selections: SelectionFact[];
  history: { canonicalId: string | null; records: HistoryRecord[]; ambiguous: boolean }[];
  targets: { target: AcademicTarget; canonicalIds: string[]; unresolvedIds: string[] }[];
  courseNames: Record<string, string>;
}
export interface Occurrence {
  id: string;
  ownerId: string;
  label: string;
  kind: 'class' | 'exam' | 'personal';
  start: number;
  end: number;
  localStart: string;
  localEnd: string;
  sourceId: string;
}
export interface OccurrenceOwner {
  id: string;
  label: string;
  kind: Occurrence['kind'];
}
export interface Conflict {
  id: string;
  a: Occurrence;
  b: Occurrence;
  start: number;
  end: number;
  localStart: string;
  localEnd: string;
}
export interface Diagnostic {
  id: string;
  ownerId: string;
  message: string;
}
export interface ScheduleReport {
  occurrences: Occurrence[];
  conflicts: Conflict[];
  incomplete: Diagnostic[];
  unscheduled: { ownerId: string; label: string; kind: 'async' | 'tba' }[];
  availability: Diagnostic[];
}
export type Truth = 'met' | 'unmet' | 'unverified' | 'projected';
export interface RuleReport {
  status: Truth;
  explanation: string;
  conditions: string[];
}
export interface TargetReport {
  id: string;
  name: string;
  kind: 'count' | 'units';
  threshold: number;
  completed: number;
  projected: number;
  completedRemaining: number;
  projectedRemaining: number;
  status: 'completed' | 'projected' | 'unverified' | 'not_met';
  provisional: boolean;
  contributions: {
    courseId: string;
    label: string;
    completed: number;
    projected: number;
    reason: string;
  }[];
  issues: string[];
}
export interface AcademicReport {
  eligibility: {
    courseId: string;
    label: string;
    prerequisite: RuleReport;
    corequisite: RuleReport;
  }[];
  units: {
    known: number;
    unresolved: string[];
    excluded: string[];
    range: 'below' | 'within' | 'above' | 'incomplete' | 'unset';
  };
  targets: TargetReport[];
  historyIssues: string[];
}
export interface AssessmentKey {
  planId: string;
  generation: number;
  catalogRef: CatalogRef;
}
export interface Assessment {
  key: AssessmentKey;
  schedule: ScheduleReport;
  academic: AcademicReport;
}
export interface SaveReceipt {
  planId: string;
  mutationId: string;
  sessionId: string;
  generation: number;
  fingerprint: string;
  revision: number;
  catalogRef: CatalogRef;
}
export interface StoredPlan {
  schemaVersion: 1;
  inputs: PlanInputs;
  revision: number;
  receipt: SaveReceipt;
  updatedAt: string;
}
export interface CommitRequest {
  operation: 'create' | 'replace' | 'duplicate';
  inputs: PlanInputs;
  expectedRevision: number | null;
  mutationId: string;
  sessionId: string;
  generation: number;
  fingerprint: string;
  catalog: CatalogEnvelope;
}
export interface PlanListItem {
  id: string;
  name: string;
  quarterId: string;
  revision: number;
  updatedAt: string;
}
export interface AdoptionPreview {
  planId: string;
  generation: number;
  oldRef: CatalogRef;
  newRef: CatalogRef;
  fingerprint: string;
  changes: string[];
}
export type SaveState =
  'unsaved' | 'saving' | 'saved' | 'save_failed' | 'revision_conflict' | 'reconciling';
