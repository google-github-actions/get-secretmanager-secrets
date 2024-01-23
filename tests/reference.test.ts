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

import { Reference, parseSecretsRefs } from '../src/reference';

test('Reference', { concurrency: true }, async (suite) => {
  await suite.test('parses a full ref', async () => {
    const ref = new Reference('out:projects/fruits/secrets/apple/versions/123');
    const link = ref.selfLink();
    assert.deepStrictEqual(link, 'projects/fruits/secrets/apple/versions/123');
  });

  await suite.test('parses a full ref sans version', async () => {
    const ref = new Reference('out:projects/fruits/secrets/apple');
    const link = ref.selfLink();
    assert.deepStrictEqual(link, 'projects/fruits/secrets/apple/versions/latest');
  });

  await suite.test('parses a short ref', async () => {
    const ref = new Reference('out:fruits/apple/123');
    const link = ref.selfLink();
    assert.deepStrictEqual(link, 'projects/fruits/secrets/apple/versions/123');
  });

  await suite.test('parses a short ref sans version', async () => {
    const ref = new Reference('out:fruits/apple');
    const link = ref.selfLink();
    assert.deepStrictEqual(link, 'projects/fruits/secrets/apple/versions/latest');
  });

  await suite.test('errors on invalid format', async () => {
    await assert.rejects(async () => {
      return new Reference('out:projects/fruits/secrets/apple/versions/123/subversions/5');
    }, TypeError);
  });

  await suite.test('errors on missing output', async () => {
    await assert.rejects(async () => {
      return new Reference('fruits/apple/123');
    }, TypeError);
  });
});

test('#parseSecretsRefs', { concurrency: true }, async (suite) => {
  const cases = [
    {
      name: 'empty string',
      input: '',
      expected: [],
    },
    {
      name: 'single value',
      input: 'output:project/secret',
      expected: [new Reference('output:project/secret')],
    },
    {
      name: 'multi value commas',
      input: 'output1:project/secret, output2:project/secret',
      expected: [new Reference('output1:project/secret'), new Reference('output2:project/secret')],
    },
    {
      name: 'multi value newlines',
      input: 'output1:project/secret\noutput2:project/secret',
      expected: [new Reference('output1:project/secret'), new Reference('output2:project/secret')],
    },
    {
      name: 'multi value carriage',
      input: 'output1:project/secret\routput2:project/secret',
      expected: [new Reference('output1:project/secret'), new Reference('output2:project/secret')],
    },
    {
      name: 'multi value carriage newline',
      input: 'output1:project/secret\r\noutput2:project/secret',
      expected: [new Reference('output1:project/secret'), new Reference('output2:project/secret')],
    },
    {
      name: 'multi value empty lines',
      input: 'output1:project/secret\n\n\noutput2:project/secret',
      expected: [new Reference('output1:project/secret'), new Reference('output2:project/secret')],
    },
    {
      name: 'multi value commas',
      input: 'output1:project/secret\noutput2:project/secret,output3:project/secret',
      expected: [
        new Reference('output1:project/secret'),
        new Reference('output2:project/secret'),
        new Reference('output3:project/secret'),
      ],
    },
    {
      name: 'invalid input',
      input: 'not/valid',
      error: 'Invalid reference',
    },
  ];

  for await (const tc of cases) {
    await suite.test(tc.name, async () => {
      if (tc.expected) {
        const actual = parseSecretsRefs(tc.input);
        assert.deepStrictEqual(actual, tc.expected);
      } else if (tc.error) {
        await assert.rejects(async () => {
          parseSecretsRefs(tc.input);
        }, tc.error);
      }
    });
  }
});
