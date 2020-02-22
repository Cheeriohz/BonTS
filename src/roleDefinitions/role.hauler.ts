import { getContainer, refreshTree } from "../caching/manager.containerSelector";

import { profile } from "Profiler";
import { RoleCreep } from "./base/role.creep";
import { getdropMapPosition } from "caching/caching.dropPickupCacher";
import _ from "lodash";

@profile
export class RoleHauler extends RoleCreep {
    public run(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY];
        if (!creep.memory.ignoreLinks) {
            creep.memory.ignoreLinks = false;
        }

        if (creep.memory.working && currentEnergy === 0) {
            creep.memory.upgraderDuty = false;
            // Check if we can retrieve any dropped resources
            if (this.droppedResourceHandling(creep)) {
                creep.say("💎👀");
                if (creep.store.getFreeCapacity() !== 0) {
                    return;
                }
            }
            creep.memory.working = false;
            if (creep.memory.tick !== 0) {
                creep.memory.tick = 0;
            } else {
                creep.memory.tick = 1;
            }
            creep.say("🏗️ pickup");
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            if (creep.store.getUsedCapacity()) creep.memory.working = true;
            creep.say("💦");
        }

        this.carryOutGeneralWork(creep, creep.memory.ignoreLinks);
    }

    protected droppedResourceHandling(creep: Creep): Boolean {
        if (this.checkForAdjacentDroppedResources(creep)) {
            return true;
        }
        const enemyResources = creep.room.find(FIND_TOMBSTONES);
        if (enemyResources) {
            const nonEnergy = _.filter(enemyResources, r => r.store.getUsedCapacity() > 0);
            if (nonEnergy) {
                const droppedResource = creep.pos.findClosestByPath(nonEnergy);
                if (droppedResource) {
                    creep.memory.path = creep.pos.findPathTo(droppedResource);
                    creep.memory.path.pop();
                    this.pathHandling(creep);
                    return true;
                }
            }
        }
        if (_.keys(creep.store).length > 0 && creep.room.storage) {
            this.depositMoveUnspecified(creep, creep.room.storage);
            return true;
        }
        const droppedResources = creep.room.find(FIND_DROPPED_RESOURCES);
        if (droppedResources) {
            const droppedResource = creep.pos.findClosestByPath(droppedResources);
            if (droppedResource) {
                creep.memory.path = creep.pos.findPathTo(droppedResource);
                creep.memory.path.pop();
                this.pathHandling(creep);
                return true;
            }
        }
        return false;
    }

    protected carryOutGeneralWork(creep: Creep, ignoreLinks: boolean) {
        if (creep.memory.working) {
            if (creep.memory.upgraderDuty) {
                this.refillUpgraders(creep);
                return;
            }
            this.fillClosest(creep, true, !creep.room.memory.linksActive);
        } else {
            // energy full, time to find deposit location.
            if (creep.room.memory.singleHaul) {
                this.fillUpHaulerMono(creep);
            } else {
                this.fillUpHauler(creep);
            }
        }
    }

    protected checkRoomEnergy(creep: Creep) {
        if (creep.room.energyAvailable / creep.room.energyCapacityAvailable < 0.6) {
            creep.memory.ignoreLinks = true;
        } else {
            creep.memory.ignoreLinks = false;
        }
    }

    protected fillUpHaulerMono(creep: Creep) {
        // console.log(`creep mono: ${creep.name}`);
        if (creep.memory.preciousList && creep.memory.preciousList.length > 0) {
            // console.log(`creep mono trying to get container: ${creep.name}`);
            const container = Game.getObjectById<StructureContainer>(
                creep.memory.tick === 0 ? _.first(creep.memory.preciousList)! : _.last(creep.memory.preciousList)!
            );
            if (container) {
                return this.withdrawMoveCached(creep, container);
            } else {
                creep.memory.preciousList = null;
            }
        } else {
            if (creep.room.memory.containerMap && creep.room.memory.containerMap.length > 0) {
                creep.memory.preciousList = _.map(creep.room.memory.containerMap, cm => cm.id!);
                // console.log(JSON.stringify(creep.memory.preciousList));
            } else {
                this.fillUpHauler(creep);
            }
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
