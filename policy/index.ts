import * as docker from "@pulumi/docker";
import { PolicyPack, validateResourceOfType } from "@pulumi/policy";
const awaitSpawn = require("await-spawn");


new PolicyPack("aws-typescript", {
    policies: [{
        enforcementLevel: "mandatory",
        name: "try-snyk",
        description: "Try to scan a Docker image.",
        validateResource: validateResourceOfType(docker.Image, async (image, args, reportViolation) => {
            const commandArgs = [
                "container",
                "test",
                image.imageName,
                // Not sure why this is necessary yet, but it is on my machine:
                "--platform linux/amd64",
            ];

            const options = {
                env: {
                    // TODO: Figure out how to get Snyk to use the correct default socket.
                    DOCKER_HOST: "unix:///Users/jkodroff/.docker/run/docker.sock",
                    ...process.env
                }
            };

            // This does not actually work because we can't get the absolute
            // path to the file on disk. Snyk seems to not complain even
            // though the file path is not valid.
            // See: https://github.com/pulumi/pulumi-policy/issues/333
            if (image.build?.dockerfile) {
                commandArgs.push(`--file ${image.build.dockerfile}`);
            }

            try {
                await awaitSpawn("snyk", commandArgs, options);
            } catch (e) {
                let errorMessage = `Snyk validation failed.`;

                if (e.stdout && e.stdout.toString()) {
                    errorMessage += "\n\nstdout:\n";
                    errorMessage += e.stdout.toString();
                }

                if (e.stderr && e.stderr.toString()) {
                    errorMessage += "\n\nstderr:\n";
                    errorMessage += e.stderr.toString();
                }

                reportViolation(errorMessage);
            }
        }),
    }],
});
