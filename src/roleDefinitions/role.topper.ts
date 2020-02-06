import { profile } from "Profiler";
import { RoleCreep } from "./base/role.creep";

@profile
export class RoleTopper extends RoleCreep {
    public run(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY];
        if (!creep.memory.ignoreLinks) {
            creep.memory.ignoreLinks = false;
        }

        if (creep.memory.working && currentEnergy === 0) {
            creep.memory.working = false;
            // Check to see if we need to toggle link dumping
            creep.say("🏗️ pickup");
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say("💦");
        }

        this.carryOutGeneralWork(creep, creep.memory.ignoreLinks);
    }

    protected carryOutGeneralWork(creep: Creep, ignoreLinks: boolean) {
        if (creep.memory.working) {
            this.fillClosest(creep, ignoreLinks);
        } else {
            // energy full, time to find deposit location.
            this.fillUpTopper(creep);
        }
    }

    protected checkRoomEnergy(creep: Creep) {
        if (creep.room.energyAvailable / creep.room.energyCapacityAvailable < 0.6) {
            creep.memory.ignoreLinks = true;
        } else {
            creep.memory.ignoreLinks = false;
        }
    }

    protected fillUpTopper(creep: Creep) {
        const storage = creep.room.storage;
        return this.withdrawMove(creep, storage!);
    }
}
