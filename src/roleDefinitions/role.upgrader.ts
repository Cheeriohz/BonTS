import { sourceSelector } from "../managers/manager.sourceSelector";
import { upgradeControllerHelper } from "./helpers/role.helper.upgradeController";
export class roleUpgrader {

    /** @param {Creep} creep **/
    public static run(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY]

        if (creep.memory.working && currentEnergy == 0) {
            creep.memory.working = false;
            creep.say('🔄 harvest');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
            creep.say('⚡ upgrade');
        }

        if (creep.memory.working) {
            upgradeControllerHelper.upgradeController(creep);
        }
        else {
            sourceSelector.harvestSourceSmart(creep);
        }
    }
};


