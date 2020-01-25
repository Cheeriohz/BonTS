import { getContainer } from "../managers/caching/manager.containerSelector"

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

        // energy full, time to find deposit location.
        if (creep.memory.working) {
            this.fillClosest(creep, creep.memory.ignoreLinks);
        }
        else {
            this.fillUpHauler(creep);
        }
    }

    private checkRoomEnergy(creep: Creep) {
        if ((creep.room.energyAvailable / creep.room.energyCapacityAvailable) < .4) {
            creep.memory.ignoreLinks = true;
        }
        else {
            creep.memory.ignoreLinks = false;
        }
    }

    protected fillUpHauler(creep: Creep) {
        const container = Game.getObjectById<StructureContainer>(getContainer(creep));
        if (container) {
            return this.withdrawMove(creep, container);
        }
    }



};
