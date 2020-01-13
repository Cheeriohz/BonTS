export class roleUpgrader {

    /** @param {Creep} creep **/
    public static run(creep: Creep) {

        if (creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
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
            var sources = creep.room.find(FIND_SOURCES);
            if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#AE02E6', strokeWidth: .15 } });
            }
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


