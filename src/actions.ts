import * as cache from "@actions/cache";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as os from "os";

export interface CacheKey {
  key: string;
  restoreKeys: string[];
}

export function generateCacheKey(prefix: string, volumeName: string, hash: string): CacheKey {
  const platform = os.platform();
  const key = `${prefix}-${volumeName}-${platform}-${hash}`;
  const restoreKeys = [`${prefix}-${volumeName}-${platform}-`];

  return { key, restoreKeys };
}

// Cache-related environment variables are available to actions but not to
// subsequent steps. Export them so Docker's GHA cache backend works in later steps.
// GitHub Actions has two cache API versions:
// - v1: uses ACTIONS_CACHE_URL
// - v2: uses ACTIONS_RESULTS_URL
export async function setupEnvironmentForImagesCaching(): Promise<void> {
  const cacheUrl = process.env.ACTIONS_CACHE_URL;
  const resultsUrl = process.env.ACTIONS_RESULTS_URL;
  const runtimeToken = process.env.ACTIONS_RUNTIME_TOKEN;

  // Export both URLs for compatibility with different buildx/compose versions:
  // - v1 API: uses ACTIONS_CACHE_URL
  // - v2 API: uses ACTIONS_RESULTS_URL (required since April 2025)
  if (cacheUrl) {
    core.exportVariable("ACTIONS_CACHE_URL", cacheUrl);
  }
  if (resultsUrl) {
    core.exportVariable("ACTIONS_RESULTS_URL", resultsUrl);
  }

  if (!cacheUrl && !resultsUrl) {
    core.warning(
      "Neither ACTIONS_CACHE_URL nor ACTIONS_RESULTS_URL is available. Image layer caching may not work.",
    );
  }

  if (runtimeToken) {
    core.exportVariable("ACTIONS_RUNTIME_TOKEN", runtimeToken);
  } else {
    core.warning("ACTIONS_RUNTIME_TOKEN is not available. Image layer caching may not work.");
  }

  // Also export ACTIONS_CACHE_SERVICE_V2 if present - this tells buildx to use v2 API
  const cacheServiceV2 = process.env.ACTIONS_CACHE_SERVICE_V2;
  if (cacheServiceV2) {
    core.exportVariable("ACTIONS_CACHE_SERVICE_V2", cacheServiceV2);
  }

  const buildxInstalled = await isBuildxInstalled();
  if (!buildxInstalled) {
    core.warning(
      "Docker buildx is not installed. Image layer caching will not work. " +
        "Please add docker/setup-buildx-action to your workflow.",
    );
  }

  if (cacheUrl && runtimeToken && buildxInstalled) {
    core.info("Image layer caching is configured.");
  }
}

async function isBuildxInstalled(): Promise<boolean> {
  try {
    await exec.exec("docker", ["buildx", "version"], { silent: true });
    return true;
  } catch {
    return false;
  }
}

export async function restoreCache(
  key: string,
  restoreKeys: string[],
  path: string,
): Promise<string | undefined> {
  try {
    return await cache.restoreCache([path], key, restoreKeys);
  } catch (error) {
    core.warning(`Failed to restore cache: ${error}`);
    return undefined;
  }
}

export async function saveCache(key: string, path: string): Promise<void> {
  try {
    await cache.saveCache([path], key);
  } catch (error) {
    core.warning(`Failed to save cache: ${error}`);
  }
}

export function saveState<T>(name: string, value: T): void {
  core.saveState(name, JSON.stringify(value));
}

export function getState<T>(name: string): T | undefined {
  const value = core.getState(name);
  if (!value) {
    return undefined;
  }
  return JSON.parse(value) as T;
}
