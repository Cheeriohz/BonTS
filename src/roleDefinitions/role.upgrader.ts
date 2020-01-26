import { harvestSourceSmart } from "../caching/manager.sourceSelector";
import { RoleCreep } from "./base/role.creep";
export class RoleUpgrader extends RoleCreep {

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
            this.upgradeController(creep);
        }
        else {
            // TODO need to really change my base creeps to resource drop / pickup logic
            harvestSourceSmart(creep);
        }
    }
};


