import { getContainer, refreshTree } from "../managers/caching/manager.containerSelector"

import { profile } from "Profiler";
import { RoleCreep } from "./base/role.creep";

@profile
export class RoleHauler extends RoleCreep {

    public run(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY]
        if (!creep.memory.ignoreLinks) {
            creep.memory.ignoreLinks = false;
        }

        if (creep.memory.working && currentEnergy === 0) {
            creep.memory.working = false;
            // Check to see if we need to toggle link dumping
            this.checkRoomEnergy(creep);
            creep.say('🏗️ pickup');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say('💦');
        }

        this.carryOutGeneralWork(creep, creep.memory.ignoreLinks);
    }

    protected carryOutGeneralWork(creep: Creep, ignoreLinks: boolean) {
        if (creep.memory.working) {
            this.fillClosest(creep, ignoreLinks);
        }
        else {
            // energy full, time to find deposit location.
            this.fillUpHauler(creep);
        }
    }

    protected checkRoomEnergy(creep: Creep) {
        if ((creep.room.energyAvailable / creep.room.energyCapacityAvailable) < .6) {
            creep.memory.ignoreLinks = true;
        }
        else {
            creep.memory.ignoreLinks = false;
        }
    }

    protected fillUpHauler(creep: Creep) {
        if (!creep.memory.precious) {
            const containerId = getContainer(creep);
            const container = Game.getObjectById<StructureContainer>(containerId);
            if (container) {
                creep.memory.precious = container.id;
                return this.withdrawMove(creep, container);
            }
            else {
                refreshTree(creep.room, containerId);
            }
        }
        else {
            const container = Game.getObjectById<StructureContainer>(creep.memory.precious);
            if (container) {
                return this.withdrawMove(creep, container);
            }
            else {
                creep.memory.precious = null;
            }
        }
    }
};
