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

import 'mocha';
import { expect } from 'chai';

import { Reference, parseSecretsRefs } from '../src/reference';

describe('Reference', () => {
  it('parses a full ref', () => {
    const ref = new Reference('out:projects/fruits/secrets/apple/versions/123');
    const link = ref.selfLink();
    expect(link).equal('projects/fruits/secrets/apple/versions/123');
  });

  it('parses a full ref sans version', () => {
    const ref = new Reference('out:projects/fruits/secrets/apple');
    const link = ref.selfLink();
    expect(link).equal('projects/fruits/secrets/apple/versions/latest');
  });

  it('parses a short ref', () => {
    const ref = new Reference('out:fruits/apple/123');
    const link = ref.selfLink();
    expect(link).equal('projects/fruits/secrets/apple/versions/123');
  });

  it('parses a short ref sans version', () => {
    const ref = new Reference('out:fruits/apple');
    const link = ref.selfLink();
    expect(link).equal('projects/fruits/secrets/apple/versions/latest');
  });

  it('errors on invalid format', () => {
    const fn = (): Reference => {
      return new Reference('out:projects/fruits/secrets/apple/versions/123/subversions/5');
    };
    expect(fn).to.throw(TypeError);
  });

  it('errors on missing output', () => {
    const fn = (): Reference => {
      return new Reference('fruits/apple/123');
    };
    expect(fn).to.throw(TypeError);
  });
});

describe('#parseSecretsRefs', () => {
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

  cases.forEach((tc) => {
    it(tc.name, () => {
      if (tc.expected) {
        expect(parseSecretsRefs(tc.input)).to.eql(tc.expected);
      } else if (tc.error) {
        expect(() => {
          parseSecretsRefs(tc.input);
        }).to.throw(tc.error);
      }
    });
  });
});
