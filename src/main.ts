import { ErrorMapper } from "utils/ErrorMapper";
//Roles
import { roleHarvester } from "roleDefinitions/role.harvester";
import { roleUpgrader } from "roleDefinitions/role.upgrader";
import { roleBuilder } from "roleDefinitions/role.builder";

//Mangers
import { spawner } from "managers/manager.spawner";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);

  //Spawn creeps
  spawner.run();
  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }

    if (Memory.creeps[name]?.role == CreepRole.harvester) {
      roleHarvester.run(Game.creeps[name]);
    }
    else if (Memory.creeps[name]?.role == CreepRole.upgrader) {
      roleUpgrader.run(Game.creeps[name]);
    }
    else if (Memory.creeps[name]?.role == CreepRole.builder) {
      roleBuilder.run(Game.creeps[name]);
    }
  }
});

enum CreepRole {
  harvester = 0,
  upgrader,
  builder
}

enum RoomEra {
  stone = 0,
  copper
}
