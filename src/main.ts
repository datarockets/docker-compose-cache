import * as actions from "./actions";
import * as compose from "./compose";
import * as inputs from "./inputs";
import * as volumes from "./volumes";

async function main(): Promise<void> {
  await actions.setupEnvironmentForImagesCaching();

  const cachedVolumes = inputs.volumes();
  if (cachedVolumes.length === 0) {
    return;
  }
  const composeFiles = inputs.composeFiles();
  const result = await volumes.restoreVolumes(
    await compose.projectName(composeFiles),
    cachedVolumes,
    inputs.cacheKeyPrefix(),
  );

  actions.saveState<volumes.VolumeRestoreResult[]>("results", result);
  actions.saveState<string[]>("composeFiles", composeFiles);
}

main();
