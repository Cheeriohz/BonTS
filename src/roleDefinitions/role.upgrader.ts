import { harvestSourceSmart } from "../managers/manager.sourceSelector";
import { upgradeController } from "./shared/role.shared.upgradeController";
export class RoleUpgrader {

    public run(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY]

        if (creep.memory.working && currentEnergy === 0) {
            creep.memory.working = false;
            creep.say('🔄 harvest');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say('⚡ upgrade');
        }

        if (creep.memory.working) {
            upgradeController(creep);
        }
        else {
            harvestSourceSmart(creep);
        }
    }
};


