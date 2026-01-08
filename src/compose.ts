import * as exec from "@actions/exec";

interface ComposeConfig {
  name: string;
}

export async function projectName(composeFiles: string[]): Promise<string> {
  const args = buildComposeArgs(composeFiles, ["config", "--format", "json"]);

  let stdout = "";
  await exec.exec("docker", args, {
    silent: true,
    listeners: {
      stdout: (data) => {
        stdout += data.toString();
      },
    },
  });

  const config: ComposeConfig = JSON.parse(stdout);
  return config.name;
}

export function volumeLabels(projectName: string, volumeName: string): Record<string, string> {
  return {
    "com.docker.compose.project": projectName,
    "com.docker.compose.volume": volumeName,
  };
}

export function fullVolumeName(projectName: string, volumeName: string): string {
  return `${projectName}_${volumeName}`;
}

function buildComposeArgs(composeFiles: string[], command: string[]): string[] {
  const args: string[] = ["compose"];

  for (const file of composeFiles) {
    args.push("-f", file);
  }

  args.push(...command);
  return args;
}
