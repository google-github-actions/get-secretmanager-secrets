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

import {
  getInput,
  getBooleanInput,
  warning as logWarning,
  setFailed,
  setOutput,
  setSecret,
} from '@actions/core';
import { Credential, parseCredential, errorMessage } from '@google-github-actions/actions-utils';

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

    // Flag for control adding mask for secrets
    const enableMaskInput = getBooleanInput('enable-mask', { required: true });

    // Get credentials, if any.
    const credentials = getInput('credentials');

    // Add warning if using credentials
    let credentialsJSON: Credential | undefined;
    if (credentials) {
      logWarning(
        'The "credentials" input is deprecated. ' +
          'Please switch to using google-github-actions/auth which supports both Workload Identity Federation and JSON Key authentication. ' +
          'For more details, see https://github.com/google-github-actions/get-secretmanager-secrets#authorization',
      );
      credentialsJSON = parseCredential(credentials);
    }

    // Create an API client.
    const client = new Client({
      credentials: credentialsJSON,
    });

    // Parse all the provided secrets into references.
    const secretsRefs = parseSecretsRefs(secretsInput);

    // Access and export each secret.
    for (const ref of secretsRefs) {
      const value = await client.accessSecret(ref.selfLink());

      if (enableMaskInput) {
        // Split multiline secrets by line break and mask each line.
        // Read more here: https://github.com/actions/runner/issues/161
        value.split(/\r\n|\r|\n/g).forEach((line) => setSecret(line));
      }

      setOutput(ref.output, value);
    }
  } catch (err) {
    const msg = errorMessage(err);
    setFailed(`google-github-actions/get-secretmanager-secrets failed with: ${msg}`);
  }
}

run();
