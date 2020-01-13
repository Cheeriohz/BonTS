export class roleDropHarvester {

    /** @param {Creep} creep **/
    public static run(creep: Creep) {
        //Check if in range to harvest
        if (!this.canHarvest(creep)) {
            this.relocate(creep);
        }
    }

    static relocate(creep: Creep) {
        let containers = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_CONTAINER);
            }
        });
        //use the working bit to determine which of two max sources can be harvested from. TODO this might have issues if my assumption is wrong.
        creep.moveTo(containers[creep.memory.working ? 1 : 0]);
    }

    //Checks to see if in range to havest from a source
    private static canHarvest(creep: Creep) {
        let sources = creep.room.find(FIND_SOURCES);
        for (let source in sources) {
            if (creep.harvest(sources[source]) != ERR_NOT_IN_RANGE) {
                return true;
            }
        }
        return false;
    }

};

//module.exports = roleHarvester;
