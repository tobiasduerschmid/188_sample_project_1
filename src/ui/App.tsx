import { useEffect, useState, useSyncExternalStore } from 'react';
import type { PlanSession } from '../session/session';
import type { Result } from '../domain/types';
import { downloadSummary, saveLabels } from '../export/summary';
import { Academic } from './Academic';
import { CatalogPanel } from './CatalogPanel';
import { PersonalTimes } from './PersonalTimes';
import { PlanCourses } from './PlanCourses';
import { Schedule } from './Schedule';
import { ErrorText, Modal, NameForm } from './shared';

type Pane = 'schedule' | 'academic' | 'personal';
type Dialog = 'rename' | 'copy' | 'delete' | 'loadNewer' | 'new' | null;

export function App({ session }: { session: PlanSession }) {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const [pane, setPane] = useState<Pane>('schedule');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [pendingNavigation, setPendingNavigation] = useState<null | (() => Promise<Result<void>>)>(
    null,
  );
  const [downloadError, setDownloadError] = useState('');
  const { catalog, plan, assessment } = state;
  const visiblePlans = state.plans.filter(
    (saved) => !catalog || saved.quarterId === catalog.envelope.quarter.id,
  );
  const quarters = [...(state.manifest?.quarters ?? [])];
  if (catalog && !quarters.some((q) => q.id === catalog.envelope.quarter.id))
    quarters.push({
      id: catalog.envelope.quarter.id,
      name: catalog.envelope.quarter.name,
      version: catalog.ref.version,
      digest: catalog.ref.digest,
      url: '',
    });
  useEffect(() => {
    void session.initialize();
  }, [session]);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (state.plan && state.saveState !== 'saved') {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [state.plan, state.saveState]);
  async function navigate(action: (discard?: boolean) => Promise<Result<void>>) {
    const result = await action(false);
    if (!result.ok && result.errors.some((e) => e.code === 'unsaved_changes'))
      setPendingNavigation(() => () => action(true));
  }
  function download() {
    const input = session.exportInput();
    if (!input.ok) {
      setDownloadError(input.errors.map((e) => e.message).join(' '));
      return;
    }
    try {
      downloadSummary(input.value);
      setDownloadError('');
    } catch {
      setDownloadError(
        'The summary could not be downloaded. Your current input is still here; try again.',
      );
    }
  }
  async function named(action: (name: string) => Promise<Result<void>>, name: string) {
    const result = await action(name);
    if (result.ok) setDialog(null);
    return result;
  }
  const conflictCount = assessment?.schedule.conflicts.length;
  const incompleteCount = assessment?.schedule.incomplete.length;
  const source = catalog?.envelope.source;
  const ageHours = source
    ? Math.max(0, (Date.now() - new Date(source.publishedAt).getTime()) / 3600000)
    : 0;
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to planner
      </a>
      <header className="app-header">
        <a className="brand" href="#main" aria-label="Quarterly planner">
          <span className="brand-mark" aria-hidden="true">
            q.
          </span>
          <span>
            quarterly<span className="brand-sub">A LITTLE PLANNING. MORE POSSIBILITY.</span>
          </span>
        </a>
        <span className="local-badge">
          <span aria-hidden="true">◉</span> Private to this browser
        </span>
      </header>
      <div className="app-layout">
        <aside className="sidebar" aria-label="Quarter and saved plans">
          <div className="sidebar-top">
            <p className="eyebrow">YOUR PLANNING SPACE</p>
            <label>
              Quarter
              <select
                value={catalog?.envelope.quarter.id ?? ''}
                disabled={state.loading}
                onChange={(e) => {
                  if (e.target.value)
                    void navigate((discard) => session.selectQuarter(e.target.value, discard));
                }}
              >
                <option value="">Select a quarter</option>
                {quarters.map((q) => (
                  <option value={q.id} key={q.id}>
                    {q.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="saved-heading">
            <h2>Saved plans</h2>
            <span>{state.plans.length}/20</span>
          </div>
          {visiblePlans.length ? (
            <ul className="saved-plans">
              {visiblePlans.map((saved) => (
                <li key={saved.id}>
                  <button
                    type="button"
                    aria-current={saved.id === plan?.id ? 'page' : undefined}
                    onClick={() => void navigate((discard) => session.open(saved.id, discard))}
                  >
                    <span className="plan-icon" aria-hidden="true">
                      ▤
                    </span>
                    <span>
                      <strong>{saved.name}</strong>
                      <small>
                        {state.manifest?.quarters.find((q) => q.id === saved.quarterId)?.name ??
                          saved.quarterId}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint empty-plans">Your saved alternatives will appear here.</p>
          )}
          <button
            type="button"
            className="new-plan"
            disabled={!catalog || state.loading}
            onClick={() => setDialog('new')}
          >
            ＋ New plan
          </button>
          <div className="sidebar-note">
            <span aria-hidden="true">↗</span>
            <p>
              Make a plan here.
              <br />
              Enroll through UCLA’s official systems.
            </p>
          </div>
        </aside>
        <main id="main" tabIndex={-1}>
          {plan && catalog ? (
            <>
              <div className="plan-header">
                <div>
                  <p className="eyebrow">{catalog.envelope.quarter.name} · QUARTER PLAN</p>
                  <h1>{plan.name}</h1>
                </div>
                <div className="plan-actions">
                  <button onClick={() => setDialog('rename')} type="button">
                    Rename
                  </button>
                  <button onClick={() => setDialog('copy')} type="button">
                    Make a copy
                  </button>
                  <button className="primary" onClick={download} type="button">
                    ↓ Download summary
                  </button>
                  <button
                    className="text-button danger"
                    onClick={() => setDialog('delete')}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="plan-status-line">
                <span className={`save-status ${state.saveState}`} role="status">
                  {state.saveState === 'saved' ? '✓ ' : ''}
                  {saveLabels[state.saveState]}
                </span>
                <span>
                  {source?.demo
                    ? 'Demonstration catalog · synthetic courses'
                    : 'Catalog-backed planning'}
                </span>
              </div>
              <section
                className="summary-strip"
                aria-label="Current plan checks"
                aria-live="polite"
                aria-atomic="true"
              >
                <div>
                  <span>SELECTED UNITS</span>
                  <strong>
                    {assessment ? assessment.academic.units.known : '—'}
                    <small>
                      {assessment?.academic.units.unresolved.length ? ' + unresolved' : ''}
                    </small>
                  </strong>
                  <span>
                    {plan.unitTarget
                      ? `${plan.unitTarget.min}–${plan.unitTarget.max} target · ${assessment?.academic.units.range ?? 'checking'}`
                      : 'No unit target specified'}
                  </span>
                </div>
                <a href="#schedule-diagnostics" onClick={() => setPane('schedule')}>
                  <span>TIME CONFLICTS</span>
                  <strong>{conflictCount ?? '—'}</strong>
                  <span>
                    {conflictCount
                      ? 'Review dated overlaps'
                      : assessment
                        ? 'No known time conflicts'
                        : 'Checking current revision'}
                  </span>
                </a>
                <a href="#schedule-diagnostics" onClick={() => setPane('schedule')}>
                  <span>UNVERIFIED / INCOMPLETE</span>
                  <strong>{incompleteCount ?? '—'}</strong>
                  <span>
                    {incompleteCount
                      ? 'Time check incomplete'
                      : assessment
                        ? 'Time check complete'
                        : 'Checks pending'}
                  </span>
                </a>
              </section>
            </>
          ) : (
            <div className="welcome-heading">
              <p className="eyebrow">YOUR NEXT QUARTER STARTS HERE</p>
              <h1>
                A plan that fits
                <br />
                your life.
              </h1>
              <p>
                Explore classes, make room for your commitments, and see where you stand. One
                quarter at a time.
              </p>
            </div>
          )}
          {state.loading && (
            <p className="notice" role="status">
              Loading your planning space…
            </p>
          )}
          {!!state.errors.length && (
            <div className="error-banner">
              <ErrorText errors={state.errors} id="session-errors" />
              <button className="text-button" type="button" onClick={() => session.clearErrors()}>
                Dismiss message
              </button>
            </div>
          )}
          {!!state.notice && (
            <p className="notice" role="status">
              {state.notice}
            </p>
          )}
          {!!state.manifest?.warning && !catalog && (
            <p className="notice">{state.manifest.warning}</p>
          )}
          {downloadError && (
            <p role="alert" className="error-banner">
              {downloadError}
            </p>
          )}
          {plan &&
            ['save_failed', 'revision_conflict', 'reconciling'].includes(state.saveState) && (
              <section className="recovery-panel" aria-label="Save recovery">
                <h2>Changes not saved</h2>
                <p>
                  {state.saveState === 'revision_conflict'
                    ? 'Another tab changed or deleted this plan. Your current inputs are preserved here. Choose how to continue.'
                    : 'Your current inputs are still available in this session. Closing the browser before saving may lose these edits.'}
                </p>
                <div className="actions">
                  {state.saveState !== 'revision_conflict' && (
                    <button type="button" onClick={() => void session.retrySave()}>
                      Retry save
                    </button>
                  )}
                  {state.saveState === 'revision_conflict' && (
                    <button type="button" onClick={() => setDialog('loadNewer')}>
                      Load newer revision
                    </button>
                  )}
                  <button type="button" onClick={() => setDialog('copy')}>
                    Save as a separate plan
                  </button>
                  <button type="button" onClick={download}>
                    Download current inputs
                  </button>
                </div>
                <p className="hint">
                  At 20 saved plans, another copy cannot be saved. Download remains available.
                </p>
              </section>
            )}
          {plan && state.assessmentStatus === 'failed' && (
            <section className="recovery-panel">
              <h2>Checks unavailable for this revision</h2>
              <p>
                Your inputs are preserved. Download includes the current inputs with checks marked
                unavailable.
              </p>
              <button type="button" onClick={() => session.retryAssessment()}>
                Retry checks
              </button>
            </section>
          )}
          {!plan && (
            <div className="welcome-grid">
              <section className="panel start-panel">
                <span className="step-number">01 / START WITH A QUARTER</span>
                <h2>{catalog ? catalog.envelope.quarter.name : 'Choose your quarter'}</h2>
                {catalog ? (
                  <>
                    <p className="hint">
                      {catalog.envelope.source.demo
                        ? 'Demonstration data — these are fictional courses for trying the planner.'
                        : `Catalog from ${catalog.envelope.source.name}`}
                    </p>
                    <PrivacyNotice />
                    <NameForm
                      label="Plan name"
                      submit={(name) => session.create(name)}
                      submitLabel="Create my plan →"
                    />
                  </>
                ) : (
                  <>
                    <p>Choose an available quarter in the sidebar, then give your plan a name.</p>
                    {!state.loading && !state.manifest?.quarters.length && (
                      <>
                        <p role="status">No quarter catalog is available</p>
                        <button type="button" onClick={() => void session.initialize()}>
                          Retry catalog
                        </button>
                      </>
                    )}
                  </>
                )}
              </section>
              <section className="welcome-guide">
                <p className="eyebrow">THINK IT THROUGH, THEN MAKE IT YOURS</p>
                <ol>
                  <li>
                    <span>1</span>
                    <div>
                      <h3>Find your classes</h3>
                      <p>Choose lectures and linked sections from the quarter’s catalog.</p>
                    </div>
                  </li>
                  <li>
                    <span>2</span>
                    <div>
                      <h3>See the whole picture</h3>
                      <p>Check real meeting dates, personal time, and academic targets.</p>
                    </div>
                  </li>
                  <li>
                    <span>3</span>
                    <div>
                      <h3>Keep your options open</h3>
                      <p>Save alternatives and take a readable summary with you.</p>
                    </div>
                  </li>
                </ol>
              </section>
            </div>
          )}
          {catalog && (
            <details className="provenance">
              <summary>
                Catalog: {catalog.envelope.source.name} · {catalog.envelope.version}
                {source?.demo ? ' · Demonstration data' : ''}
                {ageHours > 24 ? ' · Snapshot is over 24 hours old' : ''}
                {state.olderCatalog ? ' · Older version retained' : ''}
              </summary>
              <p>
                Published/retrieved: <time>{source?.publishedAt}</time> · Age:{' '}
                {ageHours < 1 ? 'less than one hour' : `${Math.floor(ageHours)} hours`}
              </p>
              <p>Source reference: {source?.reference}</p>
              <p>
                Version identity: {catalog.ref.version} / {catalog.ref.digest}
              </p>
              {ageHours > 24 && (
                <p className="warning">
                  Offerings and availability may have changed. This snapshot is{' '}
                  {Math.floor(ageHours / 24)} days old.
                </p>
              )}
              {plan && (
                <button type="button" onClick={() => void session.checkCatalogUpdate()}>
                  Check for catalog updates
                </button>
              )}
              {!plan && (
                <button
                  type="button"
                  onClick={() => void session.selectQuarter(catalog.envelope.quarter.id)}
                >
                  Retry catalog
                </button>
              )}
            </details>
          )}
          {state.adoption && (
            <section className="panel adoption-panel">
              <h2>Review catalog update</h2>
              <p>
                {state.adoption.preview.oldRef.version} → {state.adoption.preview.newRef.version}.
                Your choices will be retained; removed or invalid choices will need attention.
              </p>
              <ul>
                {state.adoption.preview.changes.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
              <div className="actions">
                <button
                  type="button"
                  className="primary"
                  onClick={() => void session.applyCatalogUpdate()}
                >
                  Apply reviewed catalog
                </button>
                <button type="button" onClick={() => session.keepCatalog()}>
                  Keep saved version
                </button>
              </div>
            </section>
          )}
          {plan && catalog && (
            <div className="workspace">
              <div className="workspace-main">
                <nav className="view-tabs" aria-label="Plan views">
                  <button aria-pressed={pane === 'schedule'} onClick={() => setPane('schedule')}>
                    Schedule & courses
                  </button>
                  <button aria-pressed={pane === 'academic'} onClick={() => setPane('academic')}>
                    Academic checks
                  </button>
                  <button aria-pressed={pane === 'personal'} onClick={() => setPane('personal')}>
                    Personal time
                  </button>
                </nav>
                {pane === 'schedule' && (
                  <div className="stack">
                    <PlanCourses
                      plan={plan}
                      catalog={catalog}
                      session={session}
                      focusId={state.focusCourseId}
                      canUndo={state.canUndo}
                    />
                    {assessment ? (
                      <Schedule
                        key={plan.id}
                        report={assessment.schedule}
                        quarter={catalog.envelope.quarter}
                      />
                    ) : (
                      <section className="panel" role="status">
                        {state.assessmentStatus === 'failed'
                          ? 'Schedule checks unavailable. Retry above.'
                          : 'Calculating this revision’s complete schedule…'}
                      </section>
                    )}
                  </div>
                )}
                {pane === 'academic' && (
                  <Academic
                    key={plan.id}
                    plan={plan}
                    catalog={catalog}
                    session={session}
                    report={assessment?.academic ?? null}
                  />
                )}
                {pane === 'personal' && (
                  <PersonalTimes
                    key={plan.id}
                    plan={plan}
                    quarter={catalog.envelope.quarter}
                    session={session}
                  />
                )}
              </div>
              <CatalogPanel
                key={`${plan.id}-${catalog.ref.digest}`}
                catalog={catalog}
                plan={plan}
                session={session}
              />
            </div>
          )}
          <footer>
            <p>
              This planner supports your decisions. It does not enroll you or certify academic
              requirements.
            </p>
            <p>
              Stored on this device, in this browser profile. Clearing browser data may remove your
              plans.
            </p>
          </footer>
        </main>
      </div>
      {(dialog === 'rename' || dialog === 'copy' || dialog === 'new') && (
        <Modal
          title={
            dialog === 'rename'
              ? 'Rename your plan'
              : dialog === 'copy'
                ? 'Save an independent alternative'
                : 'Create a new plan'
          }
          close={() => setDialog(null)}
        >
          {dialog === 'new' && <PrivacyNotice />}
          <NameForm
            label="Plan name"
            initial={
              dialog === 'rename'
                ? plan?.name
                : dialog === 'copy'
                  ? `${plan?.name ?? ''} — alternative`
                  : ''
            }
            submitLabel={
              dialog === 'rename' ? 'Rename plan' : dialog === 'copy' ? 'Save copy' : 'Create plan'
            }
            cancel={() => setDialog(null)}
            submit={(name) =>
              named(
                dialog === 'rename'
                  ? (value) => session.edit({ type: 'rename', name: value })
                  : dialog === 'copy'
                    ? (value) => session.duplicate(value)
                    : (value) => session.create(value),
                name,
              )
            }
          />
        </Modal>
      )}
      {dialog === 'delete' && plan && (
        <Modal title={`Delete “${plan.name}”?`} close={() => setDialog(null)}>
          <p>This removes this saved alternative from this browser profile.</p>
          {state.saveState !== 'saved' && (
            <p className="warning">This also discards unsaved changes in the current session.</p>
          )}
          <div className="actions">
            <button
              type="button"
              className="danger-button"
              onClick={async () => {
                if ((await session.deleteCurrent(plan.name, true)).ok) setDialog(null);
              }}
            >
              Delete {plan.name}
            </button>
            <button type="button" onClick={() => setDialog(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
      {dialog === 'loadNewer' && (
        <Modal
          title="Discard current edits and load the newer revision?"
          close={() => setDialog(null)}
        >
          <p>
            Your current unsaved edits will be discarded. Download them first if you want to keep a
            record.
          </p>
          <div className="actions">
            <button type="button" onClick={download}>
              Download current inputs
            </button>
            <button
              type="button"
              className="primary"
              onClick={async () => {
                if ((await session.loadNewer(true)).ok) setDialog(null);
              }}
            >
              Discard edits and load newer
            </button>
            <button type="button" onClick={() => setDialog(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
      {pendingNavigation && (
        <Modal title="Keep your unsaved work?" close={() => setPendingNavigation(null)}>
          <p>
            Changes not saved. Retry saving or download the current plan before switching.
            Discarding leaves the last saved revision intact.
          </p>
          <div className="actions">
            <button
              type="button"
              onClick={async () => {
                await session.retrySave();
                setPendingNavigation(null);
              }}
            >
              Retry save and stay
            </button>
            <button type="button" onClick={download}>
              Download current inputs
            </button>
            <button
              type="button"
              className="danger-button"
              onClick={async () => {
                if ((await pendingNavigation()).ok) setPendingNavigation(null);
              }}
            >
              Discard unsaved edits and switch
            </button>
            <button type="button" onClick={() => setPendingNavigation(null)}>
              Keep editing
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function PrivacyNotice() {
  return (
    <p className="privacy-note">
      Plans save automatically in this browser profile on this device. Others using the same profile
      can access them. Clearing browser data may remove them. Your coursework is not sent to a
      server.
    </p>
  );
}
