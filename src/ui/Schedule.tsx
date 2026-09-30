import { useState } from 'react';
import type { Quarter, ScheduleReport } from '../domain/types';
import { dateLabel, timeLabel } from './shared';

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
function monday(date: string): string {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return addDays(date, -(day === 0 ? 6 : day - 1));
}

export function Schedule({ report, quarter }: { report: ScheduleReport; quarter: Quarter }) {
  const [week, setWeek] = useState(0);
  const [mode, setMode] = useState<'grid' | 'list'>('grid');
  const first = monday(quarter.instructionStart);
  const weeks: string[] = [];
  for (let date = first; date <= quarter.examEnd; date = addDays(date, 7)) weeks.push(date);
  const start = weeks[Math.min(week, weeks.length - 1)];
  const end = addDays(start, 7);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const occurrences = report.occurrences.filter(
    (o) =>
      o.localStart.slice(0, 10) < end &&
      (o.localEnd.slice(0, 10) > start ||
        (o.localEnd.slice(0, 10) === start && timeLabel(o.localEnd) !== '00:00')),
  );
  return (
    <div className="stack">
      <section className="panel" aria-labelledby="schedule-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MAKE SPACE FOR YOUR WEEK</p>
            <h2 id="schedule-title">Your schedule</h2>
            <p className="hint">All times: {quarter.timezone}</p>
          </div>
          <div className="segmented">
            <button type="button" aria-pressed={mode === 'grid'} onClick={() => setMode('grid')}>
              Week
            </button>
            <button type="button" aria-pressed={mode === 'list'} onClick={() => setMode('list')}>
              List
            </button>
          </div>
        </div>
        <div className="week-toolbar">
          <button
            type="button"
            aria-label="Previous week"
            disabled={week === 0}
            onClick={() => setWeek(week - 1)}
          >
            ←
          </button>
          <label>
            Week
            <select
              aria-label="Schedule week"
              value={Math.min(week, weeks.length - 1)}
              onChange={(e) => setWeek(Number(e.target.value))}
            >
              {weeks.map((date, index) => (
                <option key={date} value={index}>
                  {dateLabel(date)} – {dateLabel(addDays(date, 6))}
                  {date >= monday(quarter.examStart) ? ' · Exams' : ''}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            aria-label="Next week"
            disabled={week >= weeks.length - 1}
            onClick={() => setWeek(week + 1)}
          >
            →
          </button>
        </div>
        {mode === 'grid' ? (
          <div
            className="schedule-overflow"
            role="region"
            aria-label="Weekly schedule grid"
            tabIndex={0}
          >
            <div className="week-grid">
              {days.map((date) => (
                <div className="day-column" key={date}>
                  <h3>
                    {new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
                      weekday: 'short',
                      timeZone: 'UTC',
                    })}
                    <span>{dateLabel(date)}</span>
                  </h3>
                  <div className="day-events">
                    {occurrences
                      .filter(
                        (o) =>
                          o.localStart.slice(0, 10) <= date &&
                          (o.localEnd.slice(0, 10) > date ||
                            (o.localEnd.slice(0, 10) === date &&
                              timeLabel(o.localEnd) !== '00:00')),
                      )
                      .map((o) => (
                        <div className={`meeting ${o.kind}`} key={o.id}>
                          <strong>
                            {o.localStart.slice(0, 10) < date
                              ? 'Continued'
                              : timeLabel(o.localStart)}
                            –{o.localEnd.slice(0, 10) > date ? 'next day' : timeLabel(o.localEnd)}
                          </strong>
                          <span>{o.label}</span>
                          {o.kind !== 'class' && (
                            <span className="meeting-kind">
                              {o.kind === 'exam' ? 'Exam' : 'Personal time'}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="chronological" aria-label="Chronological schedule">
            <p className="hint">
              Every dated occurrence in the selected week, including examinations and personal time.
            </p>
            {occurrences.length ? (
              occurrences.map((o) => (
                <div className={`list-meeting ${o.kind}`} key={o.id}>
                  <div>
                    <strong>{dateLabel(o.localStart)}</strong>
                    <span>
                      {timeLabel(o.localStart)}–
                      {o.localStart.slice(0, 10) !== o.localEnd.slice(0, 10)
                        ? `${dateLabel(o.localEnd)} `
                        : ''}
                      {timeLabel(o.localEnd)}
                    </span>
                  </div>
                  <div>
                    <strong>{o.label}</strong>
                    <span>
                      {o.kind === 'class'
                        ? 'Class meeting'
                        : o.kind === 'exam'
                          ? 'Exam'
                          : 'Personal time'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-note">No timed meetings this week.</p>
            )}
          </div>
        )}
        {!!report.unscheduled.length && (
          <div className="unscheduled">
            <h3>Outside the time grid</h3>
            {report.unscheduled.map((item, i) => (
              <p key={`${item.ownerId}-${i}`}>
                <strong>{item.label}</strong> ·{' '}
                {item.kind === 'async' ? 'Asynchronous' : 'Time to be announced'}
              </p>
            ))}
          </div>
        )}
      </section>
      <section className="panel" id="schedule-diagnostics" aria-labelledby="diagnostics-title">
        <h2 id="diagnostics-title">Schedule checks</h2>
        <p className={report.incomplete.length ? 'warning' : 'positive'}>
          {report.incomplete.length ? 'Time check incomplete' : 'Time check complete'} ·{' '}
          {report.conflicts.length
            ? `${report.conflicts.length} dated conflicts`
            : 'No known time conflicts'}
        </p>
        {!!report.incomplete.length && (
          <div className="diagnostic-group">
            <h3>Unverified or incomplete ({report.incomplete.length})</h3>
            <ul>
              {report.incomplete.map((item) => (
                <li key={item.id}>{item.message}</li>
              ))}
            </ul>
          </div>
        )}
        {!!report.conflicts.length && (
          <details className="diagnostic-group">
            <summary>View all {report.conflicts.length} dated conflicts</summary>
            <ol className="conflicts">
              {report.conflicts.map((c) => (
                <li key={c.id}>
                  <strong>
                    {dateLabel(c.localStart)} · {timeLabel(c.localStart)}–{timeLabel(c.localEnd)}
                  </strong>
                  <span>
                    {c.a.label} overlaps {c.b.label}
                  </span>
                  <span className="hint">
                    {c.a.ownerId} / {c.b.ownerId}
                  </span>
                </li>
              ))}
            </ol>
          </details>
        )}
        {!!report.availability.length && (
          <div className="diagnostic-group">
            <h3>Availability notices</h3>
            <ul>
              {report.availability.map((item) => (
                <li key={item.id}>{item.message}</li>
              ))}
            </ul>
            <p className="hint">No seats are reserved by this plan.</p>
          </div>
        )}
      </section>
    </div>
  );
}
