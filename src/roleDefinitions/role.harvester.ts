import { sourceSelector } from "../managers/manager.sourceSelector"
import { upgradeController } from "./helpers/role.helper.upgradeController";
import { construct } from "./helpers/role.helper.construct";

export class roleHarvester {

    /** @param {Creep} creep **/
    public run(creep: Creep) {
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
                    if (!construct(creep)) {
                        upgradeController(creep);
                    }
                }

            }
        }
    }

    private findEnergyDeposits(creep: Creep) {
        return creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION
                    || structure.structureType == STRUCTURE_TOWER) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
    }

    private findSpawnEnergyDeprived(creep: Creep) {
        return creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_SPAWN) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
    }
};
