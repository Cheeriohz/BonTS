
import { harvestSourceSmart } from "../managers/manager.sourceSelector"
import { construct } from "./shared/role.shared.construct";
import { upgradeController } from "./shared/role.shared.upgradeController";

export class RoleBuilder {

    public run(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY]

        if (creep.memory.working && currentEnergy === 0) {
            creep.memory.working = false;
            creep.say('🔄 harvest');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say('🚧 build');
        }

        if (creep.memory.working) {
            if (!(construct(creep))) {
                this.repair(creep);
            }
        }
        else {
            harvestSourceSmart(creep);
        }
    }

    private repair(creep: Creep) {
        const targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.hits < structure.hitsMax)
            }
        });
        if (targets.length > 0) {
            if (creep.repair(targets[0]) === ERR_NOT_IN_RANGE) {
                creep.say("🔧 Repair");
                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#3ADF00' } });
            }
        }
        else {
            upgradeController(creep);
        }
    }
};
