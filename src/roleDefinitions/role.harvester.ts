export class roleHarvester {

    /** @param {Creep} creep **/
    public static run(creep: Creep) {
        //determine nearest source and harvest energy
        if (creep.store.getFreeCapacity() > 0) {
            let sources = creep.room.find(FIND_SOURCES);
            if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
        //energy full, time to find deposit location. TODO: Refactor for a single targets lookup that is globally stored.
        else {
            let targets = this.findEnergySources(creep)

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

    private static goHome(creep: Creep) {
        creep.say("Home");
        let targets = this.findSpawn(creep);
        if (targets.length > 0) {
            creep.moveTo(targets[0]);
        }
    }

    private static helpConstruct(creep: Creep) {
        let targets = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (targets.length) {
            if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#FAAC58' } });
            }
        }
        else {
            this.goHome(creep);
        }
    }

    private static findEnergySources(creep: Creep) {
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

//module.exports = roleHarvester;
