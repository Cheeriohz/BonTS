import { GeneralBuilding } from "./base/building.general";
import _ from "lodash";
import { buildProjectCreator } from "./building.buildProjectCreator";

export class LinkAddition extends GeneralBuilding {
    private containerPosA!: RoomPosition | null;
    private containerPosB!: RoomPosition | null;
    private spawn!: StructureSpawn;
    private room!: Room;

    constructor(spawn: StructureSpawn, room: Room) {
        super();
        this.spawn = spawn;
        this.room = room;
        if (room.memory.containerMap && room.memory.containerMap.length > 0) {
            const containerAMap = _.first(room.memory.containerMap);
            if (containerAMap) {
                const containerA: StructureContainer | null = Game.getObjectById(containerAMap.id!);
                if (containerA) {
                    this.containerPosA = containerA.pos;
                }
            }

            if (this.room.memory.containerMap!.length > 1) {
                const containerBMap = _.last(room.memory.containerMap);
                if (containerBMap) {
                    const containerB: StructureContainer | null = Game.getObjectById(containerBMap.id!);
                    if (containerB) {
                        this.containerPosB = containerB.pos;
                    }
                }
            }
        }
        if (!this.room.memory.structureDistanceTransform) {
            this.room.memory.structureDistanceTransform = this.distanceTransformOccupied(
                this.room.name,
                this.populateAllStructures(this.room),
                false
            ).serialize();
        }
    }

    public addAndReserveLinks(linkCount: number): boolean {
        if (this.room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_LINK }).length < linkCount) {
            if (!this.room.memory.buildProjects || this.room.memory.buildProjects.length === 0) {
                if (_.filter(this.room.memory.reservedBuilds, rb => rb.type === STRUCTURE_LINK).length === 0) {
                    this.reservelinks();
                }
                for (let i = 0; i < linkCount; i++) {
                    if (!this.addlink()) {
                        return false;
                    }
                }
                delete this.room.memory.structureDistanceTransform;
                return true;
            }
        } else {
            return true;
        }
        return false;
    }

    public addlink(): boolean {
        if (this.room.memory.reservedBuilds) {
            const reservedlinks = _.filter(this.room.memory.reservedBuilds, rb => rb.type === STRUCTURE_LINK);

            if (reservedlinks && reservedlinks.length > 0) {
                const reservedlink = _.first(reservedlinks);
                if (reservedlink) {
                    _.remove(this.room.memory.reservedBuilds, rb => {
                        return rb.x === reservedlink.x && rb.y === reservedlink.y;
                    });
                    const bpc: buildProjectCreator = new buildProjectCreator(this.room, this.spawn);
                    bpc.passThroughCreate([{ x: reservedlink.x, y: reservedlink.y, type: reservedlink.type }]);
                    return true;
                }
            } else {
                this.reservelinks();
                return false;
            }
        }

        return false;
    }

    private reservelinks() {
        const buildOrders: BuildOrder[] = [];
        const sDT = PathFinder.CostMatrix.deserialize(this.room.memory.structureDistanceTransform!);
        console.log("a");
        if (this.containerPosA) {
            console.log("b");
            console.log(JSON.stringify(this.containerPosA));
            const boundA = GeneralBuilding.getRoomPositionForDirection(this.containerPosA, TOP_RIGHT)!;
            const boundB = GeneralBuilding.getRoomPositionForDirection(this.containerPosA, BOTTOM_LEFT)!;
            console.log(JSON.stringify(boundA));
            console.log(JSON.stringify(boundB));
            const linkA = this.traverseDistanceTransformBoundedDeserialized(this.containerPosA, sDT, 1, boundA, boundB);
            console.log("c");
            if (linkA) {
                buildOrders.push({ x: linkA.x, y: linkA.y, type: STRUCTURE_LINK });
            }
            console.log("d");
        }
        if (this.room.controller) {
            console.log("e");
            const cont = this.traverseDistanceTransformBoundedDeserialized(
                this.room.controller.pos,
                sDT,
                1,
                GeneralBuilding.getRoomPositionForDirection(this.room.controller.pos, TOP_RIGHT)!,
                GeneralBuilding.getRoomPositionForDirection(this.room.controller.pos, BOTTOM_LEFT)!
            );
            console.log("f");
            if (cont) {
                console.log("g");
                buildOrders.push({ x: cont.x, y: cont.y, type: STRUCTURE_LINK });
            }
        }
        if (this.containerPosB) {
            console.log("h");
            const linkB = this.traverseDistanceTransformBoundedDeserialized(
                this.containerPosB,
                sDT,
                1,
                GeneralBuilding.getRoomPositionForDirection(this.containerPosB, TOP_RIGHT)!,
                GeneralBuilding.getRoomPositionForDirection(this.containerPosB, BOTTOM_LEFT)!
            );
            if (linkB) {
                buildOrders.push({ x: linkB.x, y: linkB.y, type: STRUCTURE_LINK });
            }
        }
        if (buildOrders.length > 0) {
            if (this.room.memory.reservedBuilds) {
                this.room.memory.reservedBuilds = _.concat(this.room.memory.reservedBuilds, buildOrders);
            } else {
                this.room.memory.reservedBuilds = buildOrders;
            }
        }
        return;
    }
}
