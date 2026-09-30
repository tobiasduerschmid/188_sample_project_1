import { expect, it } from 'vitest';
import { stableStringify } from '../src/domain/identity';

it('binds content with locale-independent lexical keys and JSON-compatible optional fields', () => {
  expect(stableStringify({ z: 3, ä: 1, a: 2, omitted: undefined, list: [2, 1] })).toBe(
    '{"a":2,"list":[2,1],"z":3,"ä":1}',
  );
});
it('serializes deeply nested supported academic expressions without a call-stack limit', () => {
  let rule: unknown = { kind: 'none' };
  for (let i = 0; i < 5000; i++) rule = { kind: 'all', rules: [rule] };
  const result = stableStringify(rule);
  expect(result.startsWith('{"kind":"all","rules":[')).toBe(true);
  expect(result.endsWith(']}'.repeat(5000))).toBe(true);
  expect(result.match(/"kind":"none"/g)).toHaveLength(1);
});
