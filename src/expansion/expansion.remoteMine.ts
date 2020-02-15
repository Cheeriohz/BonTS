import { ExpansionCosting } from "./expansion.expansionCosting";
import { CreepRequester } from "spawning/manager.creepRequester";
import _ from "lodash";
import { buildProjectCreator } from "building/building.buildProjectCreator";
import { ErrorMapper } from "utils/ErrorMapper";
import { BuildProjectEnum } from "building/interfaces/building.enum";

export class RemoteMineExpansion {
    private vein!: Id<Source>;
    private costing!: ExpansionCosting;
    private storage!: RoomPosition;
    private storageRoom!: Room;
    private source!: Source | null;
    private spawn!: StructureSpawn;

    constructor(vein: Id<Source>, storage: RoomPosition, spawn: StructureSpawn) {
        this.vein = vein;
        this.storage = storage;
        this.storageRoom = Game.rooms[this.storage.roomName];
        this.spawn = spawn;
        this.source = Game.getObjectById<Source>(this.vein);
        if (this.source) {
            this.costing = new ExpansionCosting(storage, this.source.pos, vein, 1);
        } else {
            throw "Source ID didn't map to a source";
        }
    }

    public expandToLocation() {
        this.costing.translateFullPathToRetainableRoomPaths();
        if (this.createBuildProjects()) {
            this.persistPathingToMemory();
        }
    }

    private createBuildProjects(): boolean {
        let success: boolean = true;
        for (let index = 0; index < this.costing.translatedPaths.length - 1; index++) {
            const translatedPath = this.costing.translatedPaths[index];
            let clonedPath = _.cloneDeep(translatedPath.path);
            const room: Room | undefined = Game.rooms[translatedPath.roomName];
            if (!room) {
                // Need room visibility.
                const cr: CreepRequester = new CreepRequester(this.spawn);
                cr.RequestScoutToRoom(translatedPath.roomName);
                success = false;
            } else {
                const bpc: buildProjectCreator = new buildProjectCreator(room, this.spawn);
                bpc.createBuildProjectHighway(clonedPath, BuildProjectEnum.RemoteContainerExpansion);
            }
        }
        const translatedPath = _.last(this.costing.translatedPaths);
        let clonedPath = _.cloneDeep(translatedPath!.path);
        const room: Room | undefined = Game.rooms[translatedPath!.roomName];
        if (!room) {
            // Need room visibility.
            const cr: CreepRequester = new CreepRequester(this.spawn);
            cr.RequestScoutToRoom(translatedPath!.roomName);
            success = false;
        } else {
            const bpc: buildProjectCreator = new buildProjectCreator(room, this.spawn);
            bpc.createBuildProjectContainerExpansionLegacy(clonedPath, BuildProjectEnum.RemoteContainerExpansion);
        }
        return success;
    }

    private persistPathingToMemory() {
        if (!this.storageRoom.memory.remoteMines) {
            this.storageRoom.memory.remoteMines = new Array<RemoteMine>();
        }

        let pathingLookup: Dictionary<PathStep[][]> = {};
        for (const rpr of this.costing.translatedPaths) {
            const rprReverse = _.find(this.costing.translatedPathsReversed, rprR => {
                return rprR.roomName === rpr.roomName;
            });
            if (rprReverse) {
                pathingLookup[rpr.roomName] = [rpr.path, rprReverse.path];
            } else {
                console.log(ErrorMapper.sourceMappedStackTrace("Could not find a reversed room path"));
            }
        }

        const remoteMine: RemoteMine = {
            containerId: null,
            extractorId: null,
            miner: null,
            haulers: null,
            type: RESOURCE_ENERGY,
            vein: this.vein,
            pathingLookup: pathingLookup,
            roomName: this.costing.getDestinationRoomName(),
            reserved: false
        };

        if (this.storageRoom.memory.remoteMines.length === 0) {
            this.storageRoom.memory.remoteMines = [remoteMine];
        } else {
            this.storageRoom.memory.remoteMines.push(remoteMine);
        }
    }
}
