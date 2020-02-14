import { GeneralBuilding } from "./base/building.general";
import _ from "lodash";
import { buildProjectCreator } from "./building.buildProjectCreator";

export class TowerAddition extends GeneralBuilding {
    private storagePos!: RoomPosition;
    private spawn!: StructureSpawn;
    private room!: Room;
    private allStructurePositions: RoomPosition[] = [];
    private towers?: RoomPosition[];

    constructor(spawn: StructureSpawn, room: Room) {
        super();
        this.spawn = spawn;
        this.room = room;
        if (!this.room.storage) {
            const storage = _.first(_.filter(this.room.memory.reservedBuilds!, rb => rb.type === STRUCTURE_STORAGE));
            if (!storage) {
                throw "Attempting to build a tower before plotting a storage";
            } else {
                this.storagePos = new RoomPosition(storage.x, storage.y, room.name);
            }
        } else {
            this.storagePos = this.room.storage.pos;
        }
        if (!this.room.memory.structureDistanceTransform) {
            this.room.memory.structureDistanceTransform = this.distanceTransformOccupied(
                this.room.name,
                this.populateAllStructures(this.room),
                false
            ).serialize();
        }
        this.towers = _.map(
            room.find<Structure>(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_TOWER }),
            t => t.pos
        );
    }

    public addTower(): boolean {
        if (this.room.memory.reservedBuilds) {
            const reservedTowers = _.filter(this.room.memory.reservedBuilds, rb => rb.type === STRUCTURE_TOWER);

            if (reservedTowers && reservedTowers.length > 0) {
                const reservedTower = _.first(reservedTowers);
                if (reservedTower) {
                    _.remove(this.room.memory.reservedBuilds, rb => {
                        return rb.x === reservedTower.x && rb.y === reservedTower.y;
                    });
                    const bpc: buildProjectCreator = new buildProjectCreator(this.room, this.spawn);
                    bpc.passThroughCreate([{ x: reservedTower.x, y: reservedTower.y, type: reservedTower.type }]);
                    return true;
                }
            } else {
                this.reserveTowers();
                return false;
            }
        }

        return false;
    }

    private reserveTowers() {
        if (this.storagePos) {
            const sDT = PathFinder.CostMatrix.deserialize(this.room.memory.structureDistanceTransform!);

            for (const card of this.cardinals) {
                if (sDT.get(this.storagePos.x + 2 * card[0], this.storagePos.y + 2 * card[1]) >= 1) {
                    // We have a spot for the towers.
                    const buildOrders: BuildOrder[] = [];
                    buildOrders.push({
                        x: this.storagePos.x + 2 * card[0],
                        y: this.storagePos.y + 2 * card[1],
                        type: STRUCTURE_TOWER
                    });
                    const clockWise: RoomPosition | null = this.getRoomPositionForDirection(
                        this.storagePos,
                        this.directionClockwise(this.getDirectionConstant(card[0], card[1]))
                    );
                    if (clockWise) {
                        buildOrders.push({
                            x: clockWise.x,
                            y: clockWise.y,
                            type: STRUCTURE_TOWER
                        });
                    }
                    const counterClockWise: RoomPosition | null = this.getRoomPositionForDirection(
                        this.storagePos,
                        this.directionCounterClockwise(this.getDirectionConstant(card[0], card[1]))
                    );
                    if (counterClockWise) {
                        buildOrders.push({
                            x: counterClockWise.x,
                            y: counterClockWise.y,
                            type: STRUCTURE_TOWER
                        });
                    }
                    if (this.room.memory.reservedBuilds) {
                        this.room.memory.reservedBuilds = _.concat(this.room.memory.reservedBuilds, buildOrders);
                    } else {
                        this.room.memory.reservedBuilds = buildOrders;
                    }
                    return;
                }
            }
        }
    }
}
