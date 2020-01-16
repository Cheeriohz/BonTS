import { containerSelector } from "../managers/manager.containerSelector"

export class roleHauler {

    /** @param {Creep} creep **/
    public static run(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY]

        if (creep.memory.working && currentEnergy == 0) {
            creep.memory.working = false;
            creep.say('🔄 withdraw');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
            creep.say('🚧 deposit');
        }

        //energy full, time to find deposit location.
        if (creep.memory.working) {
            let targets = this.findEnergyDeposits(creep)

            if (targets.length > 0) {
                if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
            else {
                let targets = this.findSpawnEnergyDeprived(creep);
                if (targets.length > 0) {
                    if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
            }
        }
        else {
            containerSelector.withdraw(creep);
        }
    }

    private static findEnergyDeposits(creep: Creep) {
        return creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION
                    || structure.structureType == STRUCTURE_TOWER) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
    }

    private static findSpawnEnergyDeprived(creep: Creep) {
        return creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_SPAWN) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
    }

    private static findSpawn(creep: Creep) {
        return creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_SPAWN);
            }
        });
    }
};
