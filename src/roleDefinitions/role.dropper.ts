import { containerSelector } from "../managers/manager.containerSelector"
export class roleDropper {

    /** @param {Creep} creep **/
    public static run(creep: Creep) {
        //Check if in range to harvest
        if (creep.memory.working) {
            this.harvest(creep)
        }
        else {
            this.relocate(creep);
        }
    }

    static relocate(creep: Creep) {
        const container = Game.getObjectById<StructureContainer>(containerSelector.getSource(creep));
        //use the working bit to determine which of two max sources can be harvested from. TODO this might have issues if my assumption is wrong.
        if (container) {
            if (creep.pos.x == container.pos.x && creep.pos.y == container.pos.y) {
                creep.memory.working = true;
            }
            else {
                creep.moveTo(container);
            }

        }
    }

    //Checks to see if in range to havest from a source
    private static harvest(creep: Creep) {
        let source = creep.pos.findClosestByRange(FIND_SOURCES);
        if (source) {
            creep.harvest(source);
        }
    }
};

