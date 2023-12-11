# get-secretmanager-secrets

This action fetches secrets from [Secret Manager][sm] and makes them available
to later build steps via outputs. This is useful when you want Secret Manager to
be the source of truth for secrets in your organization, but you need access to
those secrets in build steps.

Secrets that are successfully fetched are set as output variables and can be
used in subsequent actions. After a secret is accessed, its value is added to
the mask of the build to reduce the chance of it being printed or logged by
later steps.

**This is not an officially supported Google product, and it is not covered by a
Google Cloud support contract. To report bugs or request features in a Google
Cloud product, please contact [Google Cloud
support](https://cloud.google.com/support).**


## Prerequisites

-   This action requires Google Cloud credentials that are authorized to access
    the secrets being requested. See [Authorization](#authorization) for more
    information.

-   This action runs using Node 20. If you are using self-hosted GitHub Actions
    runners, you must use a [runner
    version](https://github.com/actions/virtual-environments) that supports this
    version or newer.

## Usage

```yaml
jobs:
  job_id:
    permissions:
      contents: 'read'
      id-token: 'write'

    steps:
    - id: 'auth'
      uses: 'google-github-actions/auth@v2'
      with:
        workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
        service_account: 'my-service-account@my-project.iam.gserviceaccount.com'

    - id: 'secrets'
      uses: 'google-github-actions/get-secretmanager-secrets@v2'
      with:
        secrets: |-
          token:my-project/docker-registry-token

    # Example of using the output
    - id: 'publish'
      uses: 'foo/bar@v1'
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

- `min_mask_length`: (Optional, default: "4") Minimum line length for a secret
  to be masked. Extremely short secrets (e.g. "{" or "a") can make GitHub
  Actions log output unreadable. This is especially important for multi-line
  secrets, since each line of the secret is masked independently.


## Outputs

Each secret is prefixed with an output name. The secret's resolved access value
will be available at that output in future build steps.

For example:

```yaml
jobs:
  job_id:
    steps:
    - id: 'secrets'
      uses: 'google-github-actions/get-secretmanager-secrets@v2'
      with:
        secrets: |-
          token:my-project/docker-registry-token
```

will be available in future steps as the output "token":

```yaml
# other step
- id: 'publish'
  uses: 'foo/bar@v1'
  env:
    TOKEN: '${{ steps.secrets.outputs.token }}'
```


## Authorization

There are a few ways to authenticate this action. The caller must have
permissions to access the secrets being requested.

### Via google-github-actions/auth

Use [google-github-actions/auth](https://github.com/google-github-actions/auth)
to authenticate the action. You can use [Workload Identity Federation][wif] or
traditional [Service Account Key JSON][sa] authentication.

```yaml
jobs:
  job_id:
    permissions:
      contents: 'read'
      id-token: 'write'

    steps:
    - uses: 'actions/checkout@v4'

    - id: 'auth'
      uses: 'google-github-actions/auth@v2'
      with:
        workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
        service_account: 'my-service-account@my-project.iam.gserviceaccount.com'

    - id: 'secrets'
      uses: 'google-github-actions/get-secretmanager-secrets@v2'
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
      uses: 'google-github-actions/get-secretmanager-secrets@v2'
```

The action will automatically detect and use the Application Default
Credentials.


[sm]: https://cloud.google.com/secret-manager
[wif]: https://cloud.google.com/iam/docs/workload-identity-federation
[sa]: https://cloud.google.com/iam/docs/creating-managing-service-accounts
[gh-runners]: https://help.github.com/en/actions/hosting-your-own-runners/about-self-hosted-runners
[gh-secret]: https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets
[setup-gcloud]: https://github.com/google-github-actions/setup-gcloud
