import type { CatalogEnvelope, Course, Meeting, Section } from '../domain/types';

/** Fictional acceptance data, never a statement about institutional offerings. */
export function makeFixture(now = new Date().toISOString()): CatalogEnvelope {
  const quarter = {
    id: 'synthetic-2026-winter',
    name: 'Synthetic Winter 2026',
    timezone: 'America/Los_Angeles',
    instructionStart: '2026-01-05',
    instructionEnd: '2026-03-13',
    examStart: '2026-03-16',
    examEnd: '2026-03-20',
  };
  const courses: Course[] = [
    ['TEST001', 'Introductory Work', 4],
    ['TEST101', 'Foundations', 4],
    ['TEST102', 'Methods', 4],
    ['TEST103', 'Practice', 3],
    ['TEST104', 'Independent Study', 2],
    ['TEST105', 'Seminar', 2],
  ].map(([id, title, units]): Course => ({
    id: String(id),
    subject: 'TEST',
    code: String(id),
    title: String(title),
    description: String(title),
    units: [Number(units)],
    prerequisite: { kind: 'none' },
    corequisite: { kind: 'none' },
    requiredComponents: id === 'TEST101' ? { lecture: 1, lab: 1 } : { lecture: 1 },
  }));
  courses.find((c) => c.id === 'TEST102')!.prerequisite = { kind: 'course', courseId: 'TEST001' };
  courses.find((c) => c.id === 'TEST103')!.corequisite = { kind: 'course', courseId: 'TEST101' };
  const weekly = (id: string, weekdays: number[], startTime: string, endTime: string): Meeting => ({
    id,
    kind: 'weekly',
    weekdays,
    startDate: quarter.instructionStart,
    endDate: quarter.instructionEnd,
    startTime,
    endTime,
    endDayOffset: 0,
    exclusions: [],
    replacements: [],
  });
  const section = (
    courseId: string,
    suffix: string,
    component: string,
    meetings: Meeting[],
    compatibleWith: string[] | null = null,
  ): Section => ({
    id: `${courseId}-${suffix}`,
    courseId,
    quarterId: quarter.id,
    component,
    label: `${component} ${suffix}`,
    instructors: ['Instructor Example'],
    location: 'Room Example',
    modality: 'in person',
    availability: 'open',
    compatibleWith,
    meetings,
    exams: [],
  });
  const sections = [
    section(
      'TEST101',
      'A',
      'lecture',
      [weekly('lecture-A', [1, 3], '09:00', '10:00')],
      ['TEST101-A1'],
    ),
    section('TEST101', 'A1', 'lab', [weekly('lab-A1', [5], '09:00', '10:00')], ['TEST101-A']),
    section(
      'TEST101',
      'B',
      'lecture',
      [weekly('lecture-B', [2, 4], '09:00', '10:00')],
      ['TEST101-B1'],
    ),
    section('TEST101', 'B1', 'lab', [weekly('lab-B1', [5], '10:00', '11:00')], ['TEST101-B']),
    section('TEST102', 'A', 'lecture', [weekly('lecture', [1, 3], '09:30', '10:30')]),
    section('TEST103', 'A', 'lecture', [weekly('lecture', [1, 3], '10:00', '11:00')]),
    section('TEST104', 'A', 'lecture', [{ id: 'independent', kind: 'async' }]),
    section('TEST105', 'A', 'lecture', [{ id: 'seminar', kind: 'tba' }]),
  ];
  return {
    schemaVersion: 1,
    version: 'fixture-v1',
    source: {
      name: 'Synthetic acceptance catalog',
      reference: 'requirements.md §7.1 — fictional data',
      publishedAt: now,
      demo: true,
    },
    quarter,
    courses,
    sections,
  };
}
