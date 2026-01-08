import * as core from "@actions/core";
import * as path from "path";
import * as actions from "./actions";
import * as compose from "./compose";
import * as docker from "./docker";
import { generateCacheKey } from "./actions";
import { VolumeInput } from "./inputs";

export interface VolumeRestoreResult {
  name: string;
  cacheKey: string;
  exactHit: boolean;
}

function getTarPath(volumeName: string): string {
  const runnerTemp = process.env.RUNNER_TEMP || "/tmp";
  return path.join(runnerTemp, `${volumeName}.tar`);
}

export async function restoreVolumes(
  projectName: string,
  volumes: VolumeInput[],
  cacheKeyPrefix: string,
): Promise<VolumeRestoreResult[]> {
  const results: VolumeRestoreResult[] = [];

  for (const volume of volumes) {
    const result = await restoreVolume(projectName, volume, cacheKeyPrefix);
    results.push(result);
  }

  return results;
}

async function restoreVolume(
  projectName: string,
  volume: VolumeInput,
  cacheKeyPrefix: string,
): Promise<VolumeRestoreResult> {
  const { key, restoreKeys } = generateCacheKey(cacheKeyPrefix, volume.name, volume.hash);
  const fullVolumeName = compose.fullVolumeName(projectName, volume.name);
  const tarPath = getTarPath(volume.name);

  core.info(`Restoring volume ${volume.name}...`);

  const restoredKey = await actions.restoreCache(key, restoreKeys, tarPath);

  if (restoredKey) {
    const exactHit = restoredKey === key;
    core.info(`Cache ${exactHit ? "hit" : "partial hit"} for ${volume.name} (${restoredKey})`);

    try {
      if (await docker.volumeExists(fullVolumeName)) {
        await docker.removeVolume(fullVolumeName);
      }

      const labels = compose.volumeLabels(projectName, volume.name);
      await docker.createVolume(fullVolumeName, labels);
      await docker.untarFileToVolume(tarPath, fullVolumeName);

      core.info(`Restored volume ${volume.name}`);
    } catch (error) {
      core.warning(`Failed to restore volume ${volume.name}: ${error}`);
    }

    return { name: volume.name, cacheKey: key, exactHit };
  }

  core.info(`Cache miss for ${volume.name}`);
  return { name: volume.name, cacheKey: key, exactHit: false };
}

export async function saveVolumes(
  projectName: string,
  results: VolumeRestoreResult[],
): Promise<void> {
  for (const result of results) {
    if (result.exactHit) {
      core.info(`Skipping ${result.name}, exact cache hit`);
      continue;
    }

    await saveVolume(projectName, result);
  }
}

async function saveVolume(projectName: string, result: VolumeRestoreResult): Promise<void> {
  const fullVolumeName = compose.fullVolumeName(projectName, result.name);
  const tarPath = getTarPath(result.name);

  core.info(`Saving volume ${result.name}...`);

  if (!(await docker.volumeExists(fullVolumeName))) {
    core.warning(`Volume ${fullVolumeName} does not exist, skipping`);
    return;
  }

  try {
    await docker.tarVolumeToFile(fullVolumeName, tarPath);
    await actions.saveCache(result.cacheKey, tarPath);
    core.info(`Saved volume ${result.name}`);
  } catch (error) {
    core.warning(`Failed to save volume ${result.name}: ${error}`);
  }
}
