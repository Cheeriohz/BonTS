//Enums
import { CreepRole } from "../enums/enum.roles"

//Roles
import { roleHarvester } from "roleDefinitions/role.harvester";
import { roleUpgrader } from "roleDefinitions/role.upgrader";
import { roleBuilder } from "roleDefinitions/role.builder";
import { roleDropper } from "roleDefinitions/role.dropper";
import { roleHauler } from "roleDefinitions/role.hauler";
import { roleDrone } from "roleDefinitions/role.drone";

export class rolesManager {
    public static run() {



        for (const name in Memory.creeps) {
            if (!(name in Game.creeps)) {
                delete Memory.creeps[name];
            }
            else {
                this.manageRoles(name);
                //this.manageRolesLogged(name);
            }
        }
    }

    public static manageRolesLogged(name: string) {
        let startTime = Game.cpu.getUsed();
        this.manageRoles(name);
        console.log(`Execution time for ${name}: ${Game.cpu.getUsed() - startTime}`);

    }


    private static manageRoles(name: string) {
        switch (Memory.creeps[name].role) {
            case CreepRole.harvester: {
                roleHarvester.run(Game.creeps[name]);
                break;
            }
            case CreepRole.upgrader: {
                roleUpgrader.run(Game.creeps[name]);
                break;
            }
            case CreepRole.builder: {
                roleBuilder.run(Game.creeps[name]);
                break;
            }
            case CreepRole.dropper: {
                roleDropper.run(Game.creeps[name]);
                break;
            }
            case CreepRole.hauler: {
                roleHauler.run(Game.creeps[name]);
                break;
            }
            case CreepRole.drone: {
                roleDrone.run(Game.creeps[name]);
                break;
            }
        }
    }
}


