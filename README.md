<!--
Copyright 2019 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

# get-secretmanager-secrets

This action fetches secrets from [Secret Manager][sm] and makes them available
to later build steps via outputs. This is useful when you want Secret Manager to
be the source of truth for secrets in your organization, but you need access to
those secrets in build steps.

Secrets that are successfully fetched are set as output variables and can be
used in subsequent actions. After a secret is accessed, its value is added to
the mask of the build to reduce the chance of it being printed or logged by
later steps.


## Prerequisites

-   This action requires Google Cloud credentials that are authorized to access
    the secrets being requested. See the Authorization section below for more
    information.

-   This action runs using Node 16. If you are using self-hosted GitHub Actions
    runners, you must use runner version [2.285.0](https://github.com/actions/virtual-environments)
    or newer.

## Usage

```yaml
jobs:
  job_id:
    permissions:
      contents: 'read'
      id-token: 'write'

    steps:
    - id: 'auth'
      uses: 'google-github-actions/auth@v0'
      with:
        workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
        service_account: 'my-service-account@my-project.iam.gserviceaccount.com'

    - id: 'secrets'
      uses: 'google-github-actions/get-secretmanager-secrets@v0'
      with:
        secrets: |-
          token:my-project/docker-registry-token

    # Example of using the output
    - id: 'publish'
      uses: 'foo/bar@main'
      env:
        TOKEN: '${{ steps.secrets.outputs.token }}'
```


## Inputs

-   `secrets`: (Required) The list of secrets to access and inject into the
    environment. Due to limitations with GitHub Actions inputs, this is
    specified as a string.

    You can specify multiple secrets by putting each secret on its own line:

    ```yaml
    secrets: |-
      output1:my-project/my-secret1
      output2:my-project/my-secret2
    ```

    Secrets can be referenced using the following formats:

    ```text
    # Long form
    projects/<project-id>/secrets/<secret-id>/versions/<version-id>

    # Long form - "latest" version
    projects/<project-id>/secrets/<secret-id>

    # Short form
    <project-id>/<secret-id>/<version-id>

    # Short form - "latest" version
    <project-id>/<secret-id>
    ```

- `credentials`: (**Deprecated**) This input is deprecated. See [auth section](https://github.com/google-github-actions/get-secretmanager-secrets#via-google-github-actionsauth) for more details.
  [Google Service Account JSON][sa] credentials,
  typically sourced from a [GitHub Secret][gh-secret].

## Outputs

Each secret is prefixed with an output name. The secret's resolved access value
will be available at that output in future build steps.

For example:

```yaml
jobs:
  job_id:
    steps:
    - id: 'secrets'
      uses: 'google-github-actions/get-secretmanager-secrets@v0'
      with:
        secrets: |-
          token:my-project/docker-registry-token
```

will be available in future steps as the output "token":

```yaml
# other step
- id: 'publish'
  uses: 'foo/bar@main'
  env:
    TOKEN: '${{ steps.secrets.outputs.token }}'
```


## Authorization

There are a few ways to authenticate this action. The caller must have
permissions to access the secrets being requested.

### Via google-github-actions/auth

Use [google-github-actions/auth](https://github.com/google-github-actions/auth) to authenticate the action. You can use [Workload Identity Federation][wif] or traditional [Service Account Key JSON][sa] authentication.
by specifying the `credentials` input. This Action supports both the recommended [Workload Identity Federation][wif] based authentication and the traditional [Service Account Key JSON][sa] based auth.

See [usage](https://github.com/google-github-actions/auth#usage) for more details.

#### Authenticating via Workload Identity Federation

```yaml
jobs:
  job_id:
    permissions:
      contents: 'read'
      id-token: 'write'

    steps:
    - uses: 'actions/checkout@v3'

    - id: 'auth'
      uses: 'google-github-actions/auth@v0'
      with:
        workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
        service_account: 'my-service-account@my-project.iam.gserviceaccount.com'

    - id: 'secrets'
      uses: 'google-github-actions/get-secretmanager-secrets@v0'
      with:
        secrets: |-
          token:my-project/docker-registry-token
```

#### Authenticating via Service Account Key JSON

```yaml
jobs:
  job_id:
    steps:
    - uses: 'actions/checkout@v3'

    - id: 'auth'
      uses: 'google-github-actions/auth@v0'
      with:
        credentials_json: '${{ secrets.gcp_credentials }}'

    - id: 'secrets'
      uses: 'google-github-actions/get-secretmanager-secrets@v0'
      with:
        secrets: |-
          token:my-project/docker-registry-token
```

### Via Application Default Credentials

If you are hosting your own runners, **and** those runners are on Google Cloud,
you can leverage the Application Default Credentials of the instance. This will
authenticate requests as the service account attached to the instance. **This
only works using a custom runner hosted on GCP.**

```yaml
jobs:
  job_id:
    steps:
    - id: 'secrets'
      uses: 'google-github-actions/get-secretmanager-secrets@v0'
```

The action will automatically detect and use the Application Default
Credentials.


[sm]: https://cloud.google.com/secret-manager
[wif]: https://cloud.google.com/iam/docs/workload-identity-federation
[sa]: https://cloud.google.com/iam/docs/creating-managing-service-accounts
[gh-runners]: https://help.github.com/en/actions/hosting-your-own-runners/about-self-hosted-runners
[gh-secret]: https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets
[setup-gcloud]: https://github.com/google-github-actions/setup-gcloud
