
import { sourceSelector } from "../managers/manager.sourceSelector"

export class roleBuilder {

    /** @param {Creep} creep **/
    public static run(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY]

        if (creep.memory.working && currentEnergy == 0) {
            creep.memory.working = false;
            creep.say('🔄 harvest');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
            creep.say('🚧 build');
        }

        if (creep.memory.working) {
            this.construct(creep);
        }
        else {
            sourceSelector.harvestSourceSmart(creep);
        }
    }

    private static construct(creep: Creep) {
        let targets = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (targets.length) {
            if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#FAAC58' } });
            }
        }
        else {
            this.repair(creep);
        }
    }

    private static repair(creep: Creep) {
        let targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.hits < structure.hitsMax)
            }
        });
        if (targets.length > 0) {
            if (creep.repair(targets[0]) == ERR_NOT_IN_RANGE) {
                creep.say("🔧 Repair");
                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#3ADF00' } });
            }
        }
        else {
            this.upgradeController(creep);
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
