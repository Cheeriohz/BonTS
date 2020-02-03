import { profile } from "Profiler";
import { RoleCreep } from "./base/role.creep";

@profile
export class RoleDrone extends RoleCreep {
    public run(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY];

        if (creep.memory.working && currentEnergy === 0) {
            creep.memory.working = false;
            creep.say("🍯");
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say("🐝");
        }

        // energy full, time to find deposit location.
        if (creep.memory.working) {
            this.performDuty(creep);
        } else {
            this.fillUp(creep);
        }
    }

    private performDuty(creep: Creep) {
        //if (!this.construct(creep)) {
        this.upgradeController(creep);
        //}
    }
}
