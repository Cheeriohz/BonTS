import { ErrorMapper } from "utils/ErrorMapper";


//Mangers
import { spawner } from "managers/manager.spawner";

import { rolesManager } from "managers/manager.roles";
import { towerManager } from "managers/manager.towers";



//JS Profiler Import
//import { enable, wrap } from "../node_modules/screeps-profiler" PROFILER


// This line monkey patches the global prototypes.
//enable(); PROFILER

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  //wrap(function () { PROFILER
  console.log(`Current game tick is ${Game.time}`);

  //Spawn creeps
  spawner.run();

  //Manage roles
  rolesManager.run();
  towerManager.run();
  //}) PROFILER
});
