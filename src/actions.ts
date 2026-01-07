import * as core from "@actions/core";
import * as exec from "@actions/exec";

// ACTIONS_CACHE_URL and ACTIONS_RUNTIME_TOKEN are available to actions but not to
// subsequent steps. Export them so Docker's GHA cache backend works in later steps.
export async function setupEnvironmentForImagesCaching(): Promise<void> {
  const cacheUrl = process.env.ACTIONS_CACHE_URL;
  const runtimeToken = process.env.ACTIONS_RUNTIME_TOKEN;

  if (cacheUrl) {
    core.exportVariable("ACTIONS_CACHE_URL", cacheUrl);
  } else {
    core.warning("ACTIONS_CACHE_URL is not available. Image layer caching may not work.");
  }

  if (runtimeToken) {
    core.exportVariable("ACTIONS_RUNTIME_TOKEN", runtimeToken);
  } else {
    core.warning("ACTIONS_RUNTIME_TOKEN is not available. Image layer caching may not work.");
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
