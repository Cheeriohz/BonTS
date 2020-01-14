//Enums
import { CreepRole } from "../enums/enum.roles"

//Roles
import { roleHarvester } from "roleDefinitions/role.harvester";
import { roleUpgrader } from "roleDefinitions/role.upgrader";
import { roleBuilder } from "roleDefinitions/role.builder";

export class rolesManager {
    public static run() {
        let allSources: Source[] = Game.rooms['W31S51'].find(FIND_SOURCES); //TODO THIS IS A HACK FIX IT
        if (allSources.length > 1) {
            allSources.sort((a: Source, b: Source) => b.energy - a.energy);
        }
        for (const name in Memory.creeps) {
            if (!(name in Game.creeps)) {
                delete Memory.creeps[name];
            }

            if (Memory.creeps[name]?.role == CreepRole.harvester) {
                roleHarvester.run(Game.creeps[name], allSources);
            }
            else if (Memory.creeps[name]?.role == CreepRole.upgrader) {
                roleUpgrader.run(Game.creeps[name], allSources);
            }
            else if (Memory.creeps[name]?.role == CreepRole.builder) {
                roleBuilder.run(Game.creeps[name], allSources);
            }
        }
    }
}


