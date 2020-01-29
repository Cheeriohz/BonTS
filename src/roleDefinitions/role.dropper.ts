import { getContainer, refreshTree } from "../caching/manager.containerSelector";

import { profile } from "Profiler";
import { RoleCreep } from "./base/role.creep";
@profile
export class RoleDropper extends RoleCreep {
    public run(creep: Creep) {
        // Check if in range to harvest
        if (creep.memory.working) {
            super.harvestPrecious(creep);
        } else {
            this.relocate(creep);
        }
    }

    private relocate(creep: Creep) {
        const containerId = getContainer(creep);
        const container = Game.getObjectById<StructureContainer>(containerId);
        if (container) {
            if (creep.pos.x === container.pos.x && creep.pos.y === container.pos.y) {
                this.updatePrecious(creep);
                creep.memory.working = true;
            } else {
                creep.moveTo(container);
            }
        } else {
            refreshTree(creep.room, containerId);
        }
    }

    private updatePrecious(creep: Creep) {
        const source = this.locateSource(creep);
        if (source) {
            creep.memory.precious = source.id;
        }
    }

    private locateSource(creep: Creep): Source | null {
        return creep.pos.findClosestByRange(FIND_SOURCES);
    }
}
