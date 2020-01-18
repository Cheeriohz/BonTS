import { containerSelector } from "../managers/manager.containerSelector"
import { constructionSiteCacher } from "managers/manager.constructionSiteCacher"
import { upgradeControllerHelper } from "./helpers/role.helper.upgradeController";
import { constructHelper } from "./helpers/role.helper.construct";

export class roleDrone {
    /** @param {Creep} creep **/
    public static run(creep: Creep) {
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

    private static performDuty(creep: Creep) {
        if (!constructHelper.construct(creep)) {
            upgradeControllerHelper.upgradeController(creep);
        }
    }
};
