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

import { parseCSV } from '@google-github-actions/actions-utils';

/**
 * Parses a string of the format `outout:secret`. For example:
 *
 *     output:project/secret/version
 *
 * @param s String reference to parse
 * @param location String location/region of secret
 * @returns Reference
 */
export class Reference {
  // output is the name of the output variable.
  readonly output: string;

  // project, name, and version are the secret ref
  readonly project: string;
  readonly name: string;
  readonly version: string;
  readonly location?: string;

  constructor(s: string) {
    const sParts = s.split(':');
    if (sParts.length < 2) {
      throw new TypeError(`Invalid reference "${s}" - missing destination`);
    }

    this.output = sParts[0].trim();

    const ref = sParts.slice(1).join(':');
    const refParts = ref.split('/');
    switch (refParts.length) {
      // projects/<p>/locations/<l>/secrets/<s>/versions/<v>
      case 8: {
        this.project = refParts[1];
        this.location = refParts[3];
        this.name = refParts[5];
        this.version = refParts[7];
        break;
      }
      // projects/<p>/secrets/<s>/versions/<v> OR projects/<p>/locations/<l>/secerts/<s>
      case 6: {
        if (refParts[2] === 'secrets') {
          this.project = refParts[1];
          this.name = refParts[3];
          this.version = refParts[5];
          break;
        } else if (refParts[2] === 'locations') {
          this.project = refParts[1];
          this.location = refParts[3];
          this.name = refParts[5];
          this.version = 'latest';
          break;
        } else {
          throw new TypeError(`Invalid reference "${s}" - unknown format`);
        }
      }
      // projects/<p>/secrets/<s> OR <p>/<l>/<s>/<v>
      case 4: {
        if (refParts[0] === 'projects') {
          this.project = refParts[1];
          this.name = refParts[3];
          this.version = 'latest';
          break;
        } else {
          this.project = refParts[0];
          this.location = refParts[1];
          this.name = refParts[2];
          this.version = refParts[3];
          break;
        }
      }
      // <p>/<s>/<v>
      case 3: {
        this.project = refParts[0];
        this.name = refParts[1];
        this.version = refParts[2];
        break;
      }
      // <p>/<s>
      case 2: {
        this.project = refParts[0];
        this.name = refParts[1];
        this.version = 'latest';
        break;
      }
      default: {
        throw new TypeError(`Invalid reference "${s}" - unknown format`);
      }
    }
  }

  /**
   * Returns the full GCP self link. For regional secrets, this will include the
   * location path.
   *
   * @returns String self link.
   */
  public selfLink(): string {
    if (this.location) {
      return `projects/${this.project}/locations/${this.location}/secrets/${this.name}/versions/${this.version}`;
    }
    return `projects/${this.project}/secrets/${this.name}/versions/${this.version}`;
  }
}

/**
 * Accepts the actions list of secrets and parses them as References.
 *
 * @param input List of secrets, from the actions input, can be
 * comma-delimited or newline, whitespace around secret entires is removed.
 * @param location String value of secret location/region
 * @returns Array of References for each secret, in the same order they were
 * given.
 */
export function parseSecretsRefs(input: string): Reference[] {
  const secrets: Reference[] = [];
  for (const line of input.split(/\r|\n/)) {
    const pieces = parseCSV(line);
    for (const piece of pieces) {
      secrets.push(new Reference(piece));
    }
  }
  return secrets;
}
