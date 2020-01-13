import { ErrorMapper } from "utils/ErrorMapper";


//Mangers
import { spawner } from "managers/manager.spawner";

import { rolesManager } from "managers/manager.roles";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);

  //Spawn creeps
  spawner.run();

  //Manage roles
  rolesManager.run();

});
