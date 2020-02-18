import { ExpeditionResultsHandler } from "./manager.expeditionResultsHandler.abstract";
import _ from "lodash";
import { ExpansionCosting } from "./expansion.expansionCosting";
import { buildProjectCreator } from "building/building.buildProjectCreator";
import { BuildProjectEnum } from "building/interfaces/building.enum";
import { ErrorMapper } from "utils/ErrorMapper";
import { CreepRequester } from "spawning/manager.creepRequester";

export class remoteMineExpeditionHandler extends ExpeditionResultsHandler {
    targets: ExpeditionFoundTarget[];
    name: string;
    constructor(targets: ExpeditionFoundTarget[], name: string) {
        super(targets, name);
        this.targets = targets;
        this.name = name;
    }

    public actionRoutine(spawn: StructureSpawn): void {
        if (this.targets.length === 0) {
            this.removeExpeditionResults(spawn);
            spawn.memory.remoteMineExpansionInProgress = false;
            return;
        }
        if (!this.checkIfExpansionPossible(spawn)) {
            this.removeExpeditionResults(spawn);
            // intentionally leaving the remoteMineExpansion in progress as an indicator to save processing for now.
            return;
        }
        this.chooseExpansionTarget(spawn);
    }

    private chooseExpansionTarget(spawn: StructureSpawn) {
        // // TODO optimize this for single target search
        // TODO trash this whole piece of garbage
        if (this.targets.length > 0) {
            // choose the closest expansion first.
            let costings: ExpansionCosting[] = new Array<ExpansionCosting>();
            for (const target of this.targets) {
                const destination: Source | null = Game.getObjectById(target.id);
                if (destination) {
                    let expansionCosting: ExpansionCosting = new ExpansionCosting(
                        spawn.pos,
                        destination.pos,
                        destination.id,
                        1
                    );
                    // console.log(JSON.stringify(expansionCosting));
                    costings.push(expansionCosting);
                }
            }
            let selection: ExpansionCosting | null = null;
            let lowestCost: number = Number.MAX_VALUE;
            _.forEach(costings, c => {
                if (c.cost < lowestCost) {
                    lowestCost = c.cost;
                    selection = c;
                }
            });

            if (selection) {
                selection!.translateFullPathToRetainableRoomPaths();
                if (this.createBuildProjects(spawn, selection)) {
                    this.persistPathingToMemory(spawn, selection);
                    _.remove(spawn.memory!.expeditionResults![0].targets, t => {
                        return t.id === selection!.destinationId;
                    });
                } else {
                    // Clear the spawn memory as we don't just need a single build snapshot that will then sit in memory.
                    spawn.room.memory.buildProjects = new Array<BuildProject>();
                }
            } else {
                const cr: CreepRequester = new CreepRequester(spawn);
                for (const target of this.targets) {
                    cr.RequestScoutToRoom(target.roomName);
                }
            }
        }
    }

    private persistPathingToMemory(spawn: StructureSpawn, costing: ExpansionCosting) {
        if (!spawn.room.memory.remoteMines) {
            spawn.room.memory.remoteMines = new Array<RemoteMine>();
        }
        if (!spawn.memory.remoteHarvests) {
            spawn.memory.remoteHarvests = new Array<RemoteHarvest>();
        }

        let pathingLookup: Dictionary<PathStep[][]> = {};
        for (const rpr of costing.translatedPaths) {
            const rprReverse = _.find(costing.translatedPathsReversed, rprR => {
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
            vein: <Id<Source>>costing.destinationId,
            pathingLookup: pathingLookup,
            roomName: costing.getDestinationRoomName(),
            reserved: false
        };

        if (spawn.room.memory.remoteMines.length === 0) {
            spawn.room.memory.remoteMines = [remoteMine];
        } else {
            spawn.room.memory.remoteMines.push(remoteMine);
        }

        // Add a remote harvest to the source at least temporarily as the path will already be utilized and it can help speed building.
        const remoteHarvest: RemoteHarvest = {
            harvesters: null,
            vein: <Id<Source>>costing.destinationId,
            pathingLookup: pathingLookup,
            roomName: costing.getDestinationRoomName(),
            reserved: false,
            type: RESOURCE_ENERGY
        };

        if (spawn.memory.remoteHarvests.length === 0) {
            spawn.memory.remoteHarvests = [remoteHarvest];
        } else {
            spawn.memory.remoteHarvests.push(remoteHarvest);
        }
    }

    private createBuildProjects(spawn: StructureSpawn, costing: ExpansionCosting): boolean {
        let success: boolean = true;
        for (let index = 0; index < costing.translatedPaths.length - 1; index++) {
            const translatedPath = costing.translatedPaths[index];
            let clonedPath = _.cloneDeep(translatedPath.path);
            const room: Room | undefined = Game.rooms[translatedPath.roomName];
            if (!room) {
                // Need room visibility.
                const cr: CreepRequester = new CreepRequester(spawn);
                cr.RequestScoutToRoom(translatedPath.roomName);
                success = false;
            } else {
                const bpc: buildProjectCreator = new buildProjectCreator(room, spawn);
                bpc.createBuildProjectHighway(clonedPath, BuildProjectEnum.RemoteContainerExpansion);
            }
        }
        const translatedPath = _.last(costing.translatedPaths);
        let clonedPath = _.cloneDeep(translatedPath!.path);
        const room: Room | undefined = Game.rooms[translatedPath!.roomName];
        if (!room) {
            // Need room visibility.
            const cr: CreepRequester = new CreepRequester(spawn);
            cr.RequestScoutToRoom(translatedPath!.roomName);
            success = false;
        } else {
            const bpc: buildProjectCreator = new buildProjectCreator(room, spawn);
            bpc.createBuildProjectContainerExpansionLegacy(clonedPath, BuildProjectEnum.RemoteContainerExpansion);
        }
        return success;
    }

    private removeExpeditionResults(spawn: StructureSpawn) {
        spawn.memory.expeditionResults = _.drop(spawn.memory.expeditionResults, 1);
    }

    private checkIfExpansionPossible(spawn: StructureSpawn) {
        let totalUtilizedContainers: number = 0;
        if (spawn.room.memory.containerMap) {
            totalUtilizedContainers += spawn.room.memory.containerMap.length;
        }
        if (spawn.room.memory.mine) {
            totalUtilizedContainers += 1;
        }
        if (spawn.room.memory.remoteMines) {
            totalUtilizedContainers += spawn.room.memory.remoteMines.length;
        }
        if (totalUtilizedContainers < 5) {
            return true;
        } else {
            return false;
        }
    }

    public storeResults(spawn: StructureSpawn) {
        // console.log("Storing Remote Mining Expedition Results");
        // console.log(`targetIds: ${this.targetIds} | name: ${this.name}`);
        const expeditionResults = { targets: this.targets, name: this.name };
        // console.log(`expeditionResults: ${JSON.stringify(expeditionResults)}`);
        if (!spawn.memory.expeditionResults) {
            spawn.memory.expeditionResults = [];
        }
        if ((spawn.memory.expeditionResults.length = 0)) {
            spawn.memory.expeditionResults = [expeditionResults];
        } else {
            spawn.memory.expeditionResults.push(expeditionResults);
        }
    }
}
