/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { test } from 'node:test';
import assert from 'node:assert';

import { parseMinMaskLength } from '../src/main';

test('#parseMinMaskLength', { concurrency: true }, async (suite) => {
  const cases: { name: string; input: string; expected?: number; error?: string }[] = [
    { name: 'empty string returns the default', input: '', expected: 4 },
    { name: 'whitespace returns the default', input: '   ', expected: 4 },
    { name: 'parses an integer', input: '8', expected: 8 },
    { name: 'parses zero', input: '0', expected: 0 },
    { name: 'trims surrounding whitespace', input: ' 12 ', expected: 12 },
    { name: 'errors on a non-numeric value', input: 'abc', error: 'invalid min_mask_length' },
    { name: 'errors on a trailing garbage value', input: '4abc', error: 'invalid min_mask_length' },
    { name: 'errors on a fractional value', input: '4.5', error: 'invalid min_mask_length' },
    { name: 'errors on a negative value', input: '-1', error: 'invalid min_mask_length' },
  ];

  for await (const tc of cases) {
    if (tc.error) {
      await suite.test(tc.name, async () => {
        assert.throws(() => parseMinMaskLength(tc.input), { message: new RegExp(tc.error!) });
      });
    } else {
      await suite.test(tc.name, async () => {
        assert.deepStrictEqual(parseMinMaskLength(tc.input), tc.expected);
      });
    }
  }
});
