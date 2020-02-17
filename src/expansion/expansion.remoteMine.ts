import { ExpansionCosting } from "./expansion.expansionCosting";
import { CreepRequester } from "spawning/manager.creepRequester";
import _ from "lodash";
import { buildProjectCreator } from "building/building.buildProjectCreator";
import { ErrorMapper } from "utils/ErrorMapper";
import { BuildProjectEnum } from "building/interfaces/building.enum";
import { ReservationManager } from "remote/manager.remote.reservation";
import { CreepRole } from "enums/enum.roles";

export class RemoteMineExpansion {
    private vein!: Id<Source>;
    private costing!: ExpansionCosting;
    private storage!: RoomPosition;
    private storageRoom!: Room;
    private source!: Source | null;
    private spawn!: StructureSpawn;
    private pathingLookup: Dictionary<PathStep[][]> = {};

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

    public expandToLocation(): boolean {
        this.costing.translateFullPathToRetainableRoomPaths();
        if (this.createBuildProjects()) {
            this.persistPathingToMemory();
            this.enlistGuard();
            return true;
        }
        return false;
    }

    private createBuildProjects(): boolean {
        let success: boolean = true;
        if (!this.spawn.room.memory.buildProjects) {
            this.spawn.room.memory.buildProjects = [];
        }
        for (let index = 0; index < this.costing.translatedPaths.length - 1; index++) {
            const translatedPath = this.costing.translatedPaths[index];
            if (
                this.spawn.room.memory.buildProjects &&
                !_.find(this.spawn.room.memory.buildProjects, bp => {
                    return (
                        bp.roomName === translatedPath.roomName &&
                        bp.projectType === BuildProjectEnum.RemoteContainerExpansion
                    );
                })
            ) {
                let clonedPath = _.cloneDeep(translatedPath.path);
                const room: Room | undefined = Game.rooms[translatedPath.roomName];
                if (!room) {
                    // Need room visibility.
                    const cr: CreepRequester = new CreepRequester(this.spawn);
                    cr.RequestScoutToRoom(translatedPath.roomName);
                    const bpc: buildProjectCreator = new buildProjectCreator(room, this.spawn, translatedPath.roomName);
                    bpc.createBuildProjectHighway(clonedPath, BuildProjectEnum.RemoteContainerExpansion);
                } else {
                    const bpc: buildProjectCreator = new buildProjectCreator(room, this.spawn);
                    bpc.createBuildProjectHighway(clonedPath, BuildProjectEnum.RemoteContainerExpansion);
                }
            }
        }

        const translatedPath = _.last(this.costing.translatedPaths);
        if (translatedPath) {
            if (
                this.spawn.room.memory.buildProjects &&
                !_.find(this.spawn.room.memory.buildProjects, bp => bp.roomName === translatedPath.roomName)
            ) {
                let clonedPath = _.cloneDeep(translatedPath!.path);
                const room: Room | undefined = Game.rooms[translatedPath!.roomName];
                if (!room) {
                    // Need room visibility.
                    const cr: CreepRequester = new CreepRequester(this.spawn);
                    cr.RequestScoutToRoom(translatedPath!.roomName);
                    success = false;
                } else {
                    const bpc: buildProjectCreator = new buildProjectCreator(room, this.spawn);
                    bpc.createBuildProjectContainerExpansionLegacy(
                        clonedPath,
                        BuildProjectEnum.RemoteContainerExpansion
                    );
                }
            }
            return success;
        } else {
            console.log("No path detected.");
            return false;
        }
    }

    private persistPathingToMemory() {
        if (!this.storageRoom.memory.remoteMines) {
            this.storageRoom.memory.remoteMines = new Array<RemoteMine>();
        }

        for (const rpr of this.costing.translatedPaths) {
            const rprReverse = _.find(this.costing.translatedPathsReversed, rprR => {
                return rprR.roomName === rpr.roomName;
            });
            if (rprReverse) {
                this.pathingLookup[rpr.roomName] = [rpr.path, rprReverse.path];
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
            pathingLookup: this.pathingLookup,
            roomName: this.costing.getDestinationRoomName(),
            reserved: false
        };

        // Check if we need to reserve.
        if (ReservationManager.shouldReserve(remoteMine, this.spawn)) {
            remoteMine.reserved = true;
        }

        if (this.storageRoom.memory.remoteMines.length === 0) {
            this.storageRoom.memory.remoteMines = [remoteMine];
        } else {
            this.storageRoom.memory.remoteMines.push(remoteMine);
        }

        if (this.storageRoom.memory.remoteMines.length > 1) {
            // Ensure we have a dropper enabled in the room template if we have more than one remote mine
            Memory.roleRoomMap[this.storageRoom.name][CreepRole.topper] = Math.max(
                Memory.roleRoomMap[this.storageRoom.name][CreepRole.topper],
                1
            );
        }
    }

    public enlistGuard(roomName?: string) {
        const roomToGuard = roomName ?? this.costing.getDestinationRoomName();

        let remotePatrols = this.collectRemotePatrols();
        const selectedPatrol = _.first(
            _.sortBy(remotePatrols, rp => Game.map.getRoomLinearDistance(rp.roomName, roomToGuard))
        );
        if (selectedPatrol && Game.map.getRoomLinearDistance(selectedPatrol.roomName, roomToGuard) <= 2) {
            selectedPatrol.checkRooms.push(roomToGuard);
        } else {
            if (!this.spawn.room.memory.remotePatrols) {
                this.spawn.room.memory.remotePatrols = [];
            }
            this.spawn.room.memory.remotePatrols.push({
                roomName: roomToGuard,
                checkRooms: [roomToGuard],
                knights: null,
                count: 1,
                pathingLookup: {}
            });
        }
    }

    private collectRemotePatrols(): RemotePatrol[] {
        let remotePatrols: RemotePatrol[] = [];

        for (const spawn of _.uniqBy(_.values(Game.spawns), s => s.room.name)) {
            if (spawn.room.memory.remotePatrols) {
                remotePatrols = _.concat(remotePatrols, spawn.room.memory.remotePatrols);
            }
        }
        return remotePatrols;
    }
}
