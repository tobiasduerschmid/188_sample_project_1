import { useState, type FormEvent } from 'react';
import type { PersonalTime, PlanInputs, Quarter } from '../domain/types';
import type { PlanSession } from '../session/session';
import { newId } from '../domain/identity';
import { ErrorText, meetingText, useFormResult } from './shared';

export function PersonalTimes({
  plan,
  quarter,
  session,
}: {
  plan: PlanInputs;
  quarter: Quarter;
  session: PlanSession;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [repeat, setRepeat] = useState(false);
  const [startDate, setStartDate] = useState(quarter.instructionStart);
  const [endDate, setEndDate] = useState(quarter.instructionStart);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [overnight, setOvernight] = useState(false);
  const [startOffset, setStartOffset] = useState('');
  const [endOffset, setEndOffset] = useState('');
  const [weekdays, setWeekdays] = useState([1]);
  const form = useFormResult();
  function reset() {
    setEditing(null);
    setLabel('');
    form.clear();
  }
  function edit(record: PersonalTime) {
    setEditing(record.id);
    setLabel(record.label);
    form.clear();
    const m = record.meeting;
    setRepeat(m.kind === 'weekly');
    const split = (value: string) => {
      const match = value.match(/^(.+?)([+-]\d{2}:\d{2})?$/)!;
      return { time: match[1], offset: match[2] ?? '' };
    };
    if (m.kind === 'weekly') {
      const start = split(m.startTime);
      const end = split(m.endTime);
      setStartDate(m.startDate);
      setEndDate(m.endDate);
      setStartTime(start.time);
      setEndTime(end.time);
      setStartOffset(start.offset);
      setEndOffset(end.offset);
      setOvernight(m.endDayOffset > 0);
      setWeekdays(m.weekdays);
    } else {
      const start = split(m.start.slice(11));
      const end = split(m.end.slice(11));
      setStartDate(m.start.slice(0, 10));
      setEndDate(m.end.slice(0, 10));
      setStartTime(start.time);
      setEndTime(end.time);
      setStartOffset(start.offset);
      setEndOffset(end.offset);
    }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    const id = editing ?? newId();
    const prior = plan.personalTimes.find((p) => p.id === editing)?.meeting;
    const meeting = repeat
      ? {
          id,
          kind: 'weekly' as const,
          weekdays,
          startDate,
          endDate,
          startTime: startTime + startOffset.trim(),
          endTime: endTime + endOffset.trim(),
          endDayOffset: overnight ? 1 : 0,
          exclusions: prior?.kind === 'weekly' ? prior.exclusions : [],
          replacements: prior?.kind === 'weekly' ? prior.replacements : [],
        }
      : {
          id,
          kind: 'once' as const,
          start: `${startDate}T${startTime}${startOffset.trim()}`,
          end: `${endDate}T${endTime}${endOffset.trim()}`,
        };
    if (
      form.accept(await session.edit({ type: 'upsertPersonalTime', value: { id, label, meeting } }))
    )
      reset();
  }
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR TIME MATTERS, TOO</p>
          <h2>Personal unavailable times</h2>
        </div>
        <span className="count-pill">{plan.personalTimes.length}/100</span>
      </div>
      <p className="hint">
        Work, appointments, or time you want to protect. All dates and times use {quarter.timezone}.
      </p>
      {!plan.personalTimes.length && <p className="empty-note">No personal times added.</p>}
      <div className="record-list">
        {plan.personalTimes.map((record) => (
          <article key={record.id}>
            <div>
              <strong>{record.label}</strong>
              <span>{meetingText(record.meeting)}</span>
            </div>
            <div className="actions">
              <button
                type="button"
                aria-label={`Edit personal time ${record.label}`}
                onClick={() => edit(record)}
              >
                Edit
              </button>
              <button
                type="button"
                className="text-button danger"
                aria-label={`Delete personal time ${record.label}`}
                onClick={() => void session.edit({ type: 'removePersonalTime', id: record.id })}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
      <form className="form-stack inset" onSubmit={save}>
        <h3>{editing ? 'Edit personal time' : 'Add unavailable time'}</h3>
        <label>
          Personal time label
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Work shift"
            aria-describedby="personal-error"
          />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={repeat}
            onChange={(e) => {
              setRepeat(e.target.checked);
              setEndDate(e.target.checked ? quarter.instructionEnd : startDate);
            }}
          />
          Repeat weekly
        </label>
        <div className="form-row">
          <label>
            {repeat ? 'First date' : 'Start date'}
            <input
              type="date"
              value={startDate}
              min={quarter.instructionStart}
              max={quarter.examEnd}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (!repeat) setEndDate(e.target.value);
              }}
              aria-describedby="personal-error"
            />
          </label>
          <label>
            {repeat ? 'Last date' : 'End date'}
            <input
              type="date"
              value={endDate}
              min={quarter.instructionStart}
              max={quarter.examEnd}
              onChange={(e) => setEndDate(e.target.value)}
              aria-describedby="personal-error"
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Start time
            <input
              type="time"
              step="0.001"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              aria-describedby="personal-error"
            />
          </label>
          <label>
            End time
            <input
              type="time"
              step="0.001"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              aria-describedby="personal-error"
            />
          </label>
        </div>
        <details>
          <summary>Daylight-saving offsets (optional)</summary>
          <p className="hint">
            Only needed to distinguish a clock time that occurs twice during a daylight-saving
            transition. Use the institution timezone's valid offset, such as −07:00 or −08:00. Omit
            offsets for normal recurring times across a transition.
          </p>
          <div className="form-row">
            <label>
              Start UTC offset
              <input
                value={startOffset}
                onChange={(e) => setStartOffset(e.target.value)}
                placeholder="-07:00"
                aria-describedby="personal-error"
              />
            </label>
            <label>
              End UTC offset
              <input
                value={endOffset}
                onChange={(e) => setEndOffset(e.target.value)}
                placeholder="-08:00"
                aria-describedby="personal-error"
              />
            </label>
          </div>
        </details>
        {repeat && (
          <>
            <fieldset className="weekdays">
              <legend>Repeat on</legend>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <label key={day}>
                  <input
                    type="checkbox"
                    checked={weekdays.includes(i + 1)}
                    onChange={(e) =>
                      setWeekdays(
                        e.target.checked
                          ? [...weekdays, i + 1].sort()
                          : weekdays.filter((d) => d !== i + 1),
                      )
                    }
                  />
                  {day}
                </label>
              ))}
            </fieldset>
            <label className="check-label">
              <input
                type="checkbox"
                checked={overnight}
                onChange={(e) => setOvernight(e.target.checked)}
              />
              Ends on the following day
            </label>
          </>
        )}
        <ErrorText errors={form.errors} id="personal-error" />
        <div className="actions">
          <button type="submit">
            {editing ? 'Save personal time changes' : 'Add personal time'}
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
