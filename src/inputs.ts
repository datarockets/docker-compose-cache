import * as core from "@actions/core";

export interface VolumeInput {
  name: string;
  hash: string;
}

export function volumes(): VolumeInput[] {
  const input = core.getInput("volumes");
  if (!input.trim()) {
    return [];
  }
  return parseVolumesInput(input);
}

function parseVolumesInput(input: string): VolumeInput[] {
  const volumes: VolumeInput[] = [];

  for (const line of input.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) {
      core.warning(`Invalid volume format, expected "name: hash": ${trimmed}`);
      continue;
    }

    const name = trimmed.slice(0, colonIndex).trim();
    const hash = trimmed.slice(colonIndex + 1).trim();

    if (!name || !hash) {
      core.warning(`Invalid volume format, expected "name: hash": ${trimmed}`);
      continue;
    }

    volumes.push({ name, hash });
  }

  return volumes;
}

export function composeFiles(): string[] {
  const input = core.getInput("compose-files");
  return parseComposeFilesInput(input);
}

function parseComposeFilesInput(input: string): string[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function cacheKeyPrefix(): string {
  return core.getInput("cache-key-prefix") || "docker-compose-cache";
}
