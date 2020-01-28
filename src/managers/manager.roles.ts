// Enums
import { CreepRole } from "../enums/enum.roles"

// Roles
import { RoleBuilder } from "roleDefinitions/role.builder";
import { RoleDrone } from "roleDefinitions/role.drone";
import { RoleDropper } from "roleDefinitions/role.dropper";
import { RoleHarvester } from "roleDefinitions/role.harvester";
import { RoleHauler } from "roleDefinitions/role.hauler";
import { RoleUpgrader } from "roleDefinitions/role.upgrader";
import { RoleScout } from "roleDefinitions/role.scout";
import { ExpeditionManager } from "../expansion/manager.expedition";

import { RoleDedicatedDropper } from "roleDefinitions/dedicated/role.dedicated.dropper";
import { RoleDedicatedHauler } from "roleDefinitions/dedicated/role.dedicated.hauler";

import { RoleRemoteBuilder } from "roleDefinitions/remote/role.remote.builder";
import { RoleRemoteDropper } from "roleDefinitions/remote/role.remote.dropper";
import { RoleRemoteHauler } from "roleDefinitions/remote/role.remote.hauler";

export
    class RolesManager {
    private mHarvester!: RoleHarvester;
    private mUpgrader!: RoleUpgrader;
    private mBuilder!: RoleBuilder;
    private mDropper!: RoleDropper;
    private mHauler!: RoleHauler;
    private mDrone!: RoleDrone;
    private mScout!: RoleScout;
    private mExpeditionManager: ExpeditionManager | undefined;

    private mDDropper!: RoleDedicatedDropper;
    private mDHauler!: RoleDedicatedHauler;

    private mRBuilder!: RoleRemoteBuilder;
    private mRDropper!: RoleRemoteDropper;
    private mRHauler!: RoleRemoteHauler;

    constructor() {
        this.mHarvester = new RoleHarvester();
        this.mUpgrader = new RoleUpgrader();
        this.mBuilder = new RoleBuilder();
        this.mDropper = new RoleDropper();
        this.mHauler = new RoleHauler();
        this.mDrone = new RoleDrone();
        this.mScout = new RoleScout();

        this.mDDropper = new RoleDedicatedDropper();
        this.mDHauler = new RoleDedicatedHauler();

        this.mRBuilder = new RoleRemoteBuilder();
        this.mRDropper = new RoleRemoteDropper();
        this.mRHauler = new RoleRemoteHauler();
    }

    public run() {
        for (const name in Memory.creeps) {
            if (!(name in Game.creeps)) {
                delete Memory.creeps[name];
            }
            else {
                this.manageRoles(Game.creeps[name]);
                // this.manageRolesLogged(name);
            }
        }
    }


    public manageRolesLogged(creep: Creep) {
        const startTime = Game.cpu.getUsed();
        this.manageRoles(creep);
        console.log(`   Execution time for ${creep.name}: ${Game.cpu.getUsed() - startTime}`);

    }


    private manageRoles(creep: Creep) {
        if (creep.memory.home) {
            this.manageRemoteCreepRole(creep);
        }
        else if (creep.memory.dedication) {
            this.manageDedicatedCreepRole(creep, creep.memory.dedication)
        }
        else {
            switch (creep.memory.role) {
                case CreepRole.harvester: {
                    this.manageHarvester(creep);
                    break;
                }
                case CreepRole.upgrader: {
                    this.manageUpgrader(creep);
                    break;
                }
                case CreepRole.builder: {
                    this.manageBuilder(creep);
                    break;
                }
                case CreepRole.dropper: {
                    this.manageDropper(creep);
                    break;
                }
                case CreepRole.hauler: {
                    this.manageHauler(creep);
                    break;
                }
                case CreepRole.drone: {
                    this.manageDrone(creep);
                    break;
                }
                case CreepRole.scout: {
                    this.manageScout(creep);
                }
            }
        }
    }

    private manageRemoteCreepRole(creep: Creep) {
        switch (creep.memory.role) {
            case CreepRole.builder: {
                this.mRBuilder.run(creep);
                break;
            }
            case CreepRole.dropper: {
                this.mRDropper.run(creep);
                break;
            }
            case CreepRole.hauler: {
                this.mRHauler.run(creep);
                break;
            }
            default: {
                console.log(`No remote role exists for creep: ${creep.name}`);
            }
        }
    }

    private manageDedicatedCreepRole(creep: Creep, dedication: string) {
        switch (creep.memory.role) {
            case CreepRole.dropper: {
                this.mDDropper.runDedicated(creep, dedication);
                break;
            }
            case CreepRole.hauler: {
                this.mDHauler.runDedicated(creep, dedication);
                break;
            }
            default: {
                console.log(`No dedicated role exists for ${creep.name}`);
                break;
            }
        }
    }

    private manageHarvester(creep: Creep) {
        this.mHarvester.run(creep);
    }
    private manageUpgrader(creep: Creep) {
        this.mUpgrader.run(creep);
    }
    private manageBuilder(creep: Creep) {
        this.mBuilder.run(creep);
    }
    private manageDropper(creep: Creep) {
        this.mDropper.run(creep);
    }
    private manageHauler(creep: Creep) {
        this.mHauler.run(creep);
    }
    private manageDrone(creep: Creep) {
        this.mDrone.run(creep);
    }

    private manageScout(creep: Creep) {
        if (!this.mExpeditionManager) {
            this.mExpeditionManager = new ExpeditionManager();
        }
        this.mScout.runExpeditionScout(creep, this.mExpeditionManager);
    }
}


