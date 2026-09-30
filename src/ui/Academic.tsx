import { useState, type FormEvent } from 'react';
import type { CatalogSnapshot } from '../catalog/snapshot';
import type {
  AcademicReport,
  AcademicTarget,
  HistoryRecord,
  PlanInputs,
  RuleReport,
} from '../domain/types';
import type { PlanSession } from '../session/session';
import { newId } from '../domain/identity';
import { ErrorText, useFormResult } from './shared';

export function UnitEditor({
  plan,
  report,
  session,
}: {
  plan: PlanInputs;
  report: AcademicReport | null;
  session: PlanSession;
}) {
  const [min, setMin] = useState(plan.unitTarget?.min.toString() ?? '');
  const [max, setMax] = useState(plan.unitTarget?.max.toString() ?? '');
  const form = useFormResult();
  const range = report?.units.range;
  async function save(e: FormEvent) {
    e.preventDefault();
    form.accept(
      await session.edit({
        type: 'setUnitTarget',
        target: { min: min === '' ? NaN : Number(min), max: max === '' ? NaN : Number(max) },
      }),
    );
  }
  return (
    <section className="panel" aria-labelledby="unit-title">
      <div className="section-heading">
        <h2 id="unit-title">Unit load</h2>
        <span className="large-number">
          {report?.units.known ?? '—'} <small>known units</small>
        </span>
      </div>
      <p>
        {!plan.unitTarget
          ? 'No unit target specified'
          : `${plan.unitTarget.min}–${plan.unitTarget.max} unit target · ${range === 'incomplete' ? 'Total incomplete' : (range ?? 'Checking')}`}
      </p>
      {report && (
        <>
          {report.units.unresolved.map((s, i) => (
            <p className="warning" key={i}>
              Unresolved units: {s}
            </p>
          ))}
          {report.units.excluded.map((s, i) => (
            <p className="warning" key={i}>
              Excluded from unit total: {s}
            </p>
          ))}
        </>
      )}
      <details>
        <summary>{plan.unitTarget ? 'Edit unit target' : 'Set an optional unit target'}</summary>
        <form className="form-stack" onSubmit={save}>
          <div className="form-row">
            <label>
              Minimum units
              <input
                type="number"
                min="0"
                max="60"
                step="0.5"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                aria-describedby="units-error"
              />
            </label>
            <label>
              Maximum units
              <input
                type="number"
                min="0"
                max="60"
                step="0.5"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                aria-describedby="units-error"
              />
            </label>
          </div>
          <ErrorText errors={form.errors} id="units-error" />
          <div className="actions">
            <button type="submit">Save unit target</button>
            {plan.unitTarget && (
              <button
                type="button"
                onClick={async () => {
                  if (form.accept(await session.edit({ type: 'setUnitTarget', target: null }))) {
                    setMin('');
                    setMax('');
                  }
                }}
              >
                Clear unit target
              </button>
            )}
          </div>
        </form>
      </details>
    </section>
  );
}
const statusText = {
  completed: 'Met by completed work',
  projected: 'Would be met if planned courses are completed',
  unverified: 'Unverified',
  not_met: 'Not met',
};
function RuleResult({ label, result }: { label: string; result: RuleReport }) {
  return (
    <div className="rule-result">
      <h4>
        {label} <span className={`status ${result.status}`}>{result.status}</span>
      </h4>
      <p>{result.explanation}</p>
      {!!result.conditions.length && (
        <details>
          <summary>Inspect conditions</summary>
          <ul>
            {result.conditions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
export function Academic({
  plan,
  catalog,
  report,
  session,
}: {
  plan: PlanInputs;
  catalog: CatalogSnapshot;
  report: AcademicReport | null;
  session: PlanSession;
}) {
  return (
    <div className="stack">
      <UnitEditor key={`${plan.id}-units`} plan={plan} report={report} session={session} />
      <section className="panel">
        <p className="eyebrow">KNOW WHERE YOU STAND</p>
        <h2>Course eligibility</h2>
        <p className="hint">
          These checks use your student-entered history. Unsupported restrictions require manual
          review; this is not an official eligibility decision.
        </p>
        {!report ? (
          <p>Checking this revision…</p>
        ) : !report.eligibility.length ? (
          <p className="empty-note">Add courses to see prerequisite and corequisite checks.</p>
        ) : (
          report.eligibility.map((item) => (
            <article className="eligibility-card" key={item.courseId}>
              <h3>{item.label}</h3>
              <RuleResult label="Prerequisite" result={item.prerequisite} />
              <RuleResult label="Corequisite" result={item.corequisite} />
            </article>
          ))
        )}
      </section>
      <HistoryEditor
        key={`${plan.id}-history`}
        plan={plan}
        catalog={catalog}
        session={session}
        issues={report?.historyIssues ?? []}
      />
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">DEFINE YOUR OWN PROGRESS</p>
            <h2>Academic targets</h2>
          </div>
          <span className="count-pill">{plan.targets.length}/50</span>
        </div>
        <p className="hint">
          Courses may contribute independently to multiple targets. Institutional credit-reuse
          restrictions require manual review. These targets do not certify a degree.
        </p>
        {!plan.targets.length && <p className="empty-note">No academic targets specified</p>}
        {report?.targets.map((target) => (
          <article className="target-report" key={target.id}>
            <div className="section-heading">
              <h3>{target.name}</h3>
              <span className={`status ${target.status}`}>{statusText[target.status]}</span>
            </div>
            <div className="target-numbers">
              <p>
                <strong>{target.completed}</strong> completed
              </p>
              <p>
                <strong>{target.projected}</strong> projected
              </p>
              <p>
                <strong>{target.threshold}</strong> {target.kind === 'count' ? 'courses' : 'units'}{' '}
                required
              </p>
            </div>
            <p>
              Remaining: {target.completedRemaining} completed / {target.projectedRemaining}{' '}
              projected{target.provisional ? ' · Provisional — some information is unknown' : ''}
            </p>
            {target.issues.map((s, i) => (
              <p className="warning" key={i}>
                {s}
              </p>
            ))}
            <details>
              <summary>Contribution details</summary>
              <ul>
                {target.contributions.map((c, i) => (
                  <li key={`${c.courseId}-${i}`}>
                    <strong>{c.label}</strong> · completed {c.completed}, projected {c.projected} ·{' '}
                    {c.reason}
                  </li>
                ))}
              </ul>
              <p className="hint">
                Projected contributions depend on completing the courses. Schedule, availability,
                and eligibility warnings still apply.
              </p>
            </details>
          </article>
        ))}
        <TargetEditor key={`${plan.id}-targets`} plan={plan} catalog={catalog} session={session} />
      </section>
    </div>
  );
}

function HistoryEditor({
  plan,
  catalog,
  session,
  issues,
}: {
  plan: PlanInputs;
  catalog: CatalogSnapshot;
  session: PlanSession;
  issues: string[];
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<HistoryRecord['status']>('completed');
  const [units, setUnits] = useState('');
  const form = useFormResult();
  function reset() {
    setEditing(null);
    setCode('');
    setStatus('completed');
    setUnits('');
    form.clear();
  }
  function edit(record: HistoryRecord) {
    setEditing(record.id);
    setCode(record.courseId);
    setStatus(record.status);
    setUnits(record.earnedUnits === null ? '' : String(record.earnedUnits));
    form.clear();
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (
      form.accept(
        await session.edit({
          type: 'upsertHistory',
          value: {
            id: editing ?? newId(),
            courseId: code.trim(),
            status,
            earnedUnits: units === '' ? null : Number(units),
          },
        }),
      )
    )
      reset();
  }
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Your coursework history</h2>
        <span className="count-pill">{plan.history.length}/200</span>
      </div>
      <p className="hint">
        Enter completed or in-progress work. Unknown course codes remain visible for manual
        resolution.
      </p>
      <label className="check-label">
        <input
          type="checkbox"
          checked={plan.historyComplete}
          onChange={(e) =>
            void session.edit({ type: 'setHistoryComplete', complete: e.target.checked })
          }
        />
        This history is complete for the checks in this plan.
      </label>
      {issues.map((issue, i) => (
        <p className="warning" key={i}>
          {issue}
        </p>
      ))}
      <div className="record-list">
        {plan.history.map((record) => (
          <article key={record.id}>
            <div>
              <strong>{catalog.course(record.courseId)?.code ?? record.courseId}</strong>
              <span>
                {record.status.replaceAll('_', ' ')} ·{' '}
                {record.earnedUnits === null
                  ? 'earned units unknown'
                  : `${record.earnedUnits} earned units`}
                {catalog.resolve(record.courseId) ? '' : ' · unmapped'}
              </span>
            </div>
            <div className="actions">
              <button
                type="button"
                onClick={() => edit(record)}
                aria-label={`Edit history ${record.courseId}`}
              >
                Edit
              </button>
              <button
                type="button"
                className="text-button danger"
                aria-label={`Delete history ${record.courseId}`}
                onClick={() => void session.edit({ type: 'removeHistory', id: record.id })}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
      <form onSubmit={save} className="form-stack inset">
        <h3>{editing ? 'Edit coursework record' : 'Add coursework'}</h3>
        <label>
          Course code or identity
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. TEST001"
            aria-describedby="history-error"
          />
        </label>
        <div className="form-row">
          <label>
            Coursework status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as HistoryRecord['status'])}
            >
              <option value="completed">Completed</option>
              <option value="in_progress">In progress</option>
              <option value="not_completed">Not completed</option>
            </select>
          </label>
          <label>
            Earned units (optional)
            <input
              type="number"
              min="0"
              max="30"
              step="0.5"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              placeholder="Unknown"
              aria-describedby="history-error"
            />
          </label>
        </div>
        <ErrorText errors={form.errors} id="history-error" />
        <div className="actions">
          <button type="submit">
            {editing ? 'Save coursework changes' : 'Add coursework record'}
          </button>
          {editing && (
            <button type="button" onClick={reset}>
              Cancel edit
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function TargetEditor({
  plan,
  catalog,
  session,
}: {
  plan: PlanInputs;
  catalog: CatalogSnapshot;
  session: PlanSession;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<AcademicTarget['kind']>('count');
  const [threshold, setThreshold] = useState('');
  const [eligible, setEligible] = useState('');
  const form = useFormResult();
  function reset() {
    setEditing(null);
    setName('');
    setThreshold('');
    setEligible('');
    form.clear();
  }
  function edit(target: AcademicTarget) {
    setEditing(target.id);
    setName(target.name);
    setKind(target.kind);
    setThreshold(String(target.threshold));
    setEligible(target.courseIds.join(', '));
    form.clear();
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    const courseIds = eligible
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (
      form.accept(
        await session.edit({
          type: 'upsertTarget',
          value: { id: editing ?? newId(), name, kind, threshold: Number(threshold), courseIds },
        }),
      )
    )
      reset();
  }
  return (
    <>
      {!!plan.targets.length && (
        <div className="record-list">
          {plan.targets.map((target) => (
            <article key={target.id}>
              <div>
                <strong>{target.name}</strong>
                <span>
                  {target.threshold} {target.kind === 'count' ? 'courses' : 'units'} ·{' '}
                  {target.courseIds.join(', ')}
                </span>
              </div>
              <div className="actions">
                <button
                  type="button"
                  aria-label={`Edit target ${target.name}`}
                  onClick={() => edit(target)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-button danger"
                  aria-label={`Delete target ${target.name}`}
                  onClick={() => void session.edit({ type: 'removeTarget', id: target.id })}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <form className="form-stack inset" onSubmit={save}>
        <h3>{editing ? 'Edit target' : 'Add an academic target'}</h3>
        <label>
          Target name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-describedby="target-error"
          />
        </label>
        <div className="form-row">
          <label>
            Measure
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as AcademicTarget['kind'])}
            >
              <option value="count">Distinct courses</option>
              <option value="units">Units</option>
            </select>
          </label>
          <label>
            Required amount
            <input
              type="number"
              min={kind === 'count' ? '1' : '.5'}
              step={kind === 'count' ? '1' : '.5'}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              aria-describedby="target-error"
            />
          </label>
        </div>
        <label>
          Eligible course codes or identities
          <textarea
            value={eligible}
            onChange={(e) => setEligible(e.target.value)}
            placeholder="TEST101, TEST102, TEST103"
            aria-describedby="eligible-hint target-error"
          />
        </label>
        <p className="hint" id="eligible-hint">
          Separate courses with commas. Courses can count independently toward multiple targets. You
          can inspect all catalog identities in course details.
        </p>
        <ErrorText errors={form.errors} id="target-error" />
        <div className="actions">
          <button type="submit">{editing ? 'Save target changes' : 'Save academic target'}</button>
          {editing && (
            <button type="button" onClick={reset}>
              Cancel edit
            </button>
          )}
        </div>
      </form>
    </>
  );
}
