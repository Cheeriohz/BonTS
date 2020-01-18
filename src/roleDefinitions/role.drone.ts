import { containerSelector } from "../managers/manager.containerSelector"
import { constructionManager } from "managers/manager.constructionManager"

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
        if (!this.construct(creep)) {
            this.upgradeController(creep);
        }
    }

    private static upgradeController(creep: Creep): boolean {
        let targets = creep.room.find<StructureController>(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_CONTROLLER);
            }
        });
        if (targets.length > 0) {
            if (creep.upgradeController(targets[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#AE02E6', strokeWidth: .15 } });
                return true;
            }
            else {
                return true;
            }
        }
        return false;
    }

    private static construct(creep: Creep): boolean {
        const target = constructionManager.getConstructionSiteRoom(creep.room);
        if (target) {
            if (creep.build(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#FAAC58' } });
                return true;
            }
            else {
                return true;
            }
        }
        return false;
    }

    //Not sure we will need this, but keeping for now.
    private static dumpEnergy(creep: Creep) {
        let targets = this.findEnergyDeposits(creep);
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
