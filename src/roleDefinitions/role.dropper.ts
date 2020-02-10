import { getContainer, refreshTree } from "../caching/manager.containerSelector";
import { profile } from "Profiler";
import { RoleCreep } from "./base/role.creep";
import { getdropMapPosition } from "caching/caching.dropPickupCacher";
import { TaxiServiceManager } from "managers/manager.taxiService";
@profile
export class RoleDropper extends RoleCreep {
    public run(creep: Creep) {
        // Check if in range to harvest
        if (creep.memory.working) {
            if (super.harvestPrecious(creep) === ERR_NOT_IN_RANGE) {
                creep.memory.working = false;
                creep.memory.preciousPosition = null;
                creep.memory.precious = null;
            }
        } else {
            this.relocate(creep);
        }
    }

    private relocate(creep: Creep) {
        if (creep.memory.preciousPosition) {
            this.checkInPosition(creep, creep.memory.preciousPosition);
        } else {
            const containerId = getContainer(creep);
            if (containerId) {
                const container = Game.getObjectById<StructureContainer>(containerId);
                if (container) {
                    creep.memory.preciousPosition = container.pos;
                    this.taxiToDestination(creep);
                    return;
                } else {
                    refreshTree(creep.room, containerId);
                }
            } else if (creep.room.memory.lowRCLBoost) {
                this.handleNoContainers(creep);
            }
        }
    }

    private handleNoContainers(creep: Creep) {
        const dropLocation = getdropMapPosition(creep);
        if (dropLocation) {
            creep.memory.preciousPosition = { x: dropLocation.x, y: dropLocation.y };
            this.taxiToDestination(creep);
        }
    }

    private taxiToDestination(creep: Creep) {
        TaxiServiceManager.requestTaxi(
            creep,
            new RoomPosition(creep.memory.preciousPosition!.x, creep.memory.preciousPosition!.y, creep.room.name),
            0
        );
    }

    private checkInPosition(creep: Creep, pos: { x: number; y: number }): boolean {
        if (creep.pos.x === pos.x && creep.pos.y === pos.y) {
            this.updatePrecious(creep);
            creep.memory.working = true;
            return true;
        } else {
            this.taxiToDestination(creep);
            return false;
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
