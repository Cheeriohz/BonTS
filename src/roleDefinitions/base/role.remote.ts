import { RoleCreep } from "./role.creep";
import _ from "lodash";

export class RoleRemote extends RoleCreep {
    /*protected run(creep: Creep) {
        if (creep)
    }*/

    protected travelToRoomByCachedPath(creep: Creep, roomName: string, cachedPath: PathStep[]) {
        throw "I Haven't implemented this yet.";
    }

    // TODO implement some form of caching here. These searches are pretty expensive iirc.
    protected travelToRoom(creep: Creep, roomName: string, repairWhileMove: boolean) {
        let target = Game.map.findExit(creep.room.name, roomName);
        if (target > 0) {
            const destination = creep.pos.findClosestByPath(<ExitConstant>target);
            if (destination) {
                creep.moveTo(destination, {
                    reusePath: 40,
                    ignoreCreeps: false
                });
                if (repairWhileMove) {
                    this.repairRoad(creep);
                }
            }
        }
    }

    protected repairRoad(creep: Creep) {
        const road = creep.pos.lookFor(LOOK_STRUCTURES).find(object => object.structureType === STRUCTURE_ROAD);
        const repairPower: number = creep.getActiveBodyparts(WORK) * 100;
        if (road && road.hits + repairPower <= road.hitsMax) {
            creep.repair(road);
        }
    }

    protected renew(creep: Creep, timeToLiveThreshold: number): boolean {
        // TODO more robustness.
        if (creep.room.memory.spawns && creep.room.memory.spawns.length > 0) {
            if (creep.ticksToLive && creep.ticksToLive < timeToLiveThreshold) {
                if (creep.room.energyAvailable > this.creepRenewCost(creep)) {
                    const spawn: StructureSpawn | null = Game.getObjectById<StructureSpawn>(
                        creep.room.memory.spawns[0]
                    );
                    if (spawn && !spawn.spawning) {
                        if (creep.pos.isNearTo(spawn)) {
                            spawn.renewCreep(creep);
                            return true;
                        } else {
                            creep.moveTo(spawn, { ignoreCreeps: false, reusePath: 5 });
                            return false;
                        }
                    }
                }
            }
        }
        return false;
    }

    protected creepRenewCost(creep: Creep): number {
        let totalCost: number = 0;
        const bodyPartTotal = creep.body.length;
        for (const bodyPart of creep.body) {
            switch (bodyPart.type) {
                case MOVE: {
                    totalCost += 50;
                    break;
                }
                case WORK: {
                    totalCost += 100;
                    break;
                }
                case CARRY: {
                    totalCost += 50;
                    break;
                }
                case ATTACK: {
                    totalCost += 80;
                    break;
                }
                case RANGED_ATTACK: {
                    totalCost += 150;
                    break;
                }
                case TOUGH: {
                    totalCost += 10;
                    break;
                }
                case HEAL: {
                    totalCost += 250;
                    break;
                }
                case CLAIM: {
                    totalCost += 600;
                    break;
                }
            }
        }
        return totalCost / 2.5 / bodyPartTotal;
    }

    protected dedicatedContainerRelocateRemote(creep: Creep, dedication: string, remoteRoom: string): boolean {
        if (creep.room.name !== remoteRoom) {
            this.travelToRoom(creep, remoteRoom, false);
            return false;
        } else {
            const container = Game.getObjectById<StructureContainer>(dedication);
            if (container) {
                if (creep.pos.x === container.pos.x && creep.pos.y === container.pos.y) {
                    creep.memory.working = true;
                    return true;
                } else {
                    creep.moveTo(container.pos);
                    return false;
                }
            }
        }
        return false;
    }

    protected fillUpAtHome(creep: Creep) {
        if (creep.room.name === creep.memory.home) {
            this.fillUp(creep);
        } else {
            this.travelToRoom(creep, creep.memory.home!, false);
        }
    }

    protected constructRemote(creep: Creep, constructRoom: string, repairWhileMove: boolean) {
        if (creep.room.name === constructRoom) {
            this.construct(creep);
            return;
        } else {
            this.travelToRoom(creep, constructRoom, repairWhileMove);
            return;
        }
    }

    protected harvestRemote(creep: Creep, harvestRoom: string, target: string) {
        if (creep.room.name !== harvestRoom) {
            this.travelToRoom(creep, harvestRoom, false);
            return;
        } else {
            const source: Source | null = Game.getObjectById(target);
            if (source) {
                if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { reusePath: 20, visualizePathStyle: { stroke: "#ffaa00" } });
                    return;
                }
            }
        }
    }
}
