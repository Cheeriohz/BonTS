import { profile } from "Profiler";
import { RoleCreep } from "./base/role.creep";

@profile
export class RoleTopper extends RoleCreep {
    public run(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY];

        if (creep.memory.working && currentEnergy === 0) {
            creep.memory.working = false;
            // Check to see if we need to toggle link dumping
            creep.say("🏗️ pickup");
        }
        if (!creep.memory.working && creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
            creep.memory.working = true;
            creep.say("💦");
        }

        this.carryOutGeneralWork(creep);
    }

    protected carryOutGeneralWork(creep: Creep) {
        if (creep.memory.working) {
            this.fillClosest(creep, false, !creep.room.memory.linksActive);
        } else {
            // energy full, time to find deposit location.
            this.fillUpTopper(creep);
        }
    }

    protected fillUpTopper(creep: Creep) {
        const storage = creep.room.storage;
        if (storage) {
            return this.withdrawMoveCached(creep, storage);
        }
    }
}
