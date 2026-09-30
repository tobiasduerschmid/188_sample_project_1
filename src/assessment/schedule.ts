import { expandMeeting, localDateTime } from '../domain/calendar';
import type {
  Meeting,
  Occurrence,
  OccurrenceOwner,
  PlanInputs,
  SelectionFacts,
  ScheduleReport,
} from '../domain/types';

export function evaluateSchedule(plan: PlanInputs, facts: SelectionFacts): ScheduleReport {
  const report: ScheduleReport = {
    occurrences: [],
    conflicts: [],
    incomplete: [],
    unscheduled: [],
    availability: [],
  };
  const add = (meeting: Meeting, owner: OccurrenceOwner) => {
    if (meeting.kind === 'async' || meeting.kind === 'tba') {
      report.unscheduled.push({
        ownerId: owner.id,
        label: `${owner.label}${owner.kind === 'exam' ? ' — exam' : ''}`,
        kind: meeting.kind,
      });
      if (meeting.kind === 'tba')
        report.incomplete.push({
          id: `${owner.kind}:${owner.id}:${meeting.id}:tba`,
          ownerId: owner.id,
          message: `${owner.label}: ${owner.kind === 'exam' ? 'exam ' : ''}meeting time to be announced.`,
        });
      return;
    }
    const expanded = expandMeeting(meeting, facts.quarter, owner);
    if (expanded.ok) report.occurrences.push(...expanded.value);
    else
      for (const issue of expanded.errors)
        report.incomplete.push({
          id: `${owner.kind}:${owner.id}:${meeting.id}:${issue.field}`,
          ownerId: owner.id,
          message: `${owner.label}: ${issue.message}`,
        });
  };
  for (const selection of facts.selections) {
    selection.issues.forEach((message, index) =>
      report.incomplete.push({
        id: `${selection.canonicalId}:bundle:${index}`,
        ownerId: selection.canonicalId,
        message,
      }),
    );
    for (const selected of selection.sections) {
      const section = selected.section;
      if (!section) {
        report.availability.push({
          id: `${selected.id}:removed`,
          ownerId: selected.id,
          message: `${selected.lastKnown?.label ?? selected.id}: section removed or unresolved.`,
        });
        continue;
      }
      const label = `${selection.course?.code ?? selection.canonicalId} ${section.label} (${section.id}) · ${section.location ?? 'Location unknown'} · ${section.modality ?? 'Modality unknown'}`;
      if (section.availability !== 'open')
        report.availability.push({
          id: `${section.id}:availability`,
          ownerId: section.id,
          message: `${label}: availability ${section.availability}. This plan does not reserve a seat.`,
        });
      if (section.availability === 'canceled') continue;
      for (const meeting of section.meetings)
        add(meeting, { id: section.id, label, kind: 'class' });
      if (section.exams === null)
        report.incomplete.push({
          id: `${section.id}:exam:unknown`,
          ownerId: section.id,
          message: `${label}: exam schedule is unknown.`,
        });
      else
        for (const exam of section.exams)
          add(exam, { id: section.id, label: `${label} — exam`, kind: 'exam' });
    }
  }
  for (const personal of plan.personalTimes)
    add(personal.meeting, {
      id: personal.id,
      label: personal.label.trim() || 'Personal unavailable time',
      kind: 'personal',
    });
  report.occurrences.sort((a, b) => a.start - b.start || a.end - b.end || a.id.localeCompare(b.id));
  // Sweep sorted starts: only intervals that have not ended can overlap the current one.
  let active: Occurrence[] = [];
  for (const next of report.occurrences) {
    active = active.filter((a) => a.end > next.start);
    for (const previous of active) {
      if (previous.kind === 'personal' && next.kind === 'personal') continue;
      if (!(previous.start < next.end && next.start < previous.end)) continue;
      const [a, b] = previous.id < next.id ? [previous, next] : [next, previous];
      const start = Math.max(a.start, b.start);
      const end = Math.min(a.end, b.end);
      report.conflicts.push({
        id: JSON.stringify([a.id, b.id]),
        a,
        b,
        start,
        end,
        localStart: localDateTime(start, facts.quarter.timezone),
        localEnd: localDateTime(end, facts.quarter.timezone),
      });
    }
    active.push(next);
  }
  return report;
}
