//reservedBuilds
import _ from "lodash";
import { buildProjectCreator } from "./building.buildProjectCreator";
import { GeneralBuilding } from "./base/building.general";
import { GetSources } from "caching/manager.sourceSelector";
import { buildEmptydropMap } from "caching/caching.dropPickupCacher";
import { BuildProjectEnum } from "./interfaces/building.enum";

export class ExtensionAddition extends GeneralBuilding {
    private spawns!: StructureSpawn[];
    private room!: Room;
    private builtExtensions: RoomPosition[] = [];
    private allStructurePositions: RoomPosition[] = [];
    private allRoads: RoomPosition[] = [];
    private extensionsToPlan: number = 0;
    private sources: Source[] = [];
    private buildRoads: boolean = false;
    private boundAdd: number;
    private resolvePartials?: boolean = false;
    private noPartials?: boolean;

    constructor(spawns: StructureSpawn[], buildRoads: boolean, boundAdd: number, resolvePartials?: boolean) {
        super();
        this.spawns = spawns;
        this.room = _.first(spawns)!.room;
        this.buildRoads = buildRoads;
        this.boundAdd = boundAdd;
        this.resolvePartials = resolvePartials;
    }

    //* Re-Run support
    public alreadyProcessedSuccessfully(extensionCountTarget: number): number {
        for (const spawn of this.spawns) {
            if (spawn.room.memory.buildProjects && spawn.room.memory.buildProjects.length > 0) {
                return 2;
            }
        }

        let totalCount = 0;
        const reservedBuilds = _.filter(this.room.memory.reservedBuilds, bo => bo.type === STRUCTURE_EXTENSION);
        if (reservedBuilds) {
            totalCount += reservedBuilds.length;
        }
        this.builtExtensions = _.map(
            _.filter(_.values(Game.structures), s => {
                return s.structureType === STRUCTURE_EXTENSION && s.room.name === this.room.name;
            }),
            s => s.pos
        );
        if (this.builtExtensions) {
            totalCount += this.builtExtensions.length;
        }
        const extensionsBeingBuilt = _.filter(_.values(Game.constructionSites), cs => {
            return cs.room && cs.room.name === this.room.name && cs.structureType === STRUCTURE_EXTENSION;
        });
        if (extensionsBeingBuilt) {
            totalCount += extensionsBeingBuilt.length;
        }

        if (totalCount < extensionCountTarget) {
            this.extensionsToPlan = extensionCountTarget - totalCount;
            return 0;
        }
        return 1;
    }

    //* Entry Points
    public enqueExtensionsBootstrapProject(): boolean {
        if (!this.room.memory.dropMap) {
            this.room.memory.dropMap = [];
            buildEmptydropMap(this.room.memory.dropMap, this.room);
        }

        // Because these processes are kind of slow, this should be carried out scarcely.
        if (!this.room.memory.structureDistanceTransform) {
            this.room.memory.structureDistanceTransform = this.distanceTransformManhattanOccupied(
                this.room.name,
                this.populateAllStructures(this.room),
                false
            ).serialize();
            return false;
        }
        // Because these processes are kind of slow, this should be carried out scarcely.
        if (!this.room.memory.roadAgnosticDistanceTransform) {
            this.room.memory.roadAgnosticDistanceTransform = this.distanceTransformManhattanOccupied(
                this.room.name,
                this.populateAllStructuresExceptRoads(this.room),
                false
            ).serialize();
            return false;
        }
        return this.tryPlaceBootstrap();
    }

    public enqueueExtensionsProject(): boolean {
        this.pullSources();
        if (this.sources.length > 0) {
        } else {
            console.log("Umm, this room has no sources");
            return false;
        }

        this.allStructurePositions = this.populateAllStructures(this.room);
        this.collectRoads();
        const buildPositions = this.determineBuildPositions();
        if (buildPositions.length > 0) {
            this.createBuildProject(buildPositions);
            return this.extensionsToPlan === 0;
        } else {
            return false;
        }
    }

    //* Handoff Logic
    private createBuildProject(buildOrders: BuildOrder[]) {
        if (this.buildRoads) {
            // TODO  Balance workload.
            const bpc: buildProjectCreator = new buildProjectCreator(this.room, this.spawns[0]);
            bpc.passThroughCreateMasked(buildOrders, BuildProjectEnum.ExtensionBootstrap);
            // Clear out the distance transforms;
            this.cleanDistanceTransformsForRoom(this.room);
        } else {
            let cacheOrders: BuildOrder[] = _.uniq(_.remove(buildOrders, bo => bo.type === STRUCTURE_ROAD));
            const bpc: buildProjectCreator = new buildProjectCreator(this.room, this.spawns[0]);
            bpc.passThroughCreateMasked(buildOrders, BuildProjectEnum.ExtensionBootstrap);
            this.cacheRoads(cacheOrders);
            this.cleanDistanceTransformsForRoom(this.room);
        }
    }

    //* Specific Placement Determination Logic Entries
    private tryPlaceBootstrap(): boolean {
        const dropA: AssignmentPosition | undefined = _.first(this.room.memory.dropMap!);
        const dropB: AssignmentPosition | undefined = _.last(this.room.memory.dropMap!);
        if (dropA && dropB) {
            const dPosA = new RoomPosition(dropA.x, dropA.y, this.room.name);
            const dPosB = new RoomPosition(dropB.x, dropB.y, this.room.name);
            const cPos: RoomPosition = this.room.controller!.pos;
            const closest = cPos.findClosestByPath([dPosA, dPosB]);
            let buildOrders: BuildOrder[] = [];
            if (dPosA === closest) {
                if (this.bootStrapPlace(dPosA, 3, buildOrders)) {
                    if (this.bootStrapPlace(dPosB, 2, buildOrders)) {
                        this.createBuildProject(buildOrders);
                        return true;
                    }
                }
            } else {
                if (this.bootStrapPlace(dPosB, 3, buildOrders)) {
                    if (this.bootStrapPlace(dPosA, 2, buildOrders)) {
                        this.createBuildProject(buildOrders);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private bootStrapPlace(pos: RoomPosition, count: Number, builds: BuildOrder[]): boolean {
        const center: RoomPosition | null = this.traverseDistanceTransformWithCheck(
            pos,
            this.room.memory.structureDistanceTransform!,
            2,
            this.room.memory.roadAgnosticDistanceTransform!,
            3
        );
        if (center) {
            if (count === 3) {
                builds.push(this.createExtensionBuildOrder(center.x, center.y));
            }
            if (pos.x > center.x) {
                builds.push(this.createExtensionBuildOrder(center.x + 1, center.y));
            } else {
                builds.push(this.createExtensionBuildOrder(center.x - 1, center.y));
            }
            if (pos.y > center.y) {
                builds.push(this.createExtensionBuildOrder(center.x, center.y + 1));
            } else {
                builds.push(this.createExtensionBuildOrder(center.x, center.y - 1));
            }
            // Not using concat because I believe it loses scope. Might be wrong;
            for (const bo of this.buildRoadDiamond(center.x, center.y - 2)) {
                builds.push(bo);
            }
            // console.log(`buildOrders: ${JSON.stringify(builds)}`);
            return true;
        }
        return false;
    }

    private determineBuildPositions(): BuildOrder[] {
        let buildOrders: BuildOrder[] = [];
        while (this.extensionsToPlan > 0 && Game.cpu.limit - Game.cpu.getUsed() > 4) {
            if (this.noPartials || !this.resolvePartials) {
                const GreenfieldBuildOrders = this.determineGreenFieldSite();
                if (GreenfieldBuildOrders.length > 0) {
                    buildOrders = _.concat(buildOrders, GreenfieldBuildOrders);
                }
            } else {
                const partialBuildOrders = this.determinePartials();
                if (partialBuildOrders.length > 0) {
                    buildOrders = partialBuildOrders;
                }
            }
        }
        return buildOrders;
    }

    private determineGreenFieldSite(): BuildOrder[] {
        // Because these processes are kind of slow, return early so we can check our time.
        if (!this.room.memory.structureDistanceTransform) {
            this.room.memory.structureDistanceTransform = this.distanceTransformManhattanOccupied(
                this.room.name,
                this.populateAllStructures(this.room),
                false
            ).serialize();
            return [];
        }
        // Because these processes are kind of slow, return early so we can check our time.
        if (!this.room.memory.roadAgnosticDistanceTransform) {
            this.room.memory.roadAgnosticDistanceTransform = this.distanceTransformManhattanOccupied(
                this.room.name,
                this.populateAllStructuresExceptRoads(this.room),
                false
            ).serialize();
            return [];
        }
        if (this.room.memory.containerMap && this.room.memory.containerMap.length > 0) {
            const mapA = _.first(this.room.memory.containerMap);
            const mapB = _.last(this.room.memory.containerMap);
            if (mapA?.id && mapB?.id) {
                return this.findOptimalGreenfieldForTwoSources(mapA.id, mapB.id);
            }
        } else if (this.room.memory.dropMap && this.room.memory.dropMap.length > 0) {
            const mapA = _.first(this.room.memory.dropMap);
            const mapB = _.last(this.room.memory.dropMap);
            if (mapA?.id && mapB?.id) {
                return this.findOptimalGreenfieldForTwoSources(mapA.id, mapB.id);
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
                return this.findOptimalGreenfieldForTwoSources(mapA.id, mapB.id);
            }
        }

        return [];
    }

    private findOptimalGreenfieldForTwoSources(idA: string, idB: string): BuildOrder[] {
        const structA: Structure | null = Game.getObjectById(idA);
        const structB: Structure | null = Game.getObjectById(idB);
        if (structA && structB) {
            const aPos = structA.pos;
            const bPos = structB.pos;

            const centerA: RoomPosition | null = this.traverseDistanceTransformWithCheckBoundedExact(
                aPos,
                this.room.memory.structureDistanceTransform!,
                2,
                this.room.memory.roadAgnosticDistanceTransform!,
                3,
                bPos,
                this.room.controller!.pos,
                this.boundAdd
            );
            const centerB: RoomPosition | null = this.traverseDistanceTransformWithCheckBoundedExact(
                aPos,
                this.room.memory.structureDistanceTransform!,
                2,
                this.room.memory.roadAgnosticDistanceTransform!,
                3,
                aPos,
                this.room.controller!.pos,
                this.boundAdd
            );
            if (centerA && centerB) {
                if (this.extensionsToPlan > 5) {
                    return _.concat(this.PlotFromCenter(centerA, []), this.PlotFromCenter(centerB, []));
                }
                if (aPos.getRangeTo(centerA) < bPos.getRangeTo(centerB)) {
                    // Do A first
                    return this.PlotFromCenter(centerA, []);
                } else {
                    // Do B first
                    return this.PlotFromCenter(centerB, []);
                }
            } else if (centerA) {
                return this.PlotFromCenter(centerA, []);
            } else if (centerB) {
                return this.PlotFromCenter(centerB, []);
            } else {
                console.log("Could not determine a position for greenfield.");
                return [];
            }
        }
        return [];
    }

    //* General Pre Handoff Testing
    private checkCenterIsCenterForGivenProspects(center: RoomPosition, prospects: RoomPosition[]): boolean {
        for (const p of prospects) {
            if (this.calculateOrthogonalDistance(center, p) > 1) {
                return false;
            }
        }
        return true;
    }

    private testCenterPlot(center: RoomPosition, prospects: RoomPosition[]): BuildOrder[] {
        const deserializedExtensionAgnosticDistanceTransform: CostMatrix = PathFinder.CostMatrix.deserialize(
            this.room.memory.extensionAgnosticDistanceTransform!
        );
        if (this.checkCenterIsCenterForGivenProspects(center, prospects)) {
            const dtValue = deserializedExtensionAgnosticDistanceTransform.get(center.x, center.y);
            if (dtValue >= 1) {
                // Just dump the entire project in then filter on the end.
                return this.PlotFromCenter(center, prospects);
            }
        }
        return [];
    }

    private PlotFromCenter(center: RoomPosition, prospects: RoomPosition[]) {
        let buildOrders: BuildOrder[] = [this.createExtensionBuildOrder(center.x, center.y)];
        for (const cardinal of this.cardinals) {
            buildOrders.push(this.createExtensionBuildOrder(center.x + cardinal[0], center.y + cardinal[1]));
        }
        for (const prospect of prospects) {
            _.remove(buildOrders, bo => {
                return bo.x === prospect.x && bo.y === prospect.y;
            });
        }
        return _.concat(buildOrders, this.buildRoadDiamond(center.x, center.y - 2));
    }

    private _testCenterPlot(center: RoomPosition, prospects: RoomPosition[]): BuildOrder[] {
        // console.log(`DEBUG center: ${JSON.stringify(center)}`);
        let potentialFailures = center.findInRange(this.allStructurePositions, 2);

        for (const potentialFailure of potentialFailures) {
            const orthogonalDistance = this.calculateOrthogonalDistance(center, potentialFailure);
            if (orthogonalDistance < 3) {
                if (
                    !_.find(prospects, s => {
                        return s.x === potentialFailure.x && s.y === potentialFailure.y;
                    }) &&
                    !_.find(this.allRoads, r => {
                        return r.x === potentialFailure.x && r.y === potentialFailure.y;
                    })
                ) {
                    // console.log(`DEBUG disqualified by: ${JSON.stringify(potentialFailure)}`);
                    // this is a disqualifying position
                    return [];
                }
            }
        }
        // Just dump the entire project in then filter on the end.
        let buildOrders: BuildOrder[] = [this.createExtensionBuildOrder(center.x, center.y)];
        for (const cardinal of this.cardinals) {
            buildOrders.push(this.createExtensionBuildOrder(center.x + cardinal[0], center.y + cardinal[1]));
        }
        for (const prospect of prospects) {
            _.remove(buildOrders, bo => {
                return bo.x === prospect.x && bo.y === prospect.y;
            });
        }

        return _.concat(buildOrders, this.buildRoadDiamond(center.x, center.y - 2));
    }

    //* Generic Assistive Methods
    private cacheRoads(buildOrders: BuildOrder[]) {
        if (!this.room.memory.reservedBuilds) {
            this.room.memory.reservedBuilds = buildOrders;
        } else {
            this.room.memory.reservedBuilds = _.concat(this.room.memory.reservedBuilds, buildOrders);
        }
    }

    private collectRoads() {
        const builtRoads = this.room.find(FIND_STRUCTURES, {
            filter: s => {
                return s.structureType === STRUCTURE_ROAD;
            }
        });
        // console.log(`Built Roads: ${JSON.stringify(builtRoads)}`);
        if (builtRoads.length > 0) {
            this.allRoads = _.map(builtRoads, r => r.pos);
        }
        const reservedRoads = _.filter(this.room.memory.reservedBuilds, rb => rb.type === STRUCTURE_ROAD);
        // console.log(`Reserved Roads: ${JSON.stringify(reservedRoads)}`);
        if (reservedRoads.length > 0) {
            this.allRoads = _.concat(
                this.allRoads,
                _.map(reservedRoads, r => new RoomPosition(r.x, r.y, this.room.name))
            );
        }
        // console.log(`All Roads Merged: ${JSON.stringify(this.allRoads)}`);
    }

    private updateStructureArrays(buildOrders: BuildOrder[]) {
        // Since we are adding only complete full orders of extensions, we can just treat these as roads.

        const exBOs = _.remove(buildOrders, bo => bo.type === STRUCTURE_EXTENSION);
        const exRPs = _.map(exBOs, bo => {
            return new RoomPosition(bo.x, bo.y, this.room.name);
        });

        this.allStructurePositions = _.concat(this.allStructurePositions, exRPs);

        const rRPs = _.map(buildOrders, bo => {
            return new RoomPosition(bo.x, bo.y, this.room.name);
        });
        this.allRoads = _.concat(this.allRoads, rRPs);
    }

    private determinePartials(): BuildOrder[] {
        let buildOrdersToAdd: BuildOrder[] = [];

        const neighborMaps: NeighboringPositions[] = _.map(this.builtExtensions, ext =>
            this.createNeighboringPositionsForExtension(ext)
        );

        let filteredNeighborMaps = _.filter(neighborMaps, nm => {
            return nm.neighbors.length < 3;
        });

        // After the first filter, filter for bad locations. This filter is done second for efficiency. This may be worth removing.
        filteredNeighborMaps = _.filter(filteredNeighborMaps, nm => {
            return nm.pos.findInRange(this.allStructurePositions, 1).length < 8;
        });

        if (filteredNeighborMaps.length > 0) {
            // We have unsatisfied extensions, we need the extension agnostic distance transform. Do an early return so we can check that it isn't pushing us over.
            if (!this.room.memory.extensionAgnosticDistanceTransform) {
                this.room.memory.extensionAgnosticDistanceTransform = this.distanceTransformOccupied(
                    this.room.name,
                    this.populateAllStructuresExceptExtensions(this.room),
                    true
                ).serialize();
                return [];
            }
            let unsatisfiedExtensions = _.map(filteredNeighborMaps, nm => nm.pos);
            while (unsatisfiedExtensions.length > 0) {
                const plotResults = this.attemptPlotExisting(unsatisfiedExtensions, filteredNeighborMaps);
                for (const rp of plotResults.removals) {
                    _.remove(unsatisfiedExtensions, ue => ue.x === rp.x && ue.y === rp.y);
                    _.remove(filteredNeighborMaps, fnm => fnm.pos.x === rp.x && fnm.pos.y === rp.y);
                }
                buildOrdersToAdd = _.concat(buildOrdersToAdd, plotResults.buildOrders);
            }
        }
        if (buildOrdersToAdd.length > 0) {
            this.noPartials = false;
        } else {
            this.noPartials = true;
        }
        return buildOrdersToAdd;
    }

    private attemptPlotExisting(
        unsatifiedExtensions: RoomPosition[],
        neighboringPositions: NeighboringPositions[]
    ): { removals: RoomPosition[]; buildOrders: BuildOrder[] } {
        // console.log(`DEBUG for attemptPlotExisting ${JSON.stringify(unsatifiedExtensions)}`);
        const prospect = _.first(neighboringPositions);
        if (prospect) {
            const prospects = _.concat([prospect.pos], _.intersection(unsatifiedExtensions, prospect.neighbors));
            const attemptResults = this.attemptIdCenterPosition(prospects);
            // console.log(`DEBUG attemptResults: ${JSON.stringify(attemptResults)}`);
            if (!attemptResults) {
                // This is the exit condition. We should in theory never come here.
                // console.log("Hit that exit condition we weren't supposed to hit attemptPlotExisting");
                return { removals: prospects, buildOrders: [] };
            } else if (attemptResults.length > 0) {
                this.extensionsToPlan -= _.filter(attemptResults, ar => {
                    return ar.type === STRUCTURE_EXTENSION;
                }).length;

                return { removals: prospects, buildOrders: attemptResults };
            }
        } else {
            console.log("Partial unsatisfied extension missing for attemptPlotExisting");
            return { removals: [], buildOrders: [] };
        }
        return { removals: [prospect.pos], buildOrders: [] };
    }

    private attemptIdCenterPosition(prospects: RoomPosition[]): BuildOrder[] | null {
        if (prospects.length >= 3) {
            // With three or more, we have only one possible center position.
            let x = -1;
            let y = -1;
            for (let i = 0; i < prospects.length; i++) {
                const prospect = prospects[i];
                if (
                    _.filter(prospects, p => {
                        return p.x === prospect.x && p.y !== prospect.y;
                    }).length > 0
                ) {
                    x = prospect.x;
                }
                if (
                    _.filter(prospects, p => {
                        return p.x !== prospect.x && p.y === prospect.y;
                    }).length > 0
                ) {
                    y = prospect.y;
                }
                if (x !== -1 && y !== -1) {
                    // We have identified the center
                    const buildOrders = this.testCenterPlot(new RoomPosition(x, y, this.room.name), prospects);
                    if (buildOrders.length > 0) {
                        return buildOrders;
                    } else {
                        return null;
                    }
                }
            }
        }

        let r1Roads: RoomPosition[] = [];
        for (const prospect of prospects) {
            r1Roads = _.concat(r1Roads, prospect.findInRange(this.allRoads, 1));
        }
        if (r1Roads.length > 0) {
            // We have neighboring roads, which means our edge is either defined or we cannot build here.
            const testProspect = _.first(prospects);
            // first test our prospect.
            const buildOrders = this.testCenterPlot(testProspect!, prospects);
            if (buildOrders.length > 0) {
                return buildOrders;
            }
            for (const cardinal of this.cardinals) {
                const centerAttempt: RoomPosition = new RoomPosition(
                    testProspect!.x + cardinal[0],
                    testProspect!.y + cardinal[1],
                    this.room.name
                );
                if (
                    !_.find(r1Roads, r => {
                        return centerAttempt.x === r.x && centerAttempt.y === r.y;
                    })
                ) {
                    const buildOrders = this.testCenterPlot(centerAttempt, prospects);
                    if (buildOrders.length > 0) {
                        return buildOrders;
                    }
                }
            }
        } else {
            // No adjacent roads, these extensions are orphaned.
            this.handleOrphanedExtension(prospects);
            return null;
        }
        return [];
    }

    private createNeighboringPositionsForExtension(ext: RoomPosition): NeighboringPositions {
        const neighboringExtensions: RoomPosition[] = ext.findInRange(this.builtExtensions, 1, {
            filter: (n: RoomPosition) => {
                return n.x != ext.x || n.y != ext.y;
            }
        });
        if (neighboringExtensions.length > 0) {
            return { pos: ext, neighbors: neighboringExtensions };
        } else {
            return { pos: ext, neighbors: [] };
        }
    }

    private handleOrphanedExtension(orphans: RoomPosition[]) {
        console.log(`Determined we had orphans at: ${JSON.stringify(orphans)}`);
        // TODO Remove throw
        //throw "Ahh damn orphans";
        /*
        for (const orphan of orphans) {
            for (const s of orphan.lookFor(LOOK_STRUCTURES)) {
                s.destroy();
            }
		}
		*/
    }

    private pullSources() {
        if (!this.room.memory.sourceMap) {
            this.room.memory.sourceMap = [];
            GetSources(this.room, this.room.memory.sourceMap);
        }
        for (const sourceAssignment of this.room.memory.sourceMap) {
            if (sourceAssignment.id) {
                const source = Game.getObjectById<Source>(sourceAssignment.id);
                if (source) {
                    this.sources.push(source);
                }
            }
        }
    }
}
