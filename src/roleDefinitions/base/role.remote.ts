import { RoleCreep } from "./role.creep";
import _ from "lodash";
import { profile } from "Profiler";
import { RemoteMineHandler } from "remote/remote.remoteMineHandler";

@profile
export class RoleRemote extends RoleCreep {
    private serializePosition(pos: RoomPosition): string {
        return `${pos.x}${pos.y}`;
    }

    protected travelToRoom(
        creep: Creep,
        roomName: string,
        repairWhileMove: boolean,
        ignoreRoads?: boolean,
        travelSafe?: boolean
    ) {
        let target;
        if (travelSafe) {
            target = Game.map.findExit(creep.room.name, roomName, { routeCallback: this.remoteSafeRoomTravel });
        } else {
            target = Game.map.findExit(creep.room.name, roomName);
        }
        if (target > 0) {
            const destination = creep.pos.findClosestByPath(<ExitConstant>target);
            if (destination) {
                return this.cachedTravel(destination, creep, repairWhileMove, ignoreRoads, 1);
            }
        }
        return false;
    }

    private remoteSafeRoomTravel(roomName: string, fromRoomName: string) {
        const roomScout = Memory.scouting.roomScouts[roomName];
        if (roomScout && roomScout.threatAssessment && roomScout.threatAssessment > 0) {
            return Infinity;
        }
        return 0;
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
            if (creep.room.name === creep.memory.home) {
                creep.memory.path = RemoteMineHandler.requestCustomRemoteDispatch({ departing: true, creep: creep });
                this.pathHandling(creep);
            } else {
                this.travelToRoom(creep, remoteRoom, false, false, true);
            }
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
            this.travelToRoom(creep, creep.memory.home!, false, false, false);
        }
    }

    protected constructRemote(creep: Creep, constructRoom: string, repairWhileMove: boolean) {
        if (creep.room.name === constructRoom) {
            if (this.leaveBorder(creep)) {
                this.construct(creep);
            }
            return;
        } else {
            this.travelToRoom(creep, constructRoom, repairWhileMove, false, false);
            return;
        }
    }

    protected harvestRemote(creep: Creep, harvestRoom: string, target: string) {
        if (creep.room.name !== harvestRoom) {
            if (this.leaveBorder(creep)) {
                const source: Source | null = Game.getObjectById(target);
                if (source) {
                    this.cachedTravel(source.pos, creep, false, false);
                } else {
                    this.travelToRoom(creep, harvestRoom, false, false, false);
                }
            }
            return;
        } else {
            this.harvestMove(creep, target);
        }
    }
}
