import { useEffect, useRef } from 'react';
import type { CatalogSnapshot } from '../catalog/snapshot';
import type { PlanInputs } from '../domain/types';
import type { PlanSession } from '../session/session';
import { SectionDetails } from './CatalogPanel';

export function PlanCourses({
  plan,
  catalog,
  session,
  focusId,
  canUndo,
}: {
  plan: PlanInputs;
  catalog: CatalogSnapshot;
  session: PlanSession;
  focusId: string | null;
  canUndo: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focusId)
      container.current
        ?.querySelector<HTMLElement>(`[data-course-id="${CSS.escape(focusId)}"]`)
        ?.focus();
  }, [focusId]);
  const facts = catalog.facts(plan);
  return (
    <section className="panel" aria-labelledby="selected-title" ref={container}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">BUILD YOUR QUARTER</p>
          <h2 id="selected-title">
            Selected courses <span className="subtle-count">{facts.selections.length}/40</span>
          </h2>
        </div>
        {canUndo && (
          <button onClick={() => session.undo()} type="button">
            Undo removal
          </button>
        )}
      </div>
      {!plan.selections.length && (
        <div className="empty-state">
          <span className="empty-mark" aria-hidden="true">
            ＋
          </span>
          <h3>A little room for possibility.</h3>
          <p>Find a course in the catalog, then choose its lecture and required sections.</p>
        </div>
      )}
      <div className="selected-courses">
        {plan.selections.map((selection) => {
          const course = catalog.course(selection.courseId) ?? selection.lastKnown?.course;
          const canonical = catalog.resolve(selection.courseId) ?? selection.courseId;
          const fact = facts.selections.find((f) => f.canonicalId === canonical);
          const available = catalog.sectionsFor(selection.courseId);
          const components = new Set([
            ...Object.keys(course?.requiredComponents ?? {}),
            ...selection.sectionIds.map(
              (id) =>
                available.find((s) => s.id === id)?.component ??
                selection.lastKnown?.sections.find((s) => s.id === id)?.component ??
                'Unresolved',
            ),
          ]);
          return (
            <article
              className="selected-course"
              key={selection.courseId}
              tabIndex={-1}
              data-course-id={selection.courseId}
            >
              <div className="section-heading">
                <div>
                  <span className="course-code">{course?.code ?? selection.courseId}</span>
                  <h3>{course?.title ?? 'Unresolved course'}</h3>
                </div>
                <button
                  type="button"
                  className="text-button danger"
                  aria-label={`Remove ${course?.code ?? selection.courseId}`}
                  onClick={() =>
                    void session.edit({ type: 'removeCourse', courseId: selection.courseId })
                  }
                >
                  Remove
                </button>
              </div>
              {fact?.issues.length ? (
                <ul className="warning-list">
                  {fact.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              ) : (
                <p className="positive small">Complete section bundle</p>
              )}
              <div className="component-controls">
                {[...components].map((component) => {
                  const selectedIds = selection.sectionIds.filter(
                    (id) =>
                      (available.find((s) => s.id === id)?.component ??
                        selection.lastKnown?.sections.find((s) => s.id === id)?.component ??
                        'Unresolved') === component,
                  );
                  const count = Math.max(
                    course?.requiredComponents[component] ?? 0,
                    selectedIds.length,
                    1,
                  );
                  return Array.from({ length: count }, (_, index) => {
                    const currentId = selectedIds[index] ?? '';
                    return (
                      <label key={`${component}-${index}`}>
                        {course?.code ?? selection.courseId} {component}
                        {count > 1 ? ` ${index + 1}` : ''}
                        <select
                          value={currentId}
                          onChange={(e) => {
                            if (e.target.value)
                              void session.edit({
                                type: 'setSection',
                                courseId: selection.courseId,
                                sectionId: e.target.value,
                                ...(currentId ? { replaceId: currentId } : {}),
                              });
                            else if (currentId)
                              void session.edit({
                                type: 'removeSection',
                                courseId: selection.courseId,
                                sectionId: currentId,
                              });
                          }}
                        >
                          <option value="">Choose {component}</option>
                          {currentId && !available.some((s) => s.id === currentId) && (
                            <option value={currentId}>{currentId} — removed / unresolved</option>
                          )}
                          {available
                            .filter((s) => s.component === component)
                            .map((section) => (
                              <option
                                key={section.id}
                                value={section.id}
                                disabled={section.availability === 'canceled'}
                              >
                                {section.label} · {section.availability}
                              </option>
                            ))}
                        </select>
                      </label>
                    );
                  });
                })}
                {course &&
                  (course.units.length > 1 ||
                    (selection.units !== null && !course.units.includes(selection.units))) && (
                    <label>
                      {course.code} units
                      <select
                        value={selection.units ?? ''}
                        onChange={(e) =>
                          void session.edit({
                            type: 'setUnits',
                            courseId: selection.courseId,
                            units: e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                      >
                        <option value="">Choose units</option>
                        {selection.units !== null && !course.units.includes(selection.units) && (
                          <option value={selection.units}>
                            {selection.units} — no longer allowed
                          </option>
                        )}
                        {course.units.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
              </div>
              <details>
                <summary>Selected meeting details · {fact?.units ?? 'unresolved'} units</summary>
                {selection.sectionIds.length ? (
                  selection.sectionIds.map((id) => {
                    const section =
                      available.find((s) => s.id === id) ??
                      selection.lastKnown?.sections.find((s) => s.id === id);
                    return section ? (
                      <SectionDetails key={id} section={section} />
                    ) : (
                      <p key={id}>Unresolved section: {id}</p>
                    );
                  })
                ) : (
                  <p>No sections selected yet.</p>
                )}
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
