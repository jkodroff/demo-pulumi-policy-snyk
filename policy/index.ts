import * as docker from "@pulumi/docker";
import { PolicyPack, PolicyResource, ReportViolation, StackValidationArgs, validateResourceOfType } from "@pulumi/policy";
import { pathToFileURL } from "url";
const awaitSpawn = require("await-spawn");
const fs = require("fs");

interface SnykPolicyConfig {
    dockerfileScanning: boolean,
    excludeBaseImageVulns: boolean,
    failOn: string,
    pulumiProgramAbsPath: string,
    severityThreshold: string,
}

const validateStack = async (args: StackValidationArgs, reportViolation: ReportViolation) => {
    const config = args.getConfig<SnykPolicyConfig>();

    if (config.dockerfileScanning && !config.pulumiProgramAbsPath) {
        throw new Error("If `dockerfileScanning` is configured to be `true`, `pulumiProgramAbsPath` must be set to the absolute path of the Pulumi program this policy is evaluating.");
    }

    const dockerImages = args.resources.filter(x => x.type === "docker:index/image:Image");
    for (const image of dockerImages) {
        await validateStackImage(config, image, reportViolation);
    }
};

const validateStackImage = async (config: SnykPolicyConfig, image: PolicyResource, reportViolation: ReportViolation) => {

    const commandArgs = [
        "container",
        "test",
        image.props["imageName"],
    ];

    if (config.dockerfileScanning) {
        const dockerfileAbsPath = `${config.pulumiProgramAbsPath}/${image.props.dockerfile}`;

        if (!fs.existsSync(dockerfileAbsPath)) {
            const msg = `dockerfileScanning is set to 'true', but the Dockerfile at path '${dockerfileAbsPath}' could not be found. Either reconfigure the policy to turn off Dockerfile scanning, or set the value of docker.Image.snyk.dockerfileAbsPath resource to the absolute path of the Dockerfile in a resource transform.`;
            reportViolation(msg);
            return;
        }

        commandArgs.push(`--file=${dockerfileAbsPath}`);
    }

    if (config.excludeBaseImageVulns) {
        commandArgs.push("--exclude-base-image-vulns");
    }

    commandArgs.push(`--severity-threshold=${config.severityThreshold}`);

    try {
        console.log(`command = 'snyk ${commandArgs.join(' ')}'`);
        await awaitSpawn("snyk", commandArgs);
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
};

const validateResource = validateResourceOfType(docker.Image, async (image, args, reportViolation) => {
    const config = args.getConfig<{
        dockerfileScanning: boolean,
        excludeBaseImageVulns: boolean,
        failOn: string,
        severityThreshold: string,
    }>();

    // TODO: Remove this if we can get Dockerfile scanning to work:
    config.dockerfileScanning = false;

    const dockerFileAbsPath = args.props?.snyk?.dockerfileAbsPath ?? "";

    if (config.dockerfileScanning && !fs.existsSync(dockerFileAbsPath)) {
        const msg = `dockerfileScanning is set to 'true', but the Dockerfile at path '${dockerFileAbsPath}' could not be found. Either reconfigure the policy to turn off Dockerfile scanning, or set the value of docker.Image.snyk.dockerfileAbsPath resource to the absolute path of the Dockerfile in a resource transform.`;
        reportViolation(msg);
    }

    const commandArgs = [
        "container",
        "test",
        image.imageName,
    ];

    const platform = args.props["build"]?.["platform"] as string ?? "";
    if (platform) {
        commandArgs.push(`--platform=${platform}`);
    }

    if (config.dockerfileScanning) {
        commandArgs.push(`--file=${dockerFileAbsPath}`);
    }

    if (config.excludeBaseImageVulns) {
        commandArgs.push("--exclude-base-image-vulns");
    }

    commandArgs.push(`--severity-threshold=${config.severityThreshold}`);

    try {
        await awaitSpawn("snyk", commandArgs, process.env);
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
});

const debugStack = async (args: StackValidationArgs, reportViolation: ReportViolation) => {
    console.log("debugStack");

    const dockerImages = args.resources.filter(x => x.type === "docker:index/image:Image");
    for (const image of dockerImages) {
        console.log(`image = ${JSON.stringify(image, null, 2)}`);
    }
};

const debugResource = validateResourceOfType(docker.Image, async (image, args, reportViolation) => {
    console.log("debugResource");
    console.log(`image = ${JSON.stringify(image, null, 2)}`);
    console.log(`args = ${JSON.stringify(args, null, 2)}`);
});

new PolicyPack("demo-snyk", {
    policies: [{
        // Stack validation policy: This is what we are trying to get to work
        // under the current constraints:
        name: "snyk-container-scan",
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
                "pulumiProgramAbsPath": {
                    type: "string"
                },
                "severityThreshold": {
                    default: "critical",
                    enum: ["low", "medium", "high", "critical"]
                },
            },
        },
        enforcementLevel: "mandatory",
        description: "Scans Docker Images with Snyk",
        validateStack: validateStack,
    },
    {
        // This is the resource version of the policy. It does not work because
        // the image has not yet been build when the policy fires (despite
        // buildOnPreview being true). Keeping it around in case the underlying
        // implementation of policy changes so that create() fires before
        // resource policies do. Because the policy does not work at the time of
        // writing, we keep it disabled:
        name: "snyk-container-scan-resource",
        description: "Scans Docker Images with Snyk using a resource policy",
        enforcementLevel: "disabled",
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
        validateResource: validateResource,
    },
    {
        name: "debug-resource",
        description: "Logs the properties present in a docker.Image in a resource validation policy",
        enforcementLevel: "disabled",
        validateResource: debugResource,
    },
    {
        name: "debug-stack",
        enforcementLevel: "disabled",
        description: "Logs the properties present in a docker.Image in a stack validation policy",
        validateStack: debugStack,
    }],
});