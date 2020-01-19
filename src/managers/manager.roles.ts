//Enums
import { CreepRole } from "../enums/enum.roles"

//Roles
import { roleHarvester } from "roleDefinitions/role.harvester";
import { roleUpgrader } from "roleDefinitions/role.upgrader";
import { roleBuilder } from "roleDefinitions/role.builder";
import { roleDropper } from "roleDefinitions/role.dropper";
import { roleHauler } from "roleDefinitions/role.hauler";
import { roleDrone } from "roleDefinitions/role.drone";

import { profile } from "../Profiler/Profiler";

@profile
export
    class rolesManager {


    constructor() {

    }

    public run() {
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


    public manageRolesLogged(name: string) {
        let startTime = Game.cpu.getUsed();
        this.manageRoles(name);
        console.log(`Execution time for ${name}: ${Game.cpu.getUsed() - startTime}`);

    }


    private manageRoles(name: string) {
        switch (Memory.creeps[name].role) {
            case CreepRole.harvester: {
                this.manageHarvester(Game.creeps[name]);
                break;
            }
            case CreepRole.upgrader: {
                this.manageUpgrader(Game.creeps[name]);
                break;
            }
            case CreepRole.builder: {
                this.manageBuilder(Game.creeps[name]);
                break;
            }
            case CreepRole.dropper: {
                this.manageDropper(Game.creeps[name]);
                break;
            }
            case CreepRole.hauler: {
                this.manageHauler(Game.creeps[name]);
                break;
            }
            case CreepRole.drone: {
                this.manageDrone(Game.creeps[name]);
                break;
            }
        }
    }

    private manageHarvester(creep: Creep) {
        roleHarvester.run(creep);
    }
    private manageUpgrader(creep: Creep) {
        roleUpgrader.run(creep);
    }
    private manageBuilder(creep: Creep) {
        roleBuilder.run(creep);
    }
    private manageDropper(creep: Creep) {
        roleDropper.run(creep);
    }
    private manageHauler(creep: Creep) {
        roleHauler.run(creep);
    }
    private manageDrone(creep: Creep) {
        roleDrone.run(creep);
    }
}


