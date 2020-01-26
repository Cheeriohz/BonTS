import { ExpeditionResultsHandler } from "./manager.expeditionResultsHandler.abstract";
import _ from "lodash";
import { ExpansionCosting } from "./expansion.expansionCosting";


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
                const destination: Structure | null = Game.getObjectById(id);
                if (destination) {
                    let expansionCosting: ExpansionCosting = new ExpansionCosting(spawn.pos, destination.pos, destination.id, 1);
                    costings.push(expansionCosting);
                }
            }
            let selection: ExpansionCosting;
            let lowestCost: number = Number.MAX_VALUE;
            _.forEach(costings, (c) => { if (c.cost < lowestCost) { lowestCost = c.cost; selection = c; } });

            selection!.translateFullPathToRetainableRoomPaths();
            this.createBuildProjects(spawn, selection!);
        }
    }

    private createBuildProjects(spawn: StructureSpawn, costing: ExpansionCosting) {
        /*for(const rpcr of costing.translatedPath ) {

        }*/
    }

    private createBuildProject() {

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
