import { validateCatalog } from '../../src/catalog/boundary';
import { CatalogSnapshot } from '../../src/catalog/snapshot';
import { fingerprint } from '../../src/domain/identity';
import { restorePlan } from '../../src/domain/plan';
import type {
  CatalogEnvelope,
  CatalogManifest,
  Course,
  PlanInputs,
  Section,
  StoredPlan,
  WeeklyMeeting,
} from '../../src/domain/types';

const pad = (value: number) => String(value).padStart(4, '0');
const time = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const quarterId = 'performance-2026';

/** Every reference capacity is occupied. Temporal output is bounded, without dropping any inputs. */
export async function maximumWorkload() {
  const courses: Course[] = Array.from({ length: 5000 }, (_, index) => ({
    id: `performance-course-${pad(index)}`,
    code: `PERF${pad(index)}`,
    subject: 'PERF',
    title: `Workload course ${pad(index)}`,
    description: `Synthetic maximum-workload course ${index}.`,
    units: [1],
    prerequisite:
      index < 40 ? { kind: 'course', courseId: 'performance-course-4999' } : { kind: 'none' },
    corequisite: { kind: 'none' },
    requiredComponents:
      index < 40
        ? Object.fromEntries(
            Array.from({ length: 5 }, (_, component) => [`component${component}`, 1]),
          )
        : { lecture: 1 },
  }));
  const weekly = (id: string, slot: number): WeeklyMeeting => ({
    id,
    kind: 'weekly',
    weekdays: [Math.floor(slot / 40) + 1],
    startDate: '2026-01-05',
    endDate: '2026-05-17',
    startTime: time(480 + (slot % 40) * 15),
    endTime: time(495 + (slot % 40) * 15),
    endDayOffset: 0,
    exclusions: [],
    replacements: [],
  });
  const sections: Section[] = courses.flatMap((course, index) =>
    Array.from({ length: index < 40 ? 5 : index >= 4960 ? 3 : 4 }, (_, component) => {
      const id = `${course.id}-section-${component}`;
      return {
        id,
        courseId: course.id,
        quarterId,
        component: index < 40 ? `component${component}` : 'lecture',
        label: `${course.code}-${component}`,
        instructors: [`Instructor ${pad(index)}`],
        location: 'Synthetic classroom',
        modality: 'In person',
        availability: 'open' as const,
        compatibleWith: null,
        meetings: [weekly(`${id}-meeting`, index < 40 ? index * 5 + component : 0)],
        exams: [],
      };
    }),
  );
  const envelope: CatalogEnvelope = {
    schemaVersion: 1,
    version: 'maximum-workload-v1',
    source: {
      name: 'Synthetic maximum workload',
      reference: 'Browser performance fixture',
      publishedAt: '2026-09-29T12:00:00Z',
      demo: true,
    },
    quarter: {
      id: quarterId,
      name: 'Maximum Workload Quarter',
      timezone: 'America/Los_Angeles',
      instructionStart: '2026-01-05',
      instructionEnd: '2026-05-17',
      examStart: '2026-05-18',
      examEnd: '2026-05-24',
    },
    courses,
    sections,
  };
  const accepted = validateCatalog(envelope);
  if (!accepted.ok)
    throw new Error(`Invalid performance catalog: ${JSON.stringify(accepted.errors.slice(0, 10))}`);
  const digest = await fingerprint(envelope);
  const ref = { quarterId, version: envelope.version, digest };
  const snapshot = new CatalogSnapshot(envelope, ref);
  const plan: PlanInputs = {
    schemaVersion: 1,
    id: 'maximum-plan-0',
    name: 'Maximum plan 0',
    quarterId,
    catalogRef: ref,
    selections: courses.slice(0, 40).map((course) => {
      const offered = snapshot.sectionsFor(course.id);
      return {
        courseId: course.id,
        sectionIds: offered.map((section) => section.id),
        units: 1,
        lastKnown: { course, sections: offered },
      };
    }),
    personalTimes: Array.from({ length: 100 }, (_, index) => {
      const date = ['2026-01-10', '2026-01-11', '2026-01-17'][Math.floor(index / 40)];
      return {
        id: `personal-${index}`,
        label: `Personal interval ${index}`,
        meeting: {
          id: `personal-meeting-${index}`,
          kind: 'once',
          start: `${date}T${time(480 + (index % 40) * 15)}`,
          end: `${date}T${time(495 + (index % 40) * 15)}`,
        },
      };
    }),
    unitTarget: { min: 40, max: 40 },
    historyComplete: false,
    history: courses.slice(40, 240).map((course, index) => ({
      id: `history-${index}`,
      courseId: course.id,
      status: 'completed',
      earnedUnits: 1,
    })),
    targets: Array.from({ length: 50 }, (_, index) => ({
      id: `target-${index}`,
      name: `Maximum target ${index}`,
      kind: 'count',
      threshold: 3,
      courseIds: [courses[index % 40].id, courses[index + 40].id, courses[4999].id],
    })),
  };
  const restored = restorePlan(plan, snapshot);
  if (!restored.ok) throw new Error(`Invalid performance plan: ${JSON.stringify(restored.errors)}`);
  const timestamp = '2026-09-29T12:00:00Z';
  const records: StoredPlan[] = await Promise.all(
    Array.from({ length: 20 }, async (_, index) => {
      const inputs = { ...plan, id: `maximum-plan-${index}`, name: `Maximum plan ${index}` };
      return {
        schemaVersion: 1,
        inputs,
        revision: 1,
        updatedAt: timestamp,
        receipt: {
          planId: inputs.id,
          revision: 1,
          mutationId: `fixture-mutation-${index}`,
          sessionId: 'performance-fixture',
          generation: 0,
          fingerprint: await fingerprint(inputs),
          catalogRef: ref,
        },
      };
    }),
  );
  const manifest: CatalogManifest = {
    schemaVersion: 1,
    quarters: [
      {
        id: quarterId,
        name: envelope.quarter.name,
        version: envelope.version,
        digest,
        url: './maximum.json',
      },
    ],
  };
  return {
    envelope,
    manifest,
    plan,
    records,
    retained: { schemaVersion: 1, ref, envelope, retainedAt: timestamp },
    catalogKey: JSON.stringify([quarterId, envelope.version]),
    dimensions: {
      courses: courses.length,
      sections: sections.length,
      selectedCourses: 40,
      selectedComponents: 200,
      personalIntervals: 100,
      courseworkRecords: 200,
      academicTargets: 50,
      savedPlans: 20,
      quarterDays: 140,
      selectedClassOccurrences: 3800,
      personalOccurrences: 100,
      expectedConflicts: 0,
      catalogBytes: Buffer.byteLength(JSON.stringify(envelope)),
    },
  };
}
