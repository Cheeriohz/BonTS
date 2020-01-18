import { sourceSelector } from "../managers/manager.sourceSelector"
import { upgradeControllerHelper } from "./helpers/role.helper.upgradeController";
import { constructHelper } from "./helpers/role.helper.construct";

export class roleHarvester {

    /** @param {Creep} creep **/
    public static run(creep: Creep) {
        //determine nearest source and harvest energy
        if (creep.store.getFreeCapacity() > 0) {
            //roleHarvester.harvestSourceDeprecated(creep, sources);
            sourceSelector.harvestSourceSmart(creep);
        }
        //energy full, time to find deposit location. TODO: Refactor for a single targets lookup that is globally stored.
        else {
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
                else {
                    if (!constructHelper.construct(creep)) {
                        upgradeControllerHelper.upgradeController(creep);
                    }
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
