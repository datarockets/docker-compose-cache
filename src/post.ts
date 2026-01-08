import * as actions from "./actions";
import * as compose from "./compose";
import * as volumes from "./volumes";

async function post(): Promise<void> {
  const results = actions.getState<volumes.VolumeRestoreResult[]>("results");
  if (!results || results.length === 0) {
    return;
  }

  const composeFiles = actions.getState<string[]>("composeFiles");
  if (!composeFiles) {
    return;
  }

  const projectName = await compose.projectName(composeFiles);
  await volumes.saveVolumes(projectName, results);
}

post();
