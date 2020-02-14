import { GeneralBuilding } from "./base/building.general";
import _ from "lodash";
import { buildProjectCreator } from "./building.buildProjectCreator";

export class StorageAddition extends GeneralBuilding {
    private spawn!: StructureSpawn;
    private room!: Room;
    private allStructurePositions: RoomPosition[] = [];

    constructor(spawn: StructureSpawn, room: Room) {
        super();
        this.spawn = spawn;
        this.room = room;
        if (!this.room.memory.structureDistanceTransform) {
            this.allStructurePositions = this.populateAllStructures(this.room);
            this.room.memory.structureDistanceTransform = this.distanceTransformManhattanOccupied(
                this.room.name,
                this.allStructurePositions,
                false
            ).serialize();
        }
    }

    public reserveStorage(): boolean {
        if (this.room.memory.reservedBuilds) {
            const reservedStorage = _.find(this.room.memory.reservedBuilds, rb => rb.type === STRUCTURE_STORAGE);
            if (reservedStorage) {
                return true;
            }
        }

        if (this.room.memory.containerMap && this.room.memory.containerMap.length > 0) {
            const mapA = _.first(this.room.memory.containerMap);
            const mapB = _.last(this.room.memory.containerMap);
            if (mapA?.id && mapB?.id) {
                const storageBuild = this.findBoundedStorageLocation(mapA.id, mapB.id);
                if (storageBuild) {
                    this.spawn.room.memory.reservedBuilds!.push(storageBuild);
                    return true;
                }
            }
        } else if (this.room.memory.dropMap && this.room.memory.dropMap.length > 0) {
            const mapA = _.first(this.room.memory.dropMap);
            const mapB = _.last(this.room.memory.dropMap);
            if (mapA?.id && mapB?.id) {
                const storageBuild = this.findBoundedStorageLocation(mapA.id, mapB.id);
                if (storageBuild) {
                    this.spawn.room.memory.reservedBuilds!.push(storageBuild);
                    return true;
                }
            }
        } else if (
            this.room.memory.dropMap &&
            this.room.memory.dropMap.length === 1 &&
            this.room.memory.containerMap &&
            this.room.memory.containerMap.length === 1
        ) {
            const mapA = _.first(this.room.memory.dropMap);
            const mapB = _.first(this.room.memory.containerMap);
            if (mapA?.id && mapB?.id) {
                const storageBuild = this.findBoundedStorageLocation(mapA.id, mapB.id);
                if (storageBuild) {
                    this.spawn.room.memory.reservedBuilds!.push(storageBuild);
                    return true;
                }
            }
        }
        return false;
    }

    public buildStorageFromReservedMemory(): boolean {
        const storageBuild = _.first(_.filter(this.room.memory.reservedBuilds!, rb => rb.type === STRUCTURE_STORAGE));
        if (!storageBuild) {
            this.reserveStorage();
            return false;
        }
        const bpc = new buildProjectCreator(this.room, this.spawn);
        bpc.passThroughCreate([storageBuild]);
        return true;
    }

    private findBoundedStorageLocation(idA: string, idB: string): BuildOrder | null {
        const structA: Structure | null = Game.getObjectById(idA);
        const structB: Structure | null = Game.getObjectById(idB);
        if (structA && structB) {
            const aPos = structA.pos;
            const bPos = structB.pos;

            const storePos: RoomPosition | null = this.traverseDistanceTransformBounded(
                aPos,
                this.room.memory.structureDistanceTransform!,
                3,
                bPos,
                this.room.controller!.pos
            );

            if (storePos) {
                this.cleanDistanceTransformsForRoom(this.room);
                return { x: storePos.x, y: storePos.y, type: STRUCTURE_STORAGE };
            }
        }
        return null;
    }
}
