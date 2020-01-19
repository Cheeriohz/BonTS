import { containerSelector } from "../managers/manager.containerSelector"
import { upgradeController } from "./helpers/role.helper.upgradeController";
import { construct } from "./helpers/role.helper.construct";
import { profile } from "Profiler";

@profile
export class roleDrone {
    constructor() {

    }

    /** @param {Creep} creep **/
    public run(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY]

        if (creep.memory.working && currentEnergy == 0) {
            creep.memory.working = false;
            creep.say('🍯 bzz');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
            creep.say('🐝 bzz');
        }

        //energy full, time to find deposit location.
        if (creep.memory.working) {
            this.performDuty(creep);
        }
        else {
            containerSelector.withdraw(creep);
        }
    }

    private performDuty(creep: Creep) {
        if (!construct(creep)) {
            upgradeController(creep);
        }
    }
};
