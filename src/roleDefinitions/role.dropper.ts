import { getContainer, refreshTree } from "../caching/manager.containerSelector"

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
        const containerId = getContainer(creep);
        const container = Game.getObjectById<StructureContainer>(containerId);
        // use the working bit to determine which of two max sources can be harvested from. TODO this might have issues if my assumption is wrong.
        if (container) {
            if (creep.pos.x === container.pos.x && creep.pos.y === container.pos.y) {
                this.updatePrecious(creep);
                creep.memory.working = true;
            }
            else {
                creep.moveTo(container);
            }
        }
        else {
            refreshTree(creep.room, containerId);
        }
    }

    private updatePrecious(creep: Creep) {
        const source = this.locateSource(creep);
        if (source) {
            creep.memory.precious = source.id;
        }
    }


    // Checks to see if in range to havest from a source
    protected harvest(creep: Creep) {
        if (creep.memory.precious) {
            const harvestTarget: Source | Mineral | Deposit | null = Game.getObjectById(creep.memory.precious);
            if (harvestTarget) {
                creep.harvest(harvestTarget);
            }
        }
    }


    private locateSource(creep: Creep): Source | null {
        return creep.pos.findClosestByRange(FIND_SOURCES);
    }
};

