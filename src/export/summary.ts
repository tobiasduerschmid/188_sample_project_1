import type { Assessment, CatalogEnvelope, PlanInputs, SaveState } from '../domain/types';
import { stableStringify } from '../domain/identity';

function readableJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return stableStringify(value);
  }
}

export interface ExportInput {
  plan: PlanInputs;
  catalog: CatalogEnvelope;
  assessment: Assessment | null;
  assessmentStatus: 'pending' | 'complete' | 'failed';
  saveState: SaveState;
  capturedAt: string;
}

export const saveLabels: Record<SaveState, string> = {
  unsaved: 'Changes not saved',
  saving: 'Saving changes',
  saved: 'Saved in this browser',
  save_failed: 'Changes not saved',
  revision_conflict: 'Changes not saved — another tab changed this plan',
  reconciling: 'Checking whether changes were saved',
};

/** CAN-013: a frozen, readable handoff with every reconstruction input. */
export function renderSummary(input: ExportInput): string {
  const { plan, catalog, assessment } = input;
  const ids = new Set([
    ...plan.selections.map((s) => s.courseId),
    ...plan.history.map((h) => h.courseId),
    ...plan.targets.flatMap((t) => t.courseIds),
  ]);
  const sections = new Set(plan.selections.flatMap((s) => s.sectionIds));
  const details = {
    source: catalog.source,
    quarter: catalog.quarter,
    catalogRef: plan.catalogRef,
    courses: catalog.courses.filter(
      (c) => ids.has(c.id) || ids.has(c.code) || (c.canonicalId && ids.has(c.canonicalId)),
    ),
    sections: catalog.sections.filter((s) => sections.has(s.id)),
  };
  return [
    `QUARTERLY CLASS PLAN — ${plan.name}`,
    'This is a plan, not enrollment confirmation. Use institutional systems for enrollment and authoritative academic decisions.',
    `Captured: ${input.capturedAt}`,
    `Save state at capture: ${saveLabels[input.saveState]}`,
    `Quarter: ${catalog.quarter.name} (${plan.quarterId})`,
    `Institution timezone: ${catalog.quarter.timezone}`,
    `Catalog: ${catalog.source.name}, ${catalog.version}, ${catalog.source.publishedAt}`,
    `Source reference: ${catalog.source.reference}`,
    `Demonstration data: ${catalog.source.demo ? 'YES — synthetic, not real offerings' : 'No'}`,
    `Unit target: ${plan.unitTarget ? `${plan.unitTarget.min}–${plan.unitTarget.max}` : 'No unit target specified'}`,
    `History declared complete: ${plan.historyComplete ? 'Yes' : 'No — absent work is unknown'}`,
    'Academic targets are student-stated. Courses may contribute independently to multiple targets; credit-reuse restrictions require manual review.',
    plan.targets.length
      ? `Academic targets: ${plan.targets.length}`
      : 'No academic targets specified',
    '',
    'CHECKS',
    input.assessmentStatus === 'complete' && assessment
      ? readableJson({
          time: assessment.schedule,
          academic: assessment.academic,
          assessmentKey: assessment.key,
        })
      : `Current checks are ${input.assessmentStatus}; no earlier revision is presented as current.`,
    '',
    'COMPLETE PLAN INPUTS (including unresolved choices and unknown values)',
    'Null represents unknown or unset information. Original identifiers are retained for manual reconstruction.',
    readableJson(plan),
    '',
    'CATALOG DETAILS FOR THESE INPUTS',
    'Meeting dates, local clock times, exclusions, replacement meetings, and exams are recorded below. Removed choices retain last-known details in the plan inputs above.',
    readableJson(details),
    '',
  ].join('\n');
}

export function downloadSummary(input: ExportInput): void {
  const blob = new Blob([renderSummary(input)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${input.plan.name.replace(/[^\p{L}\p{N}._ -]/gu, '_') || 'quarter-plan'}.txt`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
