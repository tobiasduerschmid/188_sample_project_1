/** Stable serialization binds receipts and immutable catalogs to their complete contents. */
export function stableStringify(value: unknown): string {
  type Task = { value: unknown } | { text: string } | { leave: object };
  const tasks: Task[] = [{ value }];
  const active = new Set<object>();
  const output: string[] = [];
  while (tasks.length) {
    const task = tasks.pop()!;
    if ('text' in task) {
      output.push(task.text);
      continue;
    }
    if ('leave' in task) {
      active.delete(task.leave);
      continue;
    }
    const next = task.value;
    if (next === null || typeof next !== 'object') {
      output.push(JSON.stringify(next) ?? 'null');
      continue;
    }
    if (active.has(next)) throw new TypeError('Cannot fingerprint a cyclic value.');
    active.add(next);
    tasks.push({ leave: next });
    if (Array.isArray(next)) {
      tasks.push({ text: ']' });
      for (let i = next.length - 1; i >= 0; i--) {
        tasks.push({ value: next[i] });
        if (i > 0) tasks.push({ text: ',' });
      }
      tasks.push({ text: '[' });
    } else {
      const entries = Object.entries(next as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
      tasks.push({ text: '}' });
      for (let i = entries.length - 1; i >= 0; i--) {
        const [key, child] = entries[i];
        tasks.push({ value: child }, { text: `${JSON.stringify(key)}:` });
        if (i > 0) tasks.push({ text: ',' });
      }
      tasks.push({ text: '{' });
    }
  }
  return output.join('');
}
export async function fingerprint(value: unknown): Promise<string> {
  const data = new TextEncoder().encode(stableStringify(value));
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export const newId = (): string => crypto.randomUUID();
export const sameRef = (
  a: { quarterId: string; version: string; digest: string },
  b: { quarterId: string; version: string; digest: string },
): boolean => a.quarterId === b.quarterId && a.version === b.version && a.digest === b.digest;

/** Clone the JSON-shaped values used by the domain without recursive call-stack limits. */
export function clonePlain<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  const root = (Array.isArray(value) ? [] : {}) as Record<string, unknown>;
  const seen = new Map<object, object>([[value, root]]);
  const pending: { source: object; target: Record<string, unknown> }[] = [
    { source: value, target: root },
  ];
  while (pending.length) {
    const { source, target } = pending.pop()!;
    for (const [key, child] of Object.entries(source)) {
      if (child === null || typeof child !== 'object')
        Object.defineProperty(target, key, {
          value: child,
          enumerable: true,
          configurable: true,
          writable: true,
        });
      else {
        let copy = seen.get(child);
        if (!copy) {
          copy = Array.isArray(child) ? [] : {};
          seen.set(child, copy);
          pending.push({ source: child, target: copy as Record<string, unknown> });
        }
        Object.defineProperty(target, key, {
          value: copy,
          enumerable: true,
          configurable: true,
          writable: true,
        });
      }
    }
  }
  return root as T;
}
export function deepFreeze<T>(value: T): T {
  const pending: unknown[] = [value];
  const seen = new Set<object>();
  while (pending.length) {
    const next = pending.pop();
    if (next === null || typeof next !== 'object' || seen.has(next)) continue;
    seen.add(next);
    for (const child of Object.values(next)) pending.push(child);
    Object.freeze(next);
  }
  return value;
}
