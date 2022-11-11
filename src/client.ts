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

import { GoogleAuth } from 'google-auth-library';
import { errorMessage, fromBase64 } from '@google-github-actions/actions-utils';
import { HttpClient } from '@actions/http-client';

// Do not listen to the linter - this can NOT be rewritten as an ES6 import statement.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: appVersion } = require('../package.json');

// userAgent is the user agent string.
const userAgent = `google-github-actions:get-secretmanager-secrets/${appVersion}`;

/**
 * Available options to create the client.
 *
 * @param endpoint GCP endpoint (useful for testing).
 */
type ClientOptions = {
  endpoint?: string;
};

/**
 * AccessSecretVersionResponse is the response from the API for accessing a
 * secret version.
 */
type AccessSecretVersionResponse = {
  payload: {
    // data is base64 encoded data.
    data: string;
  };
};

/**
 * Wraps interactions with the Google Secret Manager API, handling credential
 * lookup and registration.
 *
 * @param opts list of ClientOptions
 * @returns Client
 */
export class Client {
  readonly defaultEndpoint = 'https://secretmanager.googleapis.com/v1';
  readonly defaultScope = 'https://www.googleapis.com/auth/cloud-platform';

  readonly auth: GoogleAuth;
  readonly endpoint: string;
  readonly client: HttpClient;

  constructor(opts?: ClientOptions) {
    this.endpoint = opts?.endpoint || this.defaultEndpoint;
    this.auth = new GoogleAuth({
      scopes: [this.defaultScope],
    });
    this.client = new HttpClient(userAgent);
  }

  /**
   * Retrieves the secret by name.
   *
   * @param ref String of the full secret reference.
   * @returns string secret contents.
   */
  async accessSecret(ref: string): Promise<string> {
    if (!ref) {
      throw new Error(`Secret ref "${ref}" is empty!`);
    }

    try {
      const token = await this.auth.getAccessToken();
      const response = await this.client.get(`${this.endpoint}/${ref}:access`, {
        'Authorization': `Bearer ${token}`,
        'User-Agent': userAgent,
      });

      const body = await response.readBody();
      const statusCode = response.message.statusCode || 500;
      if (statusCode >= 400) {
        throw new Error(`(${statusCode}) ${body}`);
      }

      const parsed: AccessSecretVersionResponse = JSON.parse(body);
      const b64data = parsed.payload.data;
      if (!b64data) {
        throw new Error(`Secret "${ref}" returned no data!`);
      }

      return fromBase64(b64data);
    } catch (err) {
      const msg = errorMessage(err);
      throw new Error(`Failed to access secret "${ref}": ${msg}`);
    }
  }
}
