
import { withdraw } from "../managers/manager.containerSelector"
import { construct } from "./shared/role.shared.construct";
import { upgradeController } from "./shared/role.shared.upgradeController";

import { profile } from "Profiler";
import { RoleCreep } from "./role.creep";

@profile
export class RoleDrone extends RoleCreep {

    public run(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY]

        if (creep.memory.working && currentEnergy === 0) {
            creep.memory.working = false;
            creep.say('🍯 bzz');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say('🐝 bzz');
        }

        // energy full, time to find deposit location.
        if (creep.memory.working) {
            this.performDuty(creep);
        }
        else {
            this.fillUp(creep);
        }
    }

    private withdraw(creep: Creep) {
        withdraw(creep);
    }

    private performDuty(creep: Creep) {
        if (!this.construct(creep)) {
            this.upgradeController(creep);
        }
    }

    private construct(creep: Creep) {
        return construct(creep);
    }

    private upgradeController(creep: Creep) {
        upgradeController(creep);
    }
};
