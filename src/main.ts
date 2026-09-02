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

import { exportVariable, getInput, setFailed, setOutput, setSecret } from '@actions/core';
import { errorMessage, parseBoolean } from '@google-github-actions/actions-utils';

import { Client } from './client';
import { parseSecretsRefs } from './reference';

/**
 * DEFAULT_MIN_MASK_LENGTH is the fallback minimum line length for masking. It
 * mirrors the default declared for the `min_mask_length` input in action.yml,
 * which the Actions runner only applies when the input key is absent.
 */
const DEFAULT_MIN_MASK_LENGTH = 4;

/**
 * parseMinMaskLength parses the given value as the minimum length for a secret
 * line to be masked. An empty value returns the default. A value that is not a
 * non-negative integer throws, because a value that fails to parse would
 * otherwise disable masking for every line without any indication.
 *
 * @param input Value to parse.
 * @param defaultValue Value to return when the input is empty.
 * @returns Minimum line length for masking.
 */
export function parseMinMaskLength(
  input: string,
  defaultValue: number = DEFAULT_MIN_MASK_LENGTH,
): number {
  const str = (input || '').trim();
  if (str === '') {
    return defaultValue;
  }

  const parsed = Number(str);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`invalid min_mask_length value "${str}", expected a non-negative integer`);
  }

  return parsed;
}

/**
 * Executes the main action. It includes the main business logic and is the
 * primary entry point. It is documented inline.
 */
async function run(): Promise<void> {
  try {
    const universe = getInput('universe');
    const secretsInput = getInput('secrets', { required: true });
    const minMaskLength = parseMinMaskLength(getInput('min_mask_length'));
    const exportEnvironment = parseBoolean(getInput('export_to_environment'));
    const encoding = (getInput('encoding') || 'utf8') as BufferEncoding;

    // Create an API client.
    const client = new Client({
      universe: universe,
    });

    // Parse all the provided secrets into references.
    const secretsRefs = parseSecretsRefs(secretsInput);

    // Access and export each secret.
    for (const ref of secretsRefs) {
      const value = await client.accessSecret(ref, encoding);

      // Split multiline secrets by line break and mask each line.
      // Read more here: https://github.com/actions/runner/issues/161
      value.split(/\r\n|\r|\n/g).forEach((line) => {
        // Only mask sufficiently long values. There's a risk in masking
        // extremely short values in that it will make output completely
        // unreadable.
        if (line && line.length >= minMaskLength) {
          setSecret(line);
        }
      });

      setOutput(ref.output, value);

      if (exportEnvironment) {
        exportVariable(ref.output, value);
      }
    }
  } catch (err) {
    const msg = errorMessage(err);
    setFailed(`google-github-actions/get-secretmanager-secrets failed with: ${msg}`);
  }
}

if (require.main === module) {
  run();
}
