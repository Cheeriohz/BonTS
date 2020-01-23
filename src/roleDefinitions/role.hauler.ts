import { getContainer } from "../managers/caching/manager.containerSelector"

import { profile } from "Profiler";
import { RoleCreep } from "./base/role.creep";

@profile
export class RoleHauler extends RoleCreep {

    public run(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY]

        if (creep.memory.working && currentEnergy === 0) {
            creep.memory.working = false;
            creep.say('🏗️ pickup');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say('💦');
        }

        // energy full, time to find deposit location.
        if (creep.memory.working) {
            this.fillClosest(creep);
        }
        else {
            this.fillUpHauler(creep);
        }
    }

    protected fillUpHauler(creep: Creep) {
        const container = Game.getObjectById<StructureContainer>(getContainer(creep));
        if (container) {
            return this.withdrawMove(creep, container);
        }
    }



};
