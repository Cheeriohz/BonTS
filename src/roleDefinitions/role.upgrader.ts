import { sourceSelector } from "../managers/manager.sourceSelector"
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
            roleUpgrader.upgradeController(creep);
        }
        else {
            sourceSelector.harvestSourceSmart(creep);
        }
    }

    private static upgradeController(creep: Creep) {
        let targets = creep.room.find<StructureController>(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_CONTROLLER);
            }
        });
        if (targets.length > 0) {
            if (creep.upgradeController(targets[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#AE02E6', strokeWidth: .15 } });
            }
        }
    }
};


