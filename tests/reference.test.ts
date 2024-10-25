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
  const cases = [
    {
      input: 'out:projects/my-project/secrets/my-secret/versions/123',
      expected: 'projects/my-project/secrets/my-secret/versions/123',
    },
    {
      input: 'out:projects/my-project/secrets/my-secret',
      expected: 'projects/my-project/secrets/my-secret/versions/latest',
    },
    {
      input: 'out:projects/my-project/locations/my-location/secrets/my-secret',
      expected: 'projects/my-project/locations/my-location/secrets/my-secret/versions/latest',
    },
    {
      input: 'out:my-project/my-secret/123',
      expected: 'projects/my-project/secrets/my-secret/versions/123',
    },
    {
      input: 'out:my-project/my-secret',
      expected: 'projects/my-project/secrets/my-secret/versions/latest',
    },
    {
      input: 'out: my-project/my-secret',
      expected: 'projects/my-project/secrets/my-secret/versions/latest',
    },
    {
      input: 'out : projects/ my-project/   secrets/	my-secret',
      expected: 'projects/my-project/secrets/my-secret/versions/latest',
    },
    {
      input: '',
      error: 'TypeError',
    },
    {
      input: 'projects/my-project/secrets/my-secret/versions/123',
      error: 'TypeError',
    },
    {
      input: 'out:projects/my-project/pandas/my-location/secrets/my-secret',
      error: 'TypeErorr',
    },
  ];

  for await (const tc of cases) {
    if (tc.expected) {
      await suite.test(`parses "${tc.input}"`, async () => {
        const actual = new Reference(tc.input);
        assert.deepStrictEqual(actual.selfLink(), tc.expected);
      });
    } else if (tc.error) {
      await suite.test(`errors on "${tc.input}"`, async () => {
        await assert.rejects(async () => {
          new Reference(tc.input);
        }, tc.error);
      });
    }
  }
});

test('#parseSecretsRefs', { concurrency: true }, async (suite) => {
  const cases = [
    {
      name: 'empty string',
      input: '',
      location: '',
      expected: [],
    },
    {
      name: 'multi value commas',
      input: 'output1:project/secret, output2:project/secret',
      location: '',
      expected: [new Reference('output1:project/secret'), new Reference('output2:project/secret')],
    },
    {
      name: 'multi value newlines',
      input: 'output1:project/secret\noutput2:project/secret',
      location: '',
      expected: [new Reference('output1:project/secret'), new Reference('output2:project/secret')],
    },
    {
      name: 'multi value carriage',
      input: 'output1:project/secret\routput2:project/secret',
      location: '',
      expected: [new Reference('output1:project/secret'), new Reference('output2:project/secret')],
    },
    {
      name: 'multi value carriage newline',
      input: 'output1:project/secret\r\noutput2:project/secret',
      location: '',
      expected: [new Reference('output1:project/secret'), new Reference('output2:project/secret')],
    },
    {
      name: 'multi value empty lines',
      input: 'output1:project/secret\n\n\noutput2:project/secret',
      location: '',
      expected: [new Reference('output1:project/secret'), new Reference('output2:project/secret')],
    },
    {
      name: 'multi value commas',
      input: 'output1:project/secret\noutput2:project/secret,output3:project/secret',
      location: '',
      expected: [
        new Reference('output1:project/secret'),
        new Reference('output2:project/secret'),
        new Reference('output3:project/secret'),
      ],
    },
    {
      name: 'invalid input',
      input: 'not/valid',
      location: '',
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
