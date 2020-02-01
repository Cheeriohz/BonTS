//reservedBuilds
import _ from "lodash";
import { buildProjectCreator } from "./building.buildProjectCreator";
import { GeneralBuilding } from "./building.general";
import { Visualizer } from "./building.visualizer";

export class LabExpansion extends GeneralBuilding {
    private spawn!: StructureSpawn;
    private rt!: RoomTerrain;
    private goodPositions: RoomPosition[] = [];
    private firstLeaf: BuildOrder[] | null = null;

    constructor(spawn: StructureSpawn) {
        super();
        this.spawn = spawn;
        this.rt = spawn.room.getTerrain();
    }

    public enqueueLabProject(labsToBuild: number): boolean {
        // First check to see if we have any labs pre-determined.
        if (this.spawn.room.memory.reservedBuilds) {
            const reservedBuilds = _.remove(this.spawn.room.memory.reservedBuilds, bo => bo.type === STRUCTURE_LAB);
            if (reservedBuilds.length > 0) {
                this.buildPredeterminedLabs(reservedBuilds, labsToBuild);
                return true;
            }
        }
        // No predetermined labs, determine 10 lab placements and supporting roads.
        const storage = this.spawn.room.storage;
        if (storage) {
            const buildPositions = this.determineBuildPositions(storage.pos);
            if (buildPositions.length > 0) {
                this.createBuildProject(buildPositions, labsToBuild);
                return true;
            } else {
                return false;
            }
        } else {
            console.log("Don't need to build labs before we build a storage.");
            return false;
        }
    }

    private buildPredeterminedLabs(reservedBuilds: BuildOrder[], labsToBuild: number) {
        const newLabs: BuildOrder[] = _.slice(reservedBuilds, 0, labsToBuild);
        reservedBuilds = _.takeRight(reservedBuilds, reservedBuilds.length - labsToBuild);
        this.spawn.room.memory.reservedBuilds = _.compact(
            _.concat(this.spawn.room.memory.reservedBuilds, reservedBuilds)
        );
        const bpc: buildProjectCreator = new buildProjectCreator(this.spawn.room, this.spawn);
        bpc.passThroughCreate(newLabs);
    }

    private createBuildProject(buildOrders: BuildOrder[], labsToBuild: number) {
        let buildProjectOrders: BuildOrder[] = [];
        const newRoads = _.uniq(_.remove(buildOrders, bo => bo.type === STRUCTURE_ROAD));
        if (newRoads.length > 0) {
            buildProjectOrders = _.concat(buildProjectOrders, newRoads);
        }
        const newLabs = _.slice(buildOrders, 0, labsToBuild);
        if (newLabs.length > 0) {
            buildProjectOrders = _.concat(buildProjectOrders, newLabs);
            buildOrders = _.takeRight(buildOrders, buildOrders.length - labsToBuild);
            const bpc: buildProjectCreator = new buildProjectCreator(this.spawn.room, this.spawn);
            bpc.passThroughCreate(buildProjectOrders);
            this.cacheRemainingLabs(buildOrders);
        } else {
            console.log("Uhh... we didn't actually add any labs.");
        }
        return;
    }

    private determineBuildPositions(pos: RoomPosition): BuildOrder[] {
        const allRoadPositionsForConsideration = this.collectRoads(pos);
        if (allRoadPositionsForConsideration) {
            this.collectPositions(pos);
            while (Game.cpu.limit - Game.cpu.getUsed() > 4) {
                let currentProspect: RoomPosition | null = this.findOpportunity(
                    pos,
                    allRoadPositionsForConsideration,
                    1
                );
                if (currentProspect) {
                    console.log(JSON.stringify(currentProspect));
                    const plottedBuilds = this.plot(currentProspect, allRoadPositionsForConsideration);
                    if (plottedBuilds.length > 0) {
                        if (this.firstLeaf) {
                            return _.concat(this.firstLeaf, plottedBuilds);
                        } else {
                            this.firstLeaf = plottedBuilds;
                        }
                    } else {
                        _.remove(this.goodPositions, rp => {
                            return rp.x === currentProspect?.x && rp.y === currentProspect?.y;
                        });
                    }
                } else {
                    return [];
                }
            }
        } else {
            console.log("Why on earth did we build a storage with no access?");
        }
        return [];
    }

    private cacheRemainingLabs(buildOrders: BuildOrder[]) {
        if (!this.spawn.room.memory.reservedBuilds) {
            this.spawn.room.memory.reservedBuilds = buildOrders;
        } else {
            this.spawn.room.memory.reservedBuilds = _.concat(this.spawn.room.memory.reservedBuilds, buildOrders);
        }
    }

    private findOpportunity(
        origin: RoomPosition,
        allRoadPositionsForConsideration: RoomPosition[],
        roadRange: number
    ): RoomPosition | null {
        // Traverse the roads until we find a position with at least one neighbor available.
        let currentProspect: RoomPosition | null = origin.findClosestByRange(this.goodPositions);
        if (currentProspect) {
            // check to see if we can locate a neighboring road.
            const neighboringRoads = currentProspect.findInRange(allRoadPositionsForConsideration, roadRange);
            if (neighboringRoads.length > 0) {
                return currentProspect;
            } else {
                //this.badPositions.push(currentProspect);
                _.remove(this.goodPositions, rp => {
                    return rp.x === currentProspect?.x && rp.y === currentProspect?.y;
                });
                return this.findOpportunity(origin, allRoadPositionsForConsideration, roadRange);
            }
        } else if (roadRange < 10) {
            return this.findOpportunity(origin, allRoadPositionsForConsideration, roadRange + 1);
        } else {
            console.log("No remaining prospects?");
            return null;
        }
    }

    private plot(sp: RoomPosition, allRoadPositionsForConsideration: RoomPosition[]): BuildOrder[] {
        let newRoadPositions: RoomPosition[] = [];
        let p: RoomPosition = sp;
        for (let orientDirection = 0; orientDirection < 10; orientDirection++) {
            if ([2, 4, 6, 8].includes(orientDirection)) {
                const labPositions = this.tryDirection(
                    sp,
                    <DirectionConstant>orientDirection,
                    newRoadPositions,
                    allRoadPositionsForConsideration
                );
                if (labPositions.length > 0) {
                    let newBuildOrders: BuildOrder[] = [];
                    for (const road of newRoadPositions) {
                        newBuildOrders.push({ x: road.x, y: road.y, type: STRUCTURE_ROAD });
                        _.remove(this.goodPositions, rp => {
                            return rp.x === road.x && rp.y === road.y;
                        });
                    }
                    for (const lab of labPositions) {
                        newBuildOrders.push({ x: lab.x, y: lab.y, type: STRUCTURE_LAB });
                        _.remove(this.goodPositions, rp => {
                            return rp.x === lab.x && rp.y === lab.y;
                        });
                    }
                    return newBuildOrders;
                }
            }
        }
        return [];
    }

    private tryDirection(
        sp: RoomPosition,
        orientDirection: DirectionConstant,
        newRoadPositions: RoomPosition[],
        allRoadPositionsForConsideration: RoomPosition[]
    ): RoomPosition[] {
        //console.log(`Direction: ${orientDirection}`);
        const fRP = this.getRoomPositionForDirection(sp, orientDirection);
        if (fRP && _.find(this.goodPositions, { x: fRP.x, y: fRP.y })) {
            const sRP = this.getRoomPositionForDirection(fRP, orientDirection);
            if (sRP && _.find(this.goodPositions, { x: sRP.x, y: sRP.y })) {
                const dc = this.tryDirectionClockwise(sp, fRP, orientDirection, [this.goodPositions]);
                if (dc) {
                    const labPositions = _.concat([sp, fRP, sRP], dc);
                    if (
                        this.paveCounterClockwise(
                            sp,
                            fRP,
                            newRoadPositions,
                            allRoadPositionsForConsideration,
                            orientDirection
                        )
                    ) {
                        return labPositions;
                    }
                }
                const dcc = this.tryDirectionCounterClockwise(sp, fRP, orientDirection, [this.goodPositions]);
                if (dcc) {
                    const labPositions = _.concat([sp, fRP, sRP], dcc);
                    if (
                        this.paveClockwise(sp, fRP, newRoadPositions, allRoadPositionsForConsideration, orientDirection)
                    ) {
                        return labPositions;
                    }
                }
            }
        }
        return [];
    }

    private paveClockwise(
        origin: RoomPosition,
        second: RoomPosition,
        newRoadPositions: RoomPosition[],
        allRoadPositionsForConsideration: RoomPosition[],
        orientDirection: DirectionConstant
    ): boolean {
        const clockWiseRoads = this.tryDirectionClockwise(origin, second, orientDirection, [
            this.goodPositions,
            allRoadPositionsForConsideration
        ]);
        if (clockWiseRoads) {
            for (const road of clockWiseRoads) {
                // Determined adding the road was quicker then checking for existence.
                allRoadPositionsForConsideration.push(road);
                console.log(`adding road: ${JSON.stringify(road)}`);
                console.log(JSON.stringify(newRoadPositions));
                newRoadPositions.push(road);
                console.log(JSON.stringify(newRoadPositions));
            }
            return true;
        }
        return false;
    }

    private paveCounterClockwise(
        origin: RoomPosition,
        second: RoomPosition,
        newRoadPositions: RoomPosition[],
        allRoadPositionsForConsideration: RoomPosition[],
        orientDirection: DirectionConstant
    ): boolean {
        const counterClockWiseRoads = this.tryDirectionCounterClockwise(origin, second, orientDirection, [
            this.goodPositions,
            allRoadPositionsForConsideration
        ]);
        if (counterClockWiseRoads) {
            for (const road of counterClockWiseRoads) {
                // Determined adding the road was quicker then checking for existence.
                allRoadPositionsForConsideration.push(road);
                newRoadPositions.push(road);
            }
            return true;
        }
        return false;
    }

    private tryDirectionClockwise(
        sp: RoomPosition,
        fRP: RoomPosition,
        orientDirection: DirectionConstant,
        comparators: RoomPosition[][]
    ): RoomPosition[] | null {
        const searchArray = _.flatten(comparators);
        const orientDirectionClockwise = this.directionClockwise(<DirectionConstant>orientDirection);
        const tRP = this.getRoomPositionForDirection(sp, orientDirectionClockwise);
        if (tRP && _.find(searchArray, { x: tRP.x, y: tRP.y })) {
            const lRP = this.getRoomPositionForDirection(fRP, orientDirectionClockwise);
            if (lRP && _.find(searchArray, { x: lRP.x, y: lRP.y })) {
                return [tRP, lRP];
            }
        }
        return null;
    }

    private tryDirectionCounterClockwise(
        sp: RoomPosition,
        fRP: RoomPosition,
        orientDirection: DirectionConstant,
        comparators: RoomPosition[][]
    ): RoomPosition[] | null {
        const searchArray = _.flatten(comparators);
        const orientDirectionCounterClockwise = this.directionCounterClockwise(<DirectionConstant>orientDirection);
        const tRP = this.getRoomPositionForDirection(sp, orientDirectionCounterClockwise);
        if (tRP && _.find(searchArray, { x: tRP.x, y: tRP.y })) {
            const lRP = this.getRoomPositionForDirection(fRP, orientDirectionCounterClockwise);
            if (lRP && _.find(searchArray, { x: lRP.x, y: lRP.y })) {
                return [tRP, lRP];
            }
        }
        return null;
    }

    private collectRoads(pos: RoomPosition): RoomPosition[] | null {
        let allRoads = pos.findInRange(FIND_STRUCTURES, 9, {
            filter: s => {
                return s.structureType === STRUCTURE_ROAD;
            }
        });
        if (allRoads.length > 0) {
            return _.map(allRoads, r => r.pos);
        } else {
            return null;
        }
    }

    private collectPositions(pos: RoomPosition): void {
        for (let x = -10; x < 11; x++) {
            for (let y = -10; y < 11; y++) {
                if (x != 0 || y != 0) {
                    const nX = pos.x + x;
                    const nY = pos.y + y;
                    if (nX > -1 && nX < 50 && nY > -1 && nY < 50) {
                        // valid position
                        if (
                            this.rt.get(nX, nY) !== TERRAIN_MASK_WALL &&
                            !this.existingDisqualifyingStructure(nX, nY, this.spawn.room)
                        ) {
                            this.goodPositions.push(new RoomPosition(nX, nY, this.spawn.room.name));
                        }
                    }
                }
            }
        }
    }
}
