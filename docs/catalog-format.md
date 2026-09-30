# Catalog maintenance

The public catalog is a complete, attributable snapshot for one quarter. It contains no plans, personal intervals, coursework history, academic targets, or browser storage. Maintainers need permission to write the deployment's catalog directory. The browser has only a read capability and cannot publish.

The checked-in `public/catalog/manifest.json` lists two **fictional** quarters. Winter implements `requirements.md` §7.1 exactly; Fall demonstrates a second selectable quarter. Their TEST course codes and availability are synthetic, not UCLA offerings. Published timestamps remain the actual publication timestamps; the application must not refresh them on each visit.

## Validate and publish

```sh
npm run catalog:validate -- /absolute/path/to/snapshot.json
npm run catalog:publish -- /absolute/path/to/snapshot.json
# Optional destination and expected current manifest digest:
npm run catalog:publish -- /absolute/path/to/snapshot.json /absolute/path/to/catalog expected-digest
```

Validation prints all detected field/record-specific failures and exits nonzero on rejection. It makes no public-file changes. Publication defaults to `public/catalog`. The optional expected digest is the previous receipt's `manifestRevision`; use `absent` for an initially missing manifest. It rejects a stale reviewed revision rather than overwriting it.

A successful publication returns the quarter, version, SHA-256 content digest, manifest revision digest, and relative public URL. It preserves other quarters. Catalog filenames are hashes of quarter/version identity, and their content is immutable. Repeating exactly the same quarter/version/content is safe. Changing a title, timestamp, availability, meeting, or any other accepted field requires a new version.

Publication validates the complete document, acquires an exclusive directory lock, writes and flushes staged content, creates the immutable version without overwriting a prior file, then atomically replaces the manifest on the same filesystem. Before activation it rechecks the previous manifest; after activation it reads back the result. Failed validation or definite activation failure preserves the prior active manifest. Staged immutable content may remain after activation failure and is safe to reuse on retry with identical input.

`publication_busy` means another publisher owns `.publish.lock`. After a crashed process, confirm no publisher is running before removing that lock. `publication_conflict` requires reading the current manifest before retrying. `activation_indeterminate` means the active version could not be verified: inspect `manifest.json` and compare the expected quarter/version/digest before retrying. Do not manufacture another version to hide an uncertain outcome. If read-back shows the proposed manifest, activation succeeded; if it shows the previous manifest, activation failed. Public servers must serve the complete directory, including older immutable versions, with the manifest and relative version URLs at the same origin.

## JSON representation, schema version 1

Use the checked-in immutable JSON files under `public/catalog/versions` as complete examples. The type definitions are in `src/domain/types.ts`, admission logic in `src/catalog/boundary.ts`, and the command in `scripts/catalog.ts`. Unknown object fields are rejected throughout the envelope so accidental private payloads are not published. Strings described as required must be nonblank; course identity/code tokens must have no surrounding whitespace. Dates use `YYYY-MM-DD`. Clock values use `HH:mm`, optionally seconds and up to three fractional digits (millisecond precision); finer input is rejected rather than rounded. Values are interpreted in the quarter's named institution timezone, independent of the device timezone.

| Record        | Required fields and meaning                                                                                                                                                                                                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Envelope      | `schemaVersion: 1`, nonblank `version`, `source`, `quarter`, `courses` array, `sections` array. Empty arrays are valid.                                                                                                                                                                                                                                                        |
| Source        | `name`, `reference`, `publishedAt` as an ISO timestamp with an offset, and boolean `demo`. References are displayed as source text.                                                                                                                                                                                                                                            |
| Quarter       | Stable `id`, display `name`, named IANA `timezone`, `instructionStart`, `instructionEnd`, `examStart`, `examEnd`. Instruction/exam intervals must be ordered; the whole span including exams is at most 140 inclusive days.                                                                                                                                                    |
| Course        | Stable `id`, `subject`, unique `code`, `title`, `description` as nonblank text or explicit `null`, `units` as a nonempty array of distinct finite nonnegative permitted numbers, academic rules, and `requiredComponents` as a nonempty object mapping component names to positive integer counts. Fixed units have one permitted value.                                       |
| Section       | Stable `id`, existing `courseId`, matching `quarterId`, declared `component`, `label`, `instructors` as a nonempty string array or `null`, `location`/`modality` as text or `null`, `availability`, `compatibleWith`, nonempty `meetings`, and `exams`.                                                                                                                        |
| Availability  | Exactly `open`, `full`, `waitlist`, `canceled`, or `unknown`. Missing availability is invalid. Canceled sections remain public facts, but have no active selected occurrences.                                                                                                                                                                                                 |
| Compatibility | `compatibleWith: null` declares no linkage restriction. An array enumerates permitted section IDs from other components of the same canonical course. When both sections explicitly enumerate allowed partners, links must be symmetric. Each non-null side must allow the other when forming a bundle. Required component counts independently determine bundle completeness. |
| Exams         | `[]` explicitly means no exam, `null` means unknown exam information, or an array supplies meeting definitions. An omitted field is invalid.                                                                                                                                                                                                                                   |

The limits are 5,000 courses and 20,000 sections per snapshot. Identity/code collisions, duplicate section or meeting IDs, invalid references, invalid unit choices, malformed component counts, missing required values, and every out-of-quarter occurrence reject publication. Unknown instructor/location/modality/description values must be explicit `null`, rather than blank strings or absent properties.

## Meetings and institution time

Each meeting has a nonblank stable `id` and exactly one `kind`:

```json
{ "id": "lecture", "kind": "once", "start": "2026-01-06T09:00", "end": "2026-01-06T10:00" }
```

```json
{
  "id": "lecture",
  "kind": "weekly",
  "weekdays": [1, 3],
  "startDate": "2026-01-05",
  "endDate": "2026-03-13",
  "startTime": "09:00",
  "endTime": "10:00",
  "endDayOffset": 0,
  "exclusions": ["2026-01-19"],
  "replacements": [
    { "id": "makeup", "kind": "once", "start": "2026-01-20T09:00", "end": "2026-01-20T10:00" }
  ]
}
```

```json
{ "id": "independent", "kind": "async" }
```

```json
{ "id": "seminar", "kind": "tba" }
```

Weekday numbers are ISO: Monday 1 through Sunday 7. Recurrence start dates include both bounds, and only matching weekdays produce originals. Exclusions suppress originals; replacements are additional fully dated meetings and do not automatically remove an original. Supply both an exclusion and replacement when moving a meeting. `endDayOffset: 1` means the end is on the following date; a nonnegative integer expresses longer dated intervals when needed.

Every active original, replacement, and supplied exam is validated against the entire quarter span. End must follow start. Intervals are half open: `[start, end)`, so a 10:00 end and 10:00 start do not conflict. Overnight meetings use their actual end date. Local clocks remain fixed across daylight-saving changes. Nonexistent clock times are rejected; ambiguous clock times require an explicit matching offset, for example `2026-11-01T01:30-07:00` and `2026-11-01T01:45-08:00`. The timezone must agree with the supplied offset. Weekly clocks can likewise carry explicit offsets; each generated date is validated. Async activities have no timed occurrences. TBA and unknown exams keep the time check incomplete.

## Academic rules and aliases

Supported rules are:

```json
{ "kind": "none" }
{ "kind": "unknown", "text": "Source has not supplied a rule" }
{ "kind": "course", "courseId": "TEST001" }
{ "kind": "all", "rules": [ { "kind": "course", "courseId": "TEST001" } ] }
{ "kind": "any", "rules": [ { "kind": "course", "courseId": "TEST001" } ] }
{ "kind": "manual", "text": "At least grade C and instructor consent" }
```

The optional `text` field retains a nonblank source explanation. `all` and `any` can nest and must never be empty. Course references must exist. Missing or null prerequisite/corequisite rules normalize to `unknown`, never `none`; use an explicit tagged unknown in new source data. An unsupported `{ "kind": "source-rule-kind", "text": "original source rule" }` normalizes to `manual`. Unsupported rules without usable source text are rejected. The accepted normalized envelope, rather than the unnormalized input, is what is hashed and published.

An optional course `canonicalId` declares direct equivalence to an existing canonical course. Alias chains and cycles are invalid. No equivalence is inferred from titles. Canonical definitions own bundle/unit/rule interpretation. Alias IDs and codes resolve to that canonical identity, while raw selected/history identities are retained. New equivalences can group existing choices: agreeing evidence counts once; conflicting component/unit alternatives and disagreeing status/earned-unit history remain unresolved until the student edits them.
