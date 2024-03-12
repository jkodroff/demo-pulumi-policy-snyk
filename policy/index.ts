import * as docker from "@pulumi/docker";
import { PolicyPack, validateResourceOfType } from "@pulumi/policy";
const awaitSpawn = require("await-spawn");
const fs = require("fs");


new PolicyPack("demo-snyk", {
    policies: [{
        configSchema: {
            properties: {
                // TODO: log level (console and pass to Snyk)
                "dockerfileScanning": {
                    default: true,
                    type: "boolean",
                },
                "excludeBaseImageVulns": {
                    default: false,
                    type: "boolean"
                },
                "failOn": {
                    default: "all",
                    enum: ["all", "upgradable"]
                },
                "severityThreshold": {
                    default: "critical",
                    enum: ["low", "medium", "high", "critical"]
                },
            },
        },
        enforcementLevel: "mandatory",
        name: "snyk-container-scan",
        description: "Scans Docker Images with Snyk",
        validateResource: validateResourceOfType(docker.Image, async (image, args, reportViolation) => {
            const config = args.getConfig<{
                dockerfileScanning: boolean,
                excludeBaseImageVulns: boolean,
                failOn: string,
                severityThreshold: string,
            }>();

            const child = await awaitSpawn('docker', ['image', 'ls']);
            console.log(`child = ${child}`);
            // console.log(child.stdout.toString());

            // console.log(`id = ${args.props["id"]}`);
            // console.log(`repoDigest = ${args.props["repoDigest"]}`);
            // // console.log(`config = ${JSON.stringify(config, null, 2)}`);

            // const dockerFileAbsPath = args.props?.snyk?.dockerfileAbsPath ?? "";

            // if (config.dockerfileScanning && !fs.existsSync(dockerFileAbsPath)) {
            //     const msg = `dockerfileScanning is set to 'true', but the Dockerfile at path '${dockerFileAbsPath}' could not be found. Either reconfigure the policy to turn off Dockerfile scanning, or set the value of docker.Image.snyk.dockerfileAbsPath resource to the absolute path of the Dockerfile in a resource transform.`;
            //     reportViolation(msg);
            // }

            // const commandArgs = [
            //     "container",
            //     "test",
            //     image.imageName,
            // ];

            // const platform = args.props["build"]?.["platform"] as string ?? "";
            // if (platform) {
            //     commandArgs.push(`--platform=${platform}`);
            // }

            // if (config.dockerfileScanning) {
            //     commandArgs.push(`--file=${dockerFileAbsPath}`);
            // }

            // if (config.excludeBaseImageVulns) {
            //     commandArgs.push("--exclude-base-image-vulns");
            // }

            // commandArgs.push(`--severity-threshold=${config.severityThreshold}`);

            // const options = {
            //     env: {
            //         // TODO: Figure out how to get Snyk to use the correct default socket.
            //         DOCKER_HOST: "unix:///Users/jkodroff/.docker/run/docker.sock",
            //         ...process.env
            //     }
            // };

            // try {
            //     await awaitSpawn("snyk", commandArgs, options);
            // } catch (e) {
            //     let errorMessage = `Snyk validation failed.`;

            //     if (e.stdout && e.stdout.toString()) {
            //         errorMessage += "\n\nstdout:\n";
            //         errorMessage += e.stdout.toString();
            //     }

            //     if (e.stderr && e.stderr.toString()) {
            //         errorMessage += "\n\nstderr:\n";
            //         errorMessage += e.stderr.toString();
            //     }

            //     reportViolation(errorMessage);
            // }
        }),
    }],
});
