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

import { getInput, setFailed, setOutput, setSecret } from '@actions/core';
import { errorMessage } from '@google-github-actions/actions-utils';

import { Client } from './client';
import { parseSecretsRefs } from './reference';

/**
 * Executes the main action. It includes the main business logic and is the
 * primary entry point. It is documented inline.
 */
async function run(): Promise<void> {
  try {
    // Fetch the list of secrets provided by the user.
    const secretsInput = getInput('secrets', { required: true });

    // Get the minimum mask length.
    const minMaskLength = parseInt(getInput('min_mask_length'));

    // Create an API client.
    const client = new Client();

    // Parse all the provided secrets into references.
    const secretsRefs = parseSecretsRefs(secretsInput);

    // Access and export each secret.
    for (const ref of secretsRefs) {
      const value = await client.accessSecret(ref.selfLink());

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
    }
  } catch (err) {
    const msg = errorMessage(err);
    setFailed(`google-github-actions/get-secretmanager-secrets failed with: ${msg}`);
  }
}

if (require.main === module) {
  run();
}
