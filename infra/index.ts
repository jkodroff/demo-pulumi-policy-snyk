import * as docker from "@pulumi/docker";
const resolve = require('path').resolve;

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

new docker.Image("good-image", {
  imageName: "docker.io/joshkodroff/pulumi-policy-test",
  buildOnPreview: true,
  build: {
    dockerfile: "GoodDockerfile",
    platform: "linux/arm64",
  },
}, {
  transformations: [addDockerfileAbsPath]
});


// new docker.Image("bad-image", {
//   imageName: "docker.io/joshkodroff/pulumi-policy-test",
//   buildOnPreview: true,
//   build: {
//     dockerfile: "BadDockerfile",
//     platform: "linux/arm64",
//   },
// }, {
//   transformations: [addDockerfileAbsPath]
// });

