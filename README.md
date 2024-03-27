# demo-pulumi-policy-snyk

Demo/proof of concept of using Snyk with Pulumi Policy as Code:

- The code in the `infra` directory creates a `docker.Image` resource based on the `debian` image, which has known vulnerabilities. The `docker.Image` is set to build (but not push to a remote repo) on `pulumi preview`.
- The code in the `policy` directory contains a Pulumi Policy Pack which calls the Snyk CLI. If the Snyk CLI fails (e.g. because it detects vulnerabilities), the resource will be considered in violation and the `pulumi preview` (or `pulumi up`) operation will fail.

To run the demo:

```bash
cd infra
pulumi preview --policy-pack ../policy
```

## Enabling Dockerfile Scanning

Snyk can scan Dockerfiles for vulnerabilities. Because there's no direct relationship between the location on disk of a Pulumi program and any policy packs that might be running, we need to configure the Snyk policy to know where the Pulumi program is running.

```bash
./add-dockerfile-scanning.sh
```

Because Dockerfile scanning requires the absolute path to the Pulumi program to be supplied via policy configuration, server-side policy enforcement requires that the Pulumi program be run from a known location on disk (i.e. whatever the path on disk is that the policy is configured with in the Pulumi Cloud console) if Dockerfile scanning is desired. If <https://github.com/pulumi/pulumi-policy/issues/333> is implemented, this restriction can be lifted and the configuration value can be removed.

## Snyk Unable to find Docker Socket

If the Snyk CLI gives you an error similar to the following:

```text
connect ENOENT /var/run/docker.sock
```

You may need to set the `DOCKER_HOST` environment variable. At the time of writing, the Snyk CLI appears to assume that the Docker socket is running in the older (privileged) location. The newer version of Docker use a socket placed in the current user's home directory, e.g.:

```bash
export DOCKER_HOST=unix:///Users/jkodroff/.docker/run/docker.sock
```
