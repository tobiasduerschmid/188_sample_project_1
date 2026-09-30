import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { Problem, Result, Rule, Meeting } from '../domain/types';

export function ErrorText({ errors, id = 'form-error' }: { errors: Problem[]; id?: string }) {
  return errors.length ? (
    <div id={id} className="field-error" role="alert">
      {errors.map((e, i) => (
        <p key={i}>{e.message}</p>
      ))}
    </div>
  ) : null;
}
export function useFormResult() {
  const [errors, setErrors] = useState<Problem[]>([]);
  return {
    errors,
    clear: () => setErrors([]),
    accept: <T,>(result: Result<T>) => {
      setErrors(result.ok ? [] : result.errors);
      return result.ok;
    },
  };
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);
  return (
    <dialog ref={ref} className="modal" aria-labelledby="dialog-title" onCancel={close}>
      <div className="section-heading">
        <h2 id="dialog-title">{title}</h2>
        <button type="button" className="icon-button" aria-label="Close dialog" onClick={close}>
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function NameForm({
  label,
  initial = '',
  submit,
  cancel,
  submitLabel = 'Save',
}: {
  label: string;
  initial?: string;
  submit: (name: string) => Promise<Result<void>>;
  cancel?: () => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const form = useFormResult();
  async function send(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    form.accept(await submit(name));
    setBusy(false);
  }
  return (
    <form onSubmit={send} className="form-stack">
      <label>
        {label}
        <input
          autoFocus={!!cancel}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!form.errors.length}
          aria-describedby={form.errors.length ? 'name-error' : 'name-hint'}
        />
      </label>
      <p id="name-hint" className="hint">
        1–80 characters. Names must be unique within a quarter.
      </p>
      <ErrorText errors={form.errors} id="name-error" />
      <div className="actions">
        <button className="primary" disabled={busy} type="submit">
          {busy ? 'Working…' : submitLabel}
        </button>
        {cancel && (
          <button type="button" onClick={cancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
export function ruleText(rule: Rule): string {
  const pending: (Rule | string)[] = [rule];
  const parts: string[] = [];
  while (pending.length) {
    const next = pending.pop()!;
    if (typeof next === 'string') {
      parts.push(next);
      continue;
    }
    if (next.kind === 'none') parts.push('None');
    else if (next.kind === 'unknown')
      parts.push(next.text ? `Unknown — ${next.text}` : 'Unknown — needs verification');
    else if (next.kind === 'manual') parts.push(`Manual review required: ${next.text}`);
    else if (next.kind === 'course') parts.push(next.courseId);
    else {
      parts.push(`${next.kind === 'all' ? 'All' : 'Any'} of: (`);
      pending.push(')');
      for (let i = next.rules.length - 1; i >= 0; i--) {
        pending.push(next.rules[i]);
        if (i > 0) pending.push('; ');
      }
    }
  }
  return parts.join('');
}
export function meetingText(meeting: Meeting): string {
  if (meeting.kind === 'async') return 'Asynchronous — no scheduled meeting';
  if (meeting.kind === 'tba') return 'Time to be announced';
  if (meeting.kind === 'once')
    return `${meeting.start.replace('T', ' ')} → ${meeting.end.replace('T', ' ')}`;
  if (meeting.kind === 'weekly') {
    const days = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return `${meeting.weekdays.map((day) => days[day]).join(' / ')} ${meeting.startTime}–${meeting.endTime}${meeting.endDayOffset ? ' (+1 day)' : ''}, ${meeting.startDate} through ${meeting.endDate}${meeting.exclusions.length ? `; canceled dates: ${meeting.exclusions.join(', ')}` : ''}${meeting.replacements.length ? `; replacements: ${meeting.replacements.map(meetingText).join('; ')}` : ''}`;
  }
  return 'Unknown';
}
export function dateLabel(date: string): string {
  return new Date(`${date.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
export function timeLabel(local: string): string {
  return local.slice(11).replace(/^(\d{2}:\d{2}):00(?:\.0+)?$/, '$1');
}
