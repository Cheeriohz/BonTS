import { RemoteDispatcher } from "./remote.dispatcher";
import _ from "lodash";

export class RemoteMineHandler extends RemoteDispatcher {
    public requestRemoteDispatch(dispatchRequest: RemoteDispatchRequest): PathStep[] | null {
        const remoteMine = this.getRemoteMine(Game.creeps[dispatchRequest.creep.name]);
        if (remoteMine) {
            let returnPath: PathStep[] | null = this.RequestDispatch(dispatchRequest, remoteMine);
            if (returnPath) {
                if (dispatchRequest.departing) {
                    return returnPath;
                } else {
                    return _.tail(returnPath);
                }
            }
        }
        return null;
    }

    public getRemoteMine(creep: Creep): RemoteMine | null {
        const spawns = _.filter(_.values(Game.spawns), s => {
            return s.room.name === creep.memory.home;
        });
        if (spawns) {
            for (const spawn of spawns) {
                const remoteMine = _.find(spawn.memory.remoteMines, rm => {
                    return rm.containerId === creep.memory.dedication;
                });
                if (remoteMine) {
                    return remoteMine;
                }
            }
        }
        return null;
    }

    public repathRemoteMineToStorage(spawn: StructureSpawn) {
        const room = spawn.room;
        const storage = room.storage?.pos;
        if (storage) {
            if (spawn.memory.remoteMines) {
                for (let mine of spawn.memory.remoteMines) {
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
    //- THIS IS FROM REALLY MESSING UP MY PATHS AND HAVING TO FIX THEM.
    /*
    public fixRemoteMinePathDropHeadOnlyRunOnce(spawn: StructureSpawn) {
        const room = spawn.room;
        const storage = room.storage?.pos;
        if (storage) {
            if (spawn.memory.remoteMines) {
                for (let mine of spawn.memory.remoteMines) {
                    let first: boolean = true;
                    for (let room of _.keys(mine.pathingLookup)) {
                        if (first) {
                            first = false;
                        } else {
                            for (let i = 0; i < 2; i++) {
                                mine.pathingLookup[room][i] = _.tail(mine.pathingLookup[room][i]);
                            }
                        }
                    }
                }
            } else {
                console.log("No mines for remote mine repath");
            }
        } else {
            console.log("No storage for remote mine repath");
        }
    }

    public fixRemoteMinePath(spawn: StructureSpawn) {
        const room = spawn.room;
        const storage = room.storage?.pos;
        if (storage) {
            if (spawn.memory.remoteMines) {
                for (let mine of spawn.memory.remoteMines) {
                    let first: boolean = true;
                    for (let room of _.keys(mine.pathingLookup)) {
                        if (first) {
                            first = false;
                        } else {
                            for (let i = 0; i < 2; i++) {
                                for (let j = 1; j < mine.pathingLookup[room][i].length; j++) {
                                    mine.pathingLookup[room][i][j].dx =
                                        mine.pathingLookup[room][i][j].x - mine.pathingLookup[room][i][j - 1].x;
                                    mine.pathingLookup[room][i][j].dy =
                                        mine.pathingLookup[room][i][j].y - mine.pathingLookup[room][i][j - 1].y;
                                    mine.pathingLookup[room][i][j].direction = this.getDirectionConstant(
                                        mine.pathingLookup[room][i][j].dx,
                                        mine.pathingLookup[room][i][j].dy
                                    );
                                }
                            }
                        }
                    }
                }
            } else {
                console.log("No mines for remote mine repath");
            }
        } else {
            console.log("No storage for remote mine repath");
        }
    }

    protected getDirectionConstant(dx: number, dy: number): DirectionConstant {
        switch (dx) {
            case 0: {
                switch (dy) {
                    case 1: {
                        return BOTTOM;
                    }
                    case -1: {
                        return TOP;
                    }
                    default: {
                        console.log("Error invalid dy for a pathstep");
                    }
                }
                break;
            }
            case 1: {
                switch (dy) {
                    case 0: {
                        return RIGHT;
                    }
                    case 1: {
                        return BOTTOM_RIGHT;
                    }
                    case -1: {
                        return TOP_RIGHT;
                    }
                    default: {
                        console.log("Error invalid dy for a pathstep");
                    }
                }
                break;
            }
            case -1: {
                switch (dy) {
                    case 0: {
                        return LEFT;
                    }
                    case 1: {
                        return BOTTOM_LEFT;
                    }
                    case -1: {
                        return TOP_LEFT;
                    }
                    default: {
                        console.log("Error invalid dy for a pathstep");
                    }
                }
                break;
            }
            default: {
                console.log("Error invalid dx for a pathstep");
                break;
            }
        }
        throw `dx: ${dx}  dy: ${dy} was invalid`;
    } */
}
