import { RemoteDispatcher } from "./remote.dispatcher";
import _ from "lodash";
import { buildProjectCreator } from "building/building.buildProjectCreator";
import { RemoteHarvestManager } from "./manager.remote.remoteHarvest";

export class RemoteHarvestHandler extends RemoteDispatcher {
    public requestRemoteDispatch(dispatchRequest: RemoteDispatchRequest): PathStep[] | null {
        const remoteHarvest = this.GetRemoteHarvest(Game.creeps[dispatchRequest.creep.room.name]);
        if (remoteHarvest) {
            return this.RequestDispatch(dispatchRequest, remoteHarvest);
        }
        return null;
    }

    public GetRemoteHarvest(creep: Creep): RemoteHarvest | null {
        const spawns = _.filter(_.values(Game.spawns), s => {
            return s.room.name === creep.memory.home;
        });
        if (spawns) {
            for (const spawn of spawns) {
                const remoteHarvest = _.find(spawn.memory.remoteHarvests, rm => {
                    return rm.vein === creep.memory.dedication;
                });
                if (remoteHarvest) {
                    return remoteHarvest;
                }
            }
        }
        return null;
    }

    public addRemoteHarvests(spawn: StructureSpawn, mines: RemoteMine[]) {
        for (const mine of mines) {
            const room = Game.rooms[mine.roomName];
            if (room) {
                const minerals = room.find(FIND_MINERALS);
                if (minerals.length > 0) {
                    this.createRemoteMineHarvest(spawn, room, _.first(minerals)!, mine);
                } else {
                    console.log("No minerals detected in room");
                }
            } else {
                console.log("Could not identify room for mine");
            }
        }
    }

    private createRemoteMineHarvest(spawn: StructureSpawn, room: Room, mineral: Mineral, mine: RemoteMine): void {
        if (this.createExtractorBuildProject(spawn, room, mineral)) {
            let remoteHarvest: RemoteHarvest = {
                vein: mineral.id,
                roomName: room.name,
                harvesters: null,
                reserved: false,
                type: mineral.mineralType,
                pathingLookup: this.createPathingLookupFromRemoteMinePathingLookup(mine, mineral.pos)
            };
            if (spawn.memory.remoteHarvests) {
                spawn.memory.remoteHarvests.push(remoteHarvest);
            } else {
                spawn.memory.remoteHarvests = [remoteHarvest];
            }
        } else {
            console.log("Could not create build project");
        }
    }

    private createExtractorBuildProject(spawn: StructureSpawn, room: Room, mineral: Mineral): boolean {
        const bpc: buildProjectCreator = new buildProjectCreator(room, spawn);
        console.log(`Mineral pos: ${JSON.stringify(mineral.pos)}`);
        bpc.createBuildProjectSingleSite(mineral.pos, STRUCTURE_EXTRACTOR);
        return true;
    }

    private createPathingLookupFromRemoteMinePathingLookup(
        mine: RemoteMine,
        destination: RoomPosition
    ): Dictionary<PathStep[][]> {
        let harvestPathingLookup = { pathingLookup: _.cloneDeep(mine.pathingLookup) };
        const roomEntrance: PathStep | undefined = _.first(_.first(mine.pathingLookup[mine.roomName]));
        if (roomEntrance) {
            const roomEntrancePos: RoomPosition = new RoomPosition(roomEntrance.x, roomEntrance.y, mine.roomName);
            let newPath = roomEntrancePos.findPathTo(destination, { ignoreCreeps: true });
            if (newPath) {
                // The entrance position needs to be retained.
                newPath = _.concat(roomEntrance, newPath);
                let newPathReversed = destination.findPathTo(roomEntrancePos, { ignoreCreeps: true });
                newPathReversed = _.slice(newPathReversed, 1, newPathReversed.length - 2);
                harvestPathingLookup.pathingLookup[mine.roomName] = [newPath, newPathReversed];
            } else {
                console.log("Couldn't path to mineral");
            }
        } else {
            console.log("Could not identify room entrance");
        }
        return harvestPathingLookup.pathingLookup;
    }
}
