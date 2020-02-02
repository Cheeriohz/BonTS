import { RemoteDispatcher } from "./remote.dispatcher";
import _ from "lodash";
import { ExpansionCosting } from "expansion/expansion.expansionCosting";

export class RemoteMineHandler extends RemoteDispatcher {
    public requestRemoteDispatch(dispatchRequest: RemoteDispatchRequest): PathStep[] | null {
        const remoteMine = this.getRemoteMine(Game.creeps[dispatchRequest.creep.room.name]);
        if (remoteMine) {
            return this.RequestDispatch(dispatchRequest, remoteMine);
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
                    const destination = _.last(mine.pathingLookup[room.name][0]);
                    if (destination) {
                        const newPathForward = _.tail(
                            storage.findPathTo(destination.x, destination.y, { ignoreCreeps: true })
                        );
                        const newPathBackward = new RoomPosition(
                            destination.x,
                            destination.y,
                            room.name
                        ).findPathTo(storage, { ignoreCreeps: true });
                        mine.pathingLookup[room.name] = [
                            newPathForward,
                            _.slice(newPathBackward, 0, newPathBackward.length - 1)
                        ];
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
}
