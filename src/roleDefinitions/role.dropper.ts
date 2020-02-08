import { getContainer, refreshTree } from "../caching/manager.containerSelector";

import { profile } from "Profiler";
import { RoleCreep } from "./base/role.creep";
import { getSource } from "caching/manager.sourceSelector";
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
        if (containerId) {
            const container = Game.getObjectById<StructureContainer>(containerId);
            if (container) {
                this.checkInPosition(creep, container.pos);
            } else {
                refreshTree(creep.room, containerId);
            }
        } else if (creep.room.memory.lowRCLBoost) {
            this.handleNoContainers(creep);
        }
    }

    private handleNoContainers(creep: Creep) {
        if (creep.memory.precious) {
            const source: Source | null = Game.getObjectById(creep.memory.precious);
            if (source) {
                if (creep.pos.getRangeTo(source) === 1) {
                    this.updatePrecious(creep);
                    creep.memory.working = true;
                    this.harvestPrecious(creep);
                } else {
                    creep.moveTo(source);
                }
            }
        }
        const sourceId = getSource(creep);
        if (sourceId) {
            creep.memory.precious = sourceId;
            const source: Source | null = Game.getObjectById(sourceId);
            if (source) {
                creep.memory.path = creep.pos.findPathTo(source.pos.x, source.pos.y, { ignoreCreeps: true });
                this.pathHandling(creep);
            }
        }
    }

    private checkInPosition(creep: Creep, pos: RoomPosition) {
        if (creep.pos.x === pos.x && creep.pos.y === pos.y) {
            this.updatePrecious(creep);
            creep.memory.working = true;
        } else {
            creep.moveTo(pos);
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
