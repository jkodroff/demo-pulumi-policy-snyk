import * as docker from "@pulumi/docker";
const resolve = require('path').resolve;

// This does not work in stack policies, but is probably the preferred approach
// if https://github.com/pulumi/pulumi-policy/issues/340 is resolved because we
// are adding an arbitrary property that easily be ignored if it were to cause a
// diff:
const addDockerfileAbsPath = (args: any) => {
  if (args.props["build"]?.dockerfile === undefined) {
    // There's no path to a Dockerfile, so there's nothing to verify
    return args;
  }

  const context = args.props["build"]?.context as string ?? ".";
  const dockerfile = args.props["build"].dockerfile as string;
  const localPath = `${context}/${dockerfile}`;
  const absPath = resolve(localPath);

  args.props["snyk"] = {};
  args.props["snyk"]["dockerfileAbsPath"] = absPath;

  return args;
};

// Replaces the implied relative context with an absolute path so that the Snyk
// policy pack can find the Dockerfile for scanning.
//
// This approach is limited for proof-of-concept only as Pulumi will see a diff
// whenever this program is run from a different absolute path (like CI or on
// another user's machine).
const resolveBuildContext = (args: any) => {
  if (args.props?.build?.dockerfile === undefined) {
    // There's no path to a Dockerfile, so there's nothing to verify
    return args;
  }

  const context = args.props.build?.context as string ?? ".";
  args.props.build.context = resolve(context);

  return args;
};

new docker.Image("alpine", {
  imageName: "docker.io/joshkodroff/snyk-policy-alpine",
  buildOnPreview: true,
  build: {
    dockerfile: "AlpineDockerfile",
    platform: "linux/amd64",
  },
  skipPush: true,
});

new docker.Image("debian", {
  imageName: "docker.io/joshkodroff/snyk-policy-debian",
  buildOnPreview: true,
  build: {
    dockerfile: "DebianDockerfile",
    platform: "linux/amd64",
  },
  skipPush: true,
});

