//reservedBuilds
import _ from "lodash";
import { buildProjectCreator } from "./building.buildProjectCreator";
import { GeneralBuilding } from "./building.general";
import { GetSources } from "caching/manager.sourceSelector";
import { Visualizer } from "./building.visualizer";

export class ExtensionAddition extends GeneralBuilding {
    private spawns!: StructureSpawn[];
    private room!: Room;
    private rt!: RoomTerrain;
    private builtExtensions: RoomPosition[] = [];
    private allStructurePositions: RoomPosition[] = [];
    private allRoads: RoomPosition[] = [];
    private extensionsToPlan: number = 0;
    private sources: Source[] = [];
    private buildRoads: boolean = false;
    private noPartials?: boolean;

    constructor(spawns: StructureSpawn[], buildRoads: boolean) {
        super();
        this.spawns = spawns;
        this.room = _.first(spawns)!.room;
        this.rt = this.room.getTerrain();
        this.buildRoads = buildRoads;
    }

    public alreadyProcessedSuccessfully(extensionCountTarget: number): number {
        for (const spawn of this.spawns) {
            if (spawn.memory.buildProjects && spawn.memory.buildProjects) {
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

    public enqueueExtensionsProject(): boolean {
        this.pullSources();
        if (this.sources.length > 0) {
        } else {
            console.log("Umm, this room has no sources");
            return false;
        }

        this.populateAllStructures();
        this.collectRoads();
        const buildPositions = this.determineBuildPositions();
        if (buildPositions.length > 0) {
            this.createBuildProject(buildPositions);
            return this.extensionsToPlan === 0;
        } else {
            return false;
        }
    }

    private createBuildProject(buildOrders: BuildOrder[]) {
        if (this.buildRoads) {
            // TODO  Balance workload.
            const bpc: buildProjectCreator = new buildProjectCreator(this.room, this.spawns[0]);
            bpc.passThroughCreate(buildOrders);
        } else {
            let cacheOrders: BuildOrder[] = _.uniq(_.remove(buildOrders, bo => bo.type === STRUCTURE_ROAD));
            const bpc: buildProjectCreator = new buildProjectCreator(this.room, this.spawns[0]);
            bpc.passThroughCreate(buildOrders);
            this.cacheRoads(cacheOrders);
        }
    }

    private determineBuildPositions(): BuildOrder[] {
        //let buildOrders: BuildOrder[] = [];
        while (this.extensionsToPlan > 0 && Game.cpu.limit - Game.cpu.getUsed() > 4) {
            if (this.noPartials) {
            } else {
                const partialBuildOrders = this.determinePartials();
                if (partialBuildOrders.length > 0) {
                    return partialBuildOrders;
                    //this.updateStructureArrays(partialBuildOrders);
                    //this.visualizeBuild(partialBuildOrders, this.room.name);
                }
            }
        }
        return [];
    }

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
            // We have unsatisfied extensions.
            let unsatisfiedExtensions = _.map(filteredNeighborMaps, nm => nm.pos);
            while (unsatisfiedExtensions.length > 0) {
                // console.log(`buildOrdersToAdd: ${JSON.stringify(buildOrdersToAdd)}`);
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

    private testCenterPlot(center: RoomPosition, prospects: RoomPosition[]): BuildOrder[] {
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
        throw "Ahh damn orphans";
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
            const source = Game.getObjectById<Source>(sourceAssignment.id);
            if (source) {
                this.sources.push(source);
            }
        }
    }

    private populateAllStructures() {
        this.allStructurePositions = _.map(this.room.find(FIND_STRUCTURES), s => s.pos);
        const reservedBuildPositions = _.map(this.room.memory.reservedBuilds, rb => {
            return new RoomPosition(rb.x, rb.y, this.room.name);
        });
        this.allStructurePositions = _.concat(this.allStructurePositions, reservedBuildPositions);
    }
}
