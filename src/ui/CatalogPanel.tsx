import { useState } from 'react';
import type { CatalogSnapshot } from '../catalog/snapshot';
import type { Availability, Course, PlanInputs, Section } from '../domain/types';
import type { PlanSession } from '../session/session';
import { meetingText, ruleText } from './shared';

export function SectionDetails({ section }: { section: Section }) {
  return (
    <div className="section-facts">
      <p>
        <strong>{section.label}</strong> · {section.component} ·{' '}
        <span className={`status ${section.availability}`}>{section.availability}</span>
      </p>
      <p>
        {section.instructors?.join(', ') || 'Instructor unknown'} ·{' '}
        {section.location ?? 'Location unknown'} · {section.modality ?? 'Modality unknown'}
      </p>
      <ul>
        {section.meetings.map((m) => (
          <li key={m.id}>{meetingText(m)}</li>
        ))}
      </ul>
      <p>
        Exams:{' '}
        {section.exams === null
          ? 'Unknown — time check incomplete'
          : section.exams.length === 0
            ? 'No exam'
            : section.exams.map(meetingText).join('; ')}
      </p>
      <p className="hint">
        ID {section.id} · Allowed linked sections:{' '}
        {section.compatibleWith === null
          ? 'Any otherwise valid component'
          : section.compatibleWith.join(', ') || 'None'}
      </p>
    </div>
  );
}

export function CatalogPanel({
  catalog,
  plan,
  session,
}: {
  catalog: CatalogSnapshot;
  plan: PlanInputs;
  session: PlanSession;
}) {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [availability, setAvailability] = useState('');
  const [visible, setVisible] = useState(30);
  const results = catalog.search(
    query,
    subject || undefined,
    (availability || undefined) as Availability | undefined,
  );
  const subjects = [...new Set(catalog.envelope.courses.map((c) => c.subject))].sort();
  const selected = new Set(plan.selections.map((s) => catalog.resolve(s.courseId) ?? s.courseId));
  function clear() {
    setQuery('');
    setSubject('');
    setAvailability('');
    setVisible(30);
  }
  return (
    <aside className="catalog-panel panel" aria-labelledby="catalog-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">EXPLORE YOUR OPTIONS</p>
          <h2 id="catalog-title">Course catalog</h2>
        </div>
        <span className="count-pill">{results.length}</span>
      </div>
      <label className="search-label">
        Search courses
        <input
          type="search"
          placeholder="Code, title, or instructor"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisible(30);
          }}
        />
      </label>
      <div className="form-row">
        <label>
          Subject
          <select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setVisible(30);
            }}
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Availability
          <select
            value={availability}
            onChange={(e) => {
              setAvailability(e.target.value);
              setVisible(30);
            }}
          >
            <option value="">Any availability</option>
            {['open', 'full', 'waitlist', 'canceled', 'unknown'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="result-count" role="status">
        {results.length
          ? `${results.length} course${results.length === 1 ? '' : 's'} found`
          : 'No courses found'}
        {(query || subject || availability) && (
          <button type="button" className="text-button" onClick={clear}>
            Clear filters
          </button>
        )}
      </div>
      <div className="catalog-results">
        {results.slice(0, visible).map((course) => (
          <CourseResult
            key={course.id}
            course={course}
            catalog={catalog}
            selected={selected.has(catalog.resolve(course.id) ?? course.id)}
            add={() => void session.edit({ type: 'addCourse', courseId: course.id })}
          />
        ))}
      </div>
      {results.length > visible && (
        <button type="button" className="wide" onClick={() => setVisible(visible + 30)}>
          Show more courses
        </button>
      )}
      <p className="hint">
        Availability is a catalog snapshot. Planning a course does not reserve a seat.
      </p>
    </aside>
  );
}
function CourseResult({
  course,
  catalog,
  selected,
  add,
}: {
  course: Course;
  catalog: CatalogSnapshot;
  selected: boolean;
  add: () => void;
}) {
  return (
    <article className="catalog-course">
      <div className="course-top">
        <span className="course-code">{course.code}</span>
        <span>{course.units.join(' / ')} units</span>
      </div>
      <h3>{course.title}</h3>
      <p className="hint">
        {Object.entries(course.requiredComponents)
          .map(([name, count]) => `${count} ${name}`)
          .join(' + ')}
      </p>
      <div className="course-actions">
        <details>
          <summary>View course details</summary>
          <div className="course-detail">
            <p>{course.description ?? 'Description unknown'}</p>
            <p>Prerequisite: {ruleText(course.prerequisite)}</p>
            <p>Corequisite: {ruleText(course.corequisite)}</p>
            <p className="hint">
              Course identity: {course.id}
              {course.canonicalId && ` · Canonical identity: ${course.canonicalId}`}
            </p>
            {catalog.sectionsFor(course.id).map((section) => (
              <SectionDetails key={section.id} section={section} />
            ))}
          </div>
        </details>
        <button
          className={selected ? 'selected-button' : 'small-button'}
          type="button"
          onClick={add}
          aria-label={selected ? `Focus ${course.code} in plan` : `Add ${course.code} to plan`}
        >
          {selected ? '✓ In plan' : '+ Add course'}
        </button>
      </div>
    </article>
  );
}
