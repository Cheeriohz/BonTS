import { RemoteDispatcher } from "./remote.dispatcher";
import _ from "lodash";
import { RemoteMineExpansion } from "expansion/expansion.remoteMine";
import { CreepRequester } from "spawning/manager.creepRequester";

export class RemoteMineHandler extends RemoteDispatcher {
    public static requestRemoteDispatch(dispatchRequest: RemoteDispatchRequest): PathStep[] | null {
        const remoteMine = this.getRemoteMine(Game.creeps[dispatchRequest.creep.name]);
        if (remoteMine) {
            let returnPath: PathStep[] | null = this.RequestDispatch(dispatchRequest, remoteMine);
            if (returnPath) {
                return returnPath;
            }
        }
        return null;
    }

    public static getRemoteMine(creep: Creep): RemoteMine | null {
        const room = Game.rooms[creep.memory.home!];
        if (room) {
            const remoteMine = _.find(room.memory.remoteMines, rm => {
                return rm.containerId === creep.memory.dedication;
            });
            if (remoteMine) {
                return remoteMine;
            }
        }
        return null;
    }

    // TODO probably obsolete now
    public static repathRemoteMineToStorage(spawn: StructureSpawn) {
        const room = spawn.room;
        const storage = room.storage?.pos;
        if (storage) {
            if (spawn.room.memory.remoteMines) {
                for (let mine of spawn.room.memory.remoteMines) {
                    // Determine the destination
                    const destinationF = _.last(mine.pathingLookup[room.name][0]);
                    if (destinationF) {
                        const newPathForward = storage.findPathTo(destinationF.x, destinationF.y, {
                            ignoreCreeps: true
                        });
                        const startR = _.first(mine.pathingLookup[room.name][1]);
                        if (startR) {
                            const newPathBackward = new RoomPosition(startR.x, startR.y, room.name).findPathTo(
                                storage,
                                { ignoreCreeps: true }
                            );
                            mine.pathingLookup[room.name] = [
                                newPathForward,
                                _.slice(newPathBackward, 0, newPathBackward.length - 1)
                            ];
                        } else {
                            console.log("Could not determine reverse starting location for remote mine repath");
                        }
                    } else {
                        console.log("Could not determine destination for remote mine repath");
                    }
                }
            } else {
                console.log("No mines for remote mine repath");
            }
        } else {
            console.log("No storage for remote mine repath");
        }
    }

    public static checkNeighborsForNeighboringRemoteMine(spawn: StructureSpawn): boolean {
        const describedExits = Game.map.describeExits(spawn.room.name);

        if (describedExits) {
            for (const neighbor of _.compact(_.values(describedExits))) {
                if (this.checkNeighbor(neighbor, spawn)) {
                    return true;
                } else {
                    const describedExitsNeighbor = Game.map.describeExits(neighbor);
                    if (describedExitsNeighbor) {
                        for (const neighborNeighbor of _.compact(_.values(describedExitsNeighbor))) {
                            if (this.checkNeighbor(neighborNeighbor, spawn)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return true;
    }

    public static checkForNeighboringRemoteMine(spawn: StructureSpawn): boolean {
        const describedExits = Game.map.describeExits(spawn.room.name);
        if (describedExits) {
            for (const neighbor of _.compact(_.values(describedExits))) {
                if (this.checkNeighbor(neighbor, spawn)) {
                    return true;
                }
            }
        }
        return true;
    }

    private static checkNeighbor(neighbor: string, spawn: StructureSpawn) {
        const RoomScout = Memory.scouting.roomScouts[neighbor];
        const room = Game.rooms[neighbor];

        // Check our current scouting information to determine if the room is valid for consideration.
        if (RoomScout && !RoomScout.threatAssessment && RoomScout.sourceA && !RoomScout.utilized) {
            // Check if we have visibility currently
            if (room) {
                if (!room.memory.spawns || room.memory.spawns.length === 0) {
                    const storage = spawn.room.storage?.pos ?? this.getStoragePositionFromReservation(spawn.room);
                    if (storage) {
                        console.log(`attempting remote expo create to :  ${RoomScout.roomName}`);
                        const rmExpo: RemoteMineExpansion = new RemoteMineExpansion(RoomScout.sourceA, storage, spawn);
                        if (rmExpo.expandToLocation()) {
                            RoomScout.utilized = true;
                            if (RoomScout.sourceB) {
                                const rmExpoB: RemoteMineExpansion = new RemoteMineExpansion(
                                    RoomScout.sourceA,
                                    storage,
                                    spawn
                                );
                                rmExpoB.expandToLocation();
                                return true;
                            }
                        }
                    }
                }
            } else {
                const cr: CreepRequester = new CreepRequester(spawn);
                cr.RequestScoutToRoom(neighbor);
                return false;
            }
        }
        return false;
    }

    private static getStoragePositionFromReservation(room: Room): RoomPosition | null {
        const sBO = _.first(_.filter(room.memory.reservedBuilds!, rb => rb.type === STRUCTURE_STORAGE));
        if (sBO) {
            return new RoomPosition(sBO.x, sBO.y, room.name);
        }
        return null;
    }
}
