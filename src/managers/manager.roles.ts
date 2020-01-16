//Enums
import { CreepRole } from "../enums/enum.roles"

//Managers
import { sourceSelector } from "./manager.sourceSelector"

//Roles
import { roleHarvester } from "roleDefinitions/role.harvester";
import { roleUpgrader } from "roleDefinitions/role.upgrader";
import { roleBuilder } from "roleDefinitions/role.builder";

export class rolesManager {
    public static run() {
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
    }
}


