import type { CatalogSnapshot } from '../catalog/snapshot';
import { sameRef } from '../domain/identity';
import { fail, ok, type Assessment, type PlanInputs, type Result } from '../domain/types';
import { evaluateAcademic } from './academic';
import { evaluateSchedule } from './schedule';

/** Publish either a complete assessment for one exact context or one recoverable failure. */
export async function assessPlan(
  plan: PlanInputs,
  catalog: CatalogSnapshot,
  generation: number,
): Promise<Result<Assessment>> {
  if (!Number.isSafeInteger(generation) || generation < 0)
    return fail('invalid_generation', 'Assessments require a nonnegative plan generation.');
  if (plan.quarterId !== catalog.ref.quarterId || !sameRef(plan.catalogRef, catalog.ref))
    return fail(
      'assessment_key_mismatch',
      'The assessment catalog must exactly match the plan quarter, version, and digest.',
    );
  try {
    const key = { planId: plan.id, generation, catalogRef: structuredClone(plan.catalogRef) };
    const facts = catalog.facts(plan);
    const schedule = evaluateSchedule(plan, facts);
    const academic = evaluateAcademic(plan, facts);
    return ok({ key, schedule, academic });
  } catch {
    return fail(
      'assessment_failed',
      'Checks could not be completed. Your plan inputs are retained; retry assessment or download your current inputs.',
    );
  }
}
