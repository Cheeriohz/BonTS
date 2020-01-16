import { sourceSelector } from "../managers/manager.sourceSelector"

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
                    this.helpConstruct(creep);
                }

            }
        }
    }

    private static harvestSourceDeprecated(creep: Creep, sources: Source[]) {
        if (creep.store.energy != 0) {
            let sourceFound: boolean = false;
            for (const source in sources) {
                if (!sourceFound && creep.harvest(sources[source]) != ERR_NOT_IN_RANGE) {
                    sourceFound = true;
                }
            }
            if (!sourceFound) {
                creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
        else {
            if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0], { reusePath: 20, visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    }

    private static goHome(creep: Creep) {
        let targets = this.findSpawn(creep);
        if (targets.length > 0) {
            creep.say("Home");
            creep.moveTo(targets[0].pos.x - 1, targets[0].pos.y);
        }
    }

    private static helpConstruct(creep: Creep) {

        let targets = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (targets.length) {
            if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                creep.say("⛏️ Build");
                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#FAAC58' } });
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
        else {
            this.goHome(creep);
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
