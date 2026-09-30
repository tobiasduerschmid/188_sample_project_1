import type {
  Availability,
  CatalogEnvelope,
  CatalogRef,
  Course,
  HistoryRecord,
  PlanInputs,
  Rule,
  Section,
  Selection,
  SelectionFact,
  SelectionFacts,
} from '../domain/types';
import { clonePlain, deepFreeze } from '../domain/identity';

/** Immutable, indexed interpretation of one already-admitted catalog. */
export class CatalogSnapshot {
  readonly envelope: CatalogEnvelope;
  readonly ref: CatalogRef;
  private readonly courses = new Map<string, Course>();
  private readonly identities = new Map<string, string>();
  private readonly sections = new Map<string, Section>();
  private readonly offerings = new Map<string, Section[]>();
  constructor(envelope: CatalogEnvelope, ref: CatalogRef) {
    this.envelope = deepFreeze(clonePlain(envelope));
    this.ref = deepFreeze({ ...ref });
    for (const course of this.envelope.courses) {
      this.courses.set(course.id, course);
      this.identities.set(course.id.toLocaleLowerCase(), course.canonicalId ?? course.id);
      this.identities.set(course.code.toLocaleLowerCase(), course.canonicalId ?? course.id);
    }
    for (const section of this.envelope.sections) {
      this.sections.set(section.id, section);
      const id = this.resolveId(section.courseId)!;
      const group = this.offerings.get(id) ?? [];
      group.push(section);
      this.offerings.set(id, group);
    }
  }
  resolve(id: string): string | null {
    return this.identities.get(id.trim().toLocaleLowerCase()) ?? null;
  }
  /** Stored references use exact identities, never a newly reused display code. */
  resolveId(id: string): string | null {
    const course = this.courses.get(id);
    return course ? (course.canonicalId ?? course.id) : null;
  }
  course(id: string): Course | null {
    const canonical = this.resolveId(id);
    return canonical ? (this.courses.get(canonical) ?? null) : null;
  }
  sectionsFor(id: string): Section[] {
    const canonical = this.resolveId(id);
    return canonical ? [...(this.offerings.get(canonical) ?? [])] : [];
  }
  search(query: string, subject?: string, availability?: Availability): Course[] {
    const needle = query.trim().toLocaleLowerCase();
    return this.envelope.courses
      .filter(
        (course) =>
          (!subject || course.subject.toLocaleLowerCase() === subject.toLocaleLowerCase()) &&
          this.sectionsFor(course.id).some(
            (section) =>
              (!availability || section.availability === availability) &&
              (!needle ||
                course.code.toLocaleLowerCase().includes(needle) ||
                course.title.toLocaleLowerCase().includes(needle) ||
                section.instructors?.some((name) => name.toLocaleLowerCase().includes(needle))),
          ),
      )
      .sort((a, b) => a.code.localeCompare(b.code) || a.id.localeCompare(b.id));
  }
  private canonicalRule(rule: Rule): Rule {
    const result = clonePlain(rule);
    const pending = [result];
    while (pending.length) {
      const next = pending.pop()!;
      if (next.kind === 'course') next.courseId = this.resolveId(next.courseId) ?? next.courseId;
      if (next.kind === 'all' || next.kind === 'any')
        for (const child of next.rules) pending.push(child);
    }
    return result;
  }
  facts(plan: PlanInputs): SelectionFacts {
    const selectionGroups = new Map<string, Selection[]>();
    for (const selected of plan.selections) {
      const id = this.resolveId(selected.courseId) ?? selected.courseId;
      const group = selectionGroups.get(id) ?? [];
      group.push(selected);
      selectionGroups.set(id, group);
    }
    const selections: SelectionFact[] = [...selectionGroups].map(([canonicalId, originals]) => {
      const course = this.course(canonicalId);
      const issues: string[] = [];
      const label = course?.code ?? originals[0].lastKnown?.course.code ?? canonicalId;
      if (!course) issues.push(`${label}: course removed or unresolved in this catalog.`);
      const sectionIds = [...new Set(originals.flatMap((s) => s.sectionIds))];
      const sections = sectionIds.map((id) => {
        const found = this.sections.get(id) ?? null;
        const section =
          found &&
          this.resolveId(found.courseId) === canonicalId &&
          found.quarterId === plan.quarterId
            ? found
            : null;
        const lastKnown =
          originals.flatMap((s) => s.lastKnown?.sections ?? []).find((s) => s.id === id) ?? found;
        if (!section)
          issues.push(
            `${label}: section ${id} removed or does not belong to this course and quarter.`,
          );
        else if (section.availability === 'canceled')
          issues.push(`${label}: ${section.label} (${id}) is canceled; choose a replacement.`);
        return { id, section, lastKnown };
      });
      const active = sections.flatMap((s) =>
        s.section && s.section.availability !== 'canceled' ? [s.section] : [],
      );
      const inactive =
        !course || sections.some((s) => !s.section || s.section.availability === 'canceled');
      for (const [component, needed] of Object.entries(course?.requiredComponents ?? {})) {
        const selectedCount = active.filter((s) => s.component === component).length;
        if (selectedCount < needed)
          issues.push(
            `${label}: missing ${needed - selectedCount} required ${component} component${needed - selectedCount === 1 ? '' : 's'}.`,
          );
        if (selectedCount > needed)
          issues.push(
            `${label}: ${component} has ${selectedCount} selected components but requires ${needed}; resolve the alternatives.`,
          );
      }
      for (let i = 0; i < active.length; i++)
        for (let j = i + 1; j < active.length; j++) {
          const a = active[i];
          const b = active[j];
          if (
            a.component !== b.component &&
            ((a.compatibleWith !== null && !a.compatibleWith.includes(b.id)) ||
              (b.compatibleWith !== null && !b.compatibleWith.includes(a.id)))
          )
            issues.push(
              `Incompatible components for ${label}: ${a.label} (${a.id}) and ${b.label} (${b.id}).`,
            );
        }
      const effectiveUnits = originals.map(
        (s) => s.units ?? (course?.units.length === 1 ? course.units[0] : null),
      );
      const chosen = effectiveUnits[0];
      let units: number | null = chosen !== null && course?.units.includes(chosen) ? chosen : null;
      let unitReason: string | null = !course
        ? `${label}: units cannot be resolved because the course is removed.`
        : chosen === null
          ? `${label}: select a permitted variable-unit amount.`
          : units === null
            ? `${label}: the selected ${chosen} units are no longer permitted.`
            : null;
      const unitConflict = effectiveUnits.some((value) => value !== chosen);
      const sectionConflict = originals.some(
        (s) =>
          [...s.sectionIds].sort().join('\u0000') !==
          [...originals[0].sectionIds].sort().join('\u0000'),
      );
      if (unitConflict) {
        units = null;
        unitReason = `${label}: equivalent course selections have conflicting unit choices; resolve the original choices.`;
      }
      if (originals.length > 1 && (unitConflict || sectionConflict))
        issues.push(
          `${label}: equivalent course selections contain conflicting original choices; resolve their alternatives.`,
        );
      if (inactive) {
        units = null;
        unitReason = `${label}: excluded from selected units because a course or selected component is canceled or removed.`;
      }
      return {
        canonicalId,
        selections: originals,
        course,
        sections,
        complete: !!course && issues.length === 0,
        issues,
        inactive,
        units,
        unitReason,
        prerequisite: course ? this.canonicalRule(course.prerequisite) : { kind: 'unknown' },
        corequisite: course ? this.canonicalRule(course.corequisite) : { kind: 'unknown' },
      };
    });
    const histories = new Map<
      string,
      { canonicalId: string | null; records: HistoryRecord[]; ambiguous: boolean }
    >();
    for (const record of plan.history) {
      const canonicalId = record.unmapped ? null : this.resolveId(record.courseId);
      const key = JSON.stringify([canonicalId !== null, canonicalId ?? record.courseId]);
      const group = histories.get(key) ?? { canonicalId, records: [], ambiguous: false };
      group.records.push(record);
      group.ambiguous = group.records.some(
        (r) =>
          r.status !== group.records[0].status || r.earnedUnits !== group.records[0].earnedUnits,
      );
      histories.set(key, group);
    }
    const targets = plan.targets.map((target) => ({
      target,
      canonicalIds: [
        ...new Set(
          target.courseIds.flatMap((id) => (this.resolveId(id) ? [this.resolveId(id)!] : [])),
        ),
      ],
      unresolvedIds: target.courseIds.filter((id) => !this.resolveId(id)),
    }));
    const courseNames: Record<string, string> = Object.create(null);
    for (const c of this.envelope.courses) {
      const canonical = this.course(c.id)!;
      courseNames[c.id] = `${canonical.code} — ${canonical.title}`;
    }
    return {
      quarter: this.envelope.quarter,
      selections,
      history: [...histories.values()],
      targets,
      courseNames,
    };
  }
}
