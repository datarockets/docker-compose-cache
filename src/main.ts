import * as actions from "./actions";

async function restoreDockerVolumes(): Promise<void> {
  // TODO: implement
}

async function main(): Promise<void> {
  await actions.setupEnvironmentForImagesCaching();
  await restoreDockerVolumes();
}

main();
