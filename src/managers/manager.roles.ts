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
import { ExpeditionManager } from "./manager.expedition";

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


    constructor() {
        this.mHarvester = new RoleHarvester();
        this.mUpgrader = new RoleUpgrader();
        this.mBuilder = new RoleBuilder();
        this.mDropper = new RoleDropper();
        this.mHauler = new RoleHauler();
        this.mDrone = new RoleDrone();
        this.mScout = new RoleScout();
    }

    public run() {
        for (const name in Memory.creeps) {
            if (!(name in Game.creeps)) {
                delete Memory.creeps[name];
            }
            else {
                this.manageRoles(name);
                // this.manageRolesLogged(name);
            }
        }
    }


    public manageRolesLogged(name: string) {
        const startTime = Game.cpu.getUsed();
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
            case CreepRole.scout: {
                this.manageScout(Game.creeps[name]);
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
            this.mExpeditionManager = new ExpeditionManager(true);
        }
        this.mScout.run(creep, this.mExpeditionManager);
    }
}


