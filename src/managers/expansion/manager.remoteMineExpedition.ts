import { ExpeditionResultsHandler } from "./manager.expeditionResultsHandler.abstract";
import _ from "lodash";
import { ExpansionCosting } from "./expansion.expansionCosting";
import { buildProjectCreator } from "building/building.buildProjectCreator";
import { BuildProjectEnum } from "building/interfaces/building.enum";
import { ErrorMapper } from "utils/ErrorMapper";
import { CreepRequester } from "cycle/manager.creepRequester";


export class remoteMineExpeditionHandler extends ExpeditionResultsHandler {
    targetIds: string[];
    name: string;
    constructor(targetIds: string[], name: string) {
        super(targetIds, name);
        this.targetIds = targetIds;
        this.name = name;
    }

    public actionRoutine(spawn: StructureSpawn): void {
        if (this.targetIds.length === 0) {
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
        if (this.targetIds.length > 1) {
            // choose the closest expansion first.
            let costings: ExpansionCosting[] = new Array<ExpansionCosting>();
            for (const id of this.targetIds) {
                const destination: Source | null = Game.getObjectById(id);
                if (destination) {
                    let expansionCosting: ExpansionCosting = new ExpansionCosting(spawn.pos, destination.pos, destination.id, 1);
                    console.log(JSON.stringify(expansionCosting));
                    costings.push(expansionCosting);
                }
            }
            let selection: ExpansionCosting | null = null;
            let lowestCost: number = Number.MAX_VALUE;
            _.forEach(costings, (c) => { if (c.cost < lowestCost) { lowestCost = c.cost; selection = c; } });

            if (selection) {
                selection!.translateFullPathToRetainableRoomPaths();
                if (this.createBuildProjects(spawn, selection)) {
                    this.persistPathingToMemory(spawn, selection);
                    _.remove(spawn.memory!.expeditionResults![0].targetIds, (t) => { return t === selection!.destinationId; });
                }
                else {
                    // Clear the spawn memory as we don't just need a single build snapshot that will then sit in memory.
                    spawn.memory.buildProjects = new Array<BuildProject>();
                }
            }
            else {
                // TODO need to ensure we route scouts
            }
        }
    }

    private persistPathingToMemory(spawn: StructureSpawn, costing: ExpansionCosting) {
        if (!spawn.memory.remoteMines) {
            spawn.memory.remoteMines = new Array<RemoteMine>();
        }

        let pathingLookup: Dictionary<PathStep[][]> = {};
        for (const rpr of costing.translatedPaths) {
            const rprReverse = _.find(costing.translatedPathsReversed, (rprR) => { return rprR.roomName === rpr.roomName; });
            if (rprReverse) {
                pathingLookup[rpr.roomName] = [rpr.path, rprReverse.path]
            }
            else {
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
            pathingLookup: pathingLookup
        };

        spawn.memory.remoteMines = [remoteMine];

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
            }
            else {
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
        }
        else {
            const bpc: buildProjectCreator = new buildProjectCreator(room, spawn);
            bpc.createBuildProjectContainerExpansion(clonedPath, BuildProjectEnum.RemoteContainerExpansion);
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
        if (spawn.memory.remoteMineCount) {
            totalUtilizedContainers += spawn.memory.remoteMineCount;
        }
        if (totalUtilizedContainers < 5) {
            return true;
        }
        else {
            return false;
        }
    }

    public storeResults(spawn: StructureSpawn) {
        // console.log("Storing Remote Mining Expedition Results");
        // console.log(`targetIds: ${this.targetIds} | name: ${this.name}`);
        const expeditionResults = { targetIds: this.targetIds, name: this.name };
        // console.log(`expeditionResults: ${JSON.stringify(expeditionResults)}`);
        if (!spawn.memory.expeditionResults) {
            spawn.memory.expeditionResults = [];
        }
        if (spawn.memory.expeditionResults.length = 0) {
            spawn.memory.expeditionResults = [expeditionResults];
        }
        else {
            spawn.memory.expeditionResults.push(expeditionResults);
        }
    }
}
