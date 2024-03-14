import * as docker from "@pulumi/docker";
const resolve = require('path').resolve;

// This does not work in stack policies, but is probably the preferred approach
// if https://github.com/pulumi/pulumi-policy/issues/340 is resolved because we
// are adding an arbitrary property that easily be ignored if it were to cause a
// diff:
const addDockerfileAbsPath = (args: any) => {
  // TODO: Could we move this function to an export in the Policy Pack if we
  // were to publish it as an npm package like compliance ready policies?
  // That way, we could do:
  // transformations: [snykPolicy.addDockerfilePath]

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

new docker.Image("good-image", {
  imageName: "docker.io/joshkodroff/snyk-policy-good-image",
  buildOnPreview: true,
  build: {
    dockerfile: "GoodDockerfile",
    platform: "linux/amd64",
  },
  skipPush: true,
  // }, {
  //   transformations: [resolveBuildContext]
});

new docker.Image("bad-image", {
  imageName: "docker.io/joshkodroff/snyk-policy-bad-image",
  buildOnPreview: true,
  build: {
    dockerfile: "BadDockerfile",
    platform: "linux/amd64",
  },
  skipPush: true,
  // }, {
  //   transformations: [addDockerfileAbsPath]
});

