import { getContainer } from "../managers/manager.containerSelector"

import { profile } from "Profiler";
@profile
export class RoleDropper {

    public run(creep: Creep) {
        // Check if in range to harvest
        if (creep.memory.working) {
            this.harvest(creep)
        }
        else {
            this.relocate(creep);
        }
    }

    private relocate(creep: Creep) {
        const container = Game.getObjectById<StructureContainer>(this.getContainer(creep));
        // use the working bit to determine which of two max sources can be harvested from. TODO this might have issues if my assumption is wrong.
        if (container) {
            if (creep.pos.x === container.pos.x && creep.pos.y === container.pos.y) {
                creep.memory.working = true;
            }
            else {
                creep.moveTo(container);
            }

        }
    }

    private getContainer(creep: Creep): string {
        return getContainer(creep);
    }

    // Checks to see if in range to havest from a source
    private harvest(creep: Creep) {
        const source = this.locateSource(creep);
        if (source) {
            this.harvestSource(creep, source);
        }
    }

    private harvestSource(creep: Creep, source: Source) {
        creep.harvest(source);
    }

    private locateSource(creep: Creep) {
        return creep.pos.findClosestByRange(FIND_SOURCES);
    }
};

