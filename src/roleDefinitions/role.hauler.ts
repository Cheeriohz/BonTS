import { getContainer, refreshTree } from "../caching/manager.containerSelector";

import { profile } from "Profiler";
import { RoleCreep } from "./base/role.creep";
import { getdropMapPosition } from "caching/caching.dropPickupCacher";

@profile
export class RoleHauler extends RoleCreep {
    public run(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY];
        if (!creep.memory.ignoreLinks) {
            creep.memory.ignoreLinks = false;
        }

        if (creep.memory.working && currentEnergy === 0) {
            creep.memory.working = false;
            // Check to see if we need to toggle link dumping
            this.checkRoomEnergy(creep);
            creep.say("🏗️ pickup");
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say("💦");
        }

        this.carryOutGeneralWork(creep, creep.memory.ignoreLinks);
    }

    protected carryOutGeneralWork(creep: Creep, ignoreLinks: boolean) {
        if (creep.memory.working) {
            // TODO Turn off when we are actually using links
            this.fillClosest(creep, ignoreLinks, true);
        } else {
            // energy full, time to find deposit location.
            this.fillUpHauler(creep);
        }
    }

    protected checkRoomEnergy(creep: Creep) {
        if (creep.room.energyAvailable / creep.room.energyCapacityAvailable < 0.6) {
            creep.memory.ignoreLinks = true;
        } else {
            creep.memory.ignoreLinks = false;
        }
    }

    protected fillUpHauler(creep: Creep) {
        if (creep.memory.precious) {
            const container = Game.getObjectById<StructureContainer>(creep.memory.precious);
            if (container) {
                return this.withdrawMove(creep, container);
            } else {
                creep.memory.precious = null;
            }
        } else if (creep.memory.preciousPosition) {
            this.withdrawPickup(creep, creep.memory.preciousPosition);
        } else if (creep.room.memory.lowRCLBoost) {
            const preciousPosition = getdropMapPosition(creep);
            if (preciousPosition) {
                creep.memory.preciousPosition = preciousPosition;
                this.withdrawPickup(creep, creep.memory.preciousPosition);
            }
        } else {
            const containerId = getContainer(creep);
            if (containerId) {
                const container = Game.getObjectById<StructureContainer>(containerId);
                if (container) {
                    creep.memory.precious = container.id;
                    return this.withdrawMove(creep, container);
                } else {
                    refreshTree(creep.room, containerId);
                }
            }
        }
    }
}
