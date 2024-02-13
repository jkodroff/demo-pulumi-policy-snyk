import * as docker from "@pulumi/docker";

new docker.Image("my-image", {
  imageName: "docker.io/joshkodroff/pulumi-policy-test",
  buildOnPreview: false,
  build: {
    dockerfile: "./Dockerfile",
    platform: "linux/amd64"
  }
});
