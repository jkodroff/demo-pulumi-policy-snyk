# demo-pulumi-policy-snyk

Demo/proof of concept of using Snyk with Pulumi Policy as Code:

- The code in the `infra` directory creates a `docker.Image` resource based on the `debian` image, which has known vulnerabilities. The `docker.Image` is set to build (but not push to a remote repo) on `pulumi preview`.
- The code in the `policy` directory contains a Pulumi Policy Pack which calls the Snyk CLI. If the Snyk CLI fails (e.g. because it detects vulnerabilities), the resource will be considered in violation and the `pulumi preview` (or `pulumi up`) operation will fail.

To run the demo:

```bash
cd infra
pulumi preview --policy-pack ../policy
```

## Snyk Unable to find Docker Socket

If the Snyk CLI gives you an error similar to the following:

```text
connect ENOENT /var/run/docker.sock
```

You may need to set the `DOCKER_HOST` environment variable. Snyk assumed that the Docker socket is running in the older (privileged) location. The newer version of Docker use a socket placed in the current user's home directory, e.g.:

```bash
export DOCKER_HOST=unix:///Users/jkodroff/.docker/run/docker.sock
```
