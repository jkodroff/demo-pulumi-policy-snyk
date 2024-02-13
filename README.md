# demo-pulumi-policy-snyk

Demo/proof of concept of using Snyk with Pulumi Policy as Code:

- The code in the `infra` directory creates a `docker.Image` resource based on the `debian` image, which has known vulnerabilities. The `docker.Image` is set to build (but not push to a remote repo) on `pulumi preview`.
- The code in the `policy` directory contains a Pulumi Policy Pack which calls the Snyk CLI. If the Snyk CLI fails (e.g. because it detects vulnerabilities), the resource will be considered in violation and the `pulumi preview` (or `pulumi up`) operation will fail.

To run the demo:

```bash
cd infra
pulumi preview --policy-pack ../policy
```

Possible future improvements:

- Need to figure out how to pass through the Dockerfile for additional suggestions on remediation. This may require enhancements in the Pulumi policy engine.
- Add a configuration schema to add more options that can in turn be passed to the Snyk CLI.
