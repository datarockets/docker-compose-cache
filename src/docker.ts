import * as exec from "@actions/exec";
import * as path from "path";

export async function volumeExists(fullVolumeName: string): Promise<boolean> {
  const exitCode = await exec.exec("docker", ["volume", "inspect", fullVolumeName], {
    silent: true,
    ignoreReturnCode: true,
  });
  return exitCode === 0;
}

export async function removeVolume(fullVolumeName: string): Promise<void> {
  await exec.exec("docker", ["volume", "rm", fullVolumeName], {
    silent: true,
  });
}

export async function createVolume(
  fullVolumeName: string,
  labels: Record<string, string>,
): Promise<void> {
  const args = ["volume", "create"];

  for (const [key, value] of Object.entries(labels)) {
    args.push("--label", `${key}=${value}`);
  }

  args.push(fullVolumeName);

  await exec.exec("docker", args, { silent: true });
}

export async function tarVolumeToFile(fullVolumeName: string, tarPath: string): Promise<void> {
  const dir = path.dirname(tarPath);
  const filename = path.basename(tarPath);

  await exec.exec(
    "docker",
    [
      "run",
      "--rm",
      "-v",
      `${fullVolumeName}:/volume:ro`,
      "-v",
      `${dir}:/backup`,
      "busybox",
      "tar",
      "-cf",
      `/backup/${filename}`,
      "-C",
      "/volume",
      ".",
    ],
    { silent: true },
  );
}

export async function untarFileToVolume(tarPath: string, fullVolumeName: string): Promise<void> {
  const dir = path.dirname(tarPath);
  const filename = path.basename(tarPath);

  await exec.exec(
    "docker",
    [
      "run",
      "--rm",
      "-v",
      `${fullVolumeName}:/volume`,
      "-v",
      `${dir}:/backup:ro`,
      "busybox",
      "tar",
      "-xf",
      `/backup/${filename}`,
      "-C",
      "/volume",
    ],
    { silent: true },
  );
}
