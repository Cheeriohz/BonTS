import { getContainer, refreshTree } from "../caching/manager.containerSelector";

import { profile } from "Profiler";
import { RoleCreep } from "./base/role.creep";
import { getSource } from "caching/manager.sourceSelector";
import { getdropMapPosition } from "caching/caching.dropPickupCacher";
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
        if (creep.memory.preciousPosition) {
            this.checkInPosition(creep, creep.memory.preciousPosition);
        }
        const containerId = getContainer(creep);
        if (containerId) {
            const container = Game.getObjectById<StructureContainer>(containerId);
            if (container) {
                creep.memory.preciousPosition = container.pos;
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
        const dropLocation = getdropMapPosition(creep);
        if (dropLocation) {
            creep.memory.preciousPosition = { x: dropLocation.x, y: dropLocation.y };
            creep.memory.path = creep.pos.findPathTo(dropLocation.x, dropLocation.y, { ignoreCreeps: true });
            this.pathHandling(creep);
        }
    }

    //? Probably Obsolete
    private _handleNoContainers(creep: Creep) {
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

    private checkInPosition(creep: Creep, pos: { x: number; y: number }) {
        if (creep.pos.x === pos.x && creep.pos.y === pos.y) {
            this.updatePrecious(creep);
            creep.memory.working = true;
        } else {
            creep.moveTo(pos.x, pos.y);
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
